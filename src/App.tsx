import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HeaderBar, type Screen } from './components/HeaderBar';
import { LotScreen, coordsValid } from './components/flow/LotScreen';
import { FarmScreen } from './components/flow/FarmScreen';
import { StepNav, type FlowView } from './components/flow/StepNav';
import { ResultsScreen, type LoadState } from './components/results/ResultsScreen';
import { MethodScreen } from './components/MethodScreen';
import { loadCase, saveCase, withDeclaredSlope, withLot, withTerrain, type FarmCase } from './case/model';
import type { LotApi } from './case/lotApi';
import { sampleSrtm } from './imagery/terrain';
import { fetchSoil, SoilError } from './case/soil';
import { loadLive, loadSaved, snapshotMatches } from './case/climateSource';
import { useLang } from './i18n/LangContext';

const HASH: Record<FlowView, string> = { lot: '#/lote', farm: '#/campana', results: '#/opciones' };
function viewFromHash(): FlowView {
  const h = window.location.hash;
  return h === HASH.farm ? 'farm' : 'lot'; // results need a run, so a reload lands on the farm or lot screen
}

export default function App() {
  const { t } = useLang();
  const [screen, setScreen] = useState<Screen>('explore');
  const [farmCase, setFarmCase] = useState<FarmCase>(loadCase);
  const [view, setViewState] = useState<FlowView>(viewFromHash);
  const [load, setLoad] = useState<LoadState>({ status: 'loading', saved: false });
  // In-memory cache so re-entering results for the same point does not download again.
  const cache = useRef<Map<string, Awaited<ReturnType<typeof loadLive>>>>(new Map());

  useEffect(() => saveCase(farmCase), [farmCase]);

  const patch = useCallback((p: Partial<FarmCase>) => setFarmCase((c) => ({ ...c, ...p })), []);

  // Terrain of the lot from NASA SRTM, read once per boundary (a drone DSM, once loaded, is kept).
  const [terrainStatus, setTerrainStatus] = useState<LotApi['terrainStatus']>('idle');
  const [terrainTry, setTerrainTry] = useState(0);
  const ring = farmCase.lotPolygon;
  const needsTerrain = ring !== null && farmCase.terrain === null;
  useEffect(() => {
    if (!ring || !needsTerrain) {
      setTerrainStatus('idle');
      return;
    }
    let alive = true;
    setTerrainStatus('loading');
    sampleSrtm(ring)
      .then(({ stats, sources }) => {
        if (!alive) return;
        if (!stats) {
          setTerrainStatus('error');
          return;
        }
        const { source, samples, meanM, reliefM, slopePct, aspectDeg, slopeClass } = stats;
        const summary = { source, samples, meanM, reliefM, slopePct, aspectDeg, slopeClass, sources };
        setFarmCase((c) => (c.lotPolygon === ring ? withTerrain(c, summary) : c));
        setTerrainStatus('idle');
      })
      .catch(() => alive && setTerrainStatus('error'));
    return () => {
      alive = false;
    };
  }, [ring, needsTerrain, terrainTry]);

  // Soil at the analysis point from SoilGrids; re-read when the point moves (debounced for map clicks and typing).
  const [soilStatus, setSoilStatus] = useState<LotApi['soilStatus']>('idle');
  const [soilTry, setSoilTry] = useState(0);
  const { lat, lon } = farmCase;
  const soilMatches = farmCase.soil !== null && Math.abs(farmCase.soil.lat - lat) < 1e-4 && Math.abs(farmCase.soil.lon - lon) < 1e-4;
  useEffect(() => {
    if (soilMatches || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      setSoilStatus('idle');
      return;
    }
    const ctrl = new AbortController();
    setSoilStatus('loading');
    const timer = setTimeout(() => {
      fetchSoil(lat, lon, ctrl.signal)
        .then((soil) => {
          setFarmCase((c) => (Math.abs(c.lat - lat) < 1e-4 && Math.abs(c.lon - lon) < 1e-4 ? { ...c, soil } : c));
          setSoilStatus('idle');
        })
        .catch((err: unknown) => {
          if (ctrl.signal.aborted) return;
          setSoilStatus(err instanceof SoilError && err.code === 'noData' ? 'noData' : 'error');
        });
    }, 600);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [lat, lon, soilMatches, soilTry]);

  const lot = useMemo<LotApi>(
    () => ({
      terrainStatus,
      retryTerrain: () => setTerrainTry((n) => n + 1),
      setLot: (r, src, movePoint) => setFarmCase((c) => withLot(c, r, src, { movePoint })),
      setTerrain: (tr) => setFarmCase((c) => withTerrain(c, tr)),
      dropDroneTerrain: () =>
        setFarmCase((c) => ({
          ...c,
          terrain: null,
          ...(c.slopeSource === 'drone' ? { slope: 'unknown' as const, slopeSource: null } : {}),
        })),
      setSlope: (s) => setFarmCase((c) => withDeclaredSlope(c, s)),
      soilStatus,
      retrySoil: () => setSoilTry((n) => n + 1),
    }),
    [terrainStatus, soilStatus],
  );

  const setView = useCallback((v: FlowView) => {
    setViewState(v);
    if (window.location.hash !== HASH[v]) window.history.pushState(null, '', HASH[v]);
    window.scrollTo({ top: 0 });
  }, []);
  useEffect(() => {
    const onPop = () => setViewState(window.location.hash === HASH.results ? 'results' : viewFromHash());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /** Live NASA POWER first; if it fails and this point has a saved series, use it and say so. */
  const run = useCallback(
    async (at?: { lat: number; lon: number }) => {
      const lat = at?.lat ?? farmCase.lat;
      const lon = at?.lon ?? farmCase.lon;
      setView('results');
      const key = `${lat.toFixed(4)},${lon.toFixed(4)},${farmCase.years}`;
      const hit = cache.current.get(key);
      if (hit) {
        setLoad({ status: 'ready', data: hit });
        return;
      }
      setLoad({ status: 'loading', saved: false });
      try {
        const data = await loadLive(lat, lon, farmCase.years);
        cache.current.set(key, data);
        setLoad({ status: 'ready', data });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (snapshotMatches(lat, lon)) {
          try {
            const data = { ...(await loadSaved(lat, lon)), liveError: message };
            setLoad({ status: 'ready', data });
            return;
          } catch {
            // fall through to the error screen
          }
        }
        setLoad({ status: 'error', message, canUseSaved: false });
      }
    },
    [farmCase.lat, farmCase.lon, farmCase.years, setView],
  );

  const navigate = (s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen flex flex-col bg-fondo text-[#3B2F20]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[2000] focus:m-2 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        {t('nav.skip')}
      </a>
      <HeaderBar screen={screen} onNavigate={navigate} />
      <main id="main" className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
        {screen === 'method' && <MethodScreen />}
        {screen === 'explore' && (
          <div className="print:hidden">
            <StepNav view={view} canGo={coordsValid(farmCase)} onGo={(v) => (v === 'results' ? void run() : setView(v))} />
          </div>
        )}
        {screen === 'explore' && view === 'lot' && <LotScreen value={farmCase} onChange={patch} lot={lot} onNext={() => setView('farm')} />}
        {screen === 'explore' && view === 'farm' && <FarmScreen value={farmCase} onChange={patch} onBack={() => setView('lot')} onRun={() => void run()} />}
        {screen === 'explore' && view === 'results' && (
          <ResultsScreen
            farmCase={farmCase}
            onLot={(lotPolygon, lotSource) => lot.setLot(lotPolygon, lotSource, false)}
            lot={lot}
            onAnalyseAt={(lat, lon) => {
              patch({ lat, lon, placeId: null });
              void run({ lat, lon });
            }}
            load={load}
            onEdit={(v) => setView(v)}
            onRetry={() => void run()}
          />
        )}
      </main>
      <footer className="print:hidden bg-[#283618] text-[#FEFAE0] mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-2">
          <p className="text-base tracking-[0.06em]">
            <span className="font-extralight uppercase">FIELD</span>
            <span className="font-bold uppercase">SHIFT</span>
            <span className="ml-2 text-sm text-[#E3EBDD]">NASA Space Apps 2026</span>
          </p>
          <p className="text-xs text-[#E3EBDD]">{t('footer.sources')}</p>
          <p className="text-xs text-[#A3B18A]">{t('footer.disclaimer')}</p>
        </div>
      </footer>
    </div>
  );
}
