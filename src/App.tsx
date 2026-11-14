import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HeaderBar, type Screen } from './components/HeaderBar';
import { Wizard } from './components/wizard/Wizard';
import { ResultsScreen, type LoadState } from './components/results/ResultsScreen';
import { MethodScreen } from './components/MethodScreen';
import { loadCase, saveCase, withDeclaredSlope, withLot, withTerrain, type FarmCase } from './case/model';
import type { LotApi } from './case/lotApi';
import { sampleSrtm } from './imagery/terrain';
import { loadLive, loadSaved, snapshotMatches } from './case/climateSource';
import { useLang } from './i18n/LangContext';

type View = { kind: 'wizard'; step: number } | { kind: 'results' };

export default function App() {
  const { t } = useLang();
  const [screen, setScreen] = useState<Screen>('explore');
  const [farmCase, setFarmCase] = useState<FarmCase>(loadCase);
  const [view, setView] = useState<View>({ kind: 'wizard', step: 0 });
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
    }),
    [terrainStatus],
  );

  const run = useCallback(
    async (useSaved: boolean, at?: { lat: number; lon: number }) => {
      const lat = at?.lat ?? farmCase.lat;
      const lon = at?.lon ?? farmCase.lon;
      setView({ kind: 'results' });
      window.scrollTo({ top: 0 });
      const key = useSaved ? 'saved' : `${lat.toFixed(4)},${lon.toFixed(4)},${farmCase.years}`;
      const hit = cache.current.get(key);
      if (hit) {
        setLoad({ status: 'ready', data: hit });
        return;
      }
      setLoad({ status: 'loading', saved: useSaved });
      try {
        const data = useSaved ? await loadSaved() : await loadLive(lat, lon, farmCase.years);
        cache.current.set(key, data);
        setLoad({ status: 'ready', data });
      } catch (err) {
        setLoad({
          status: 'error',
          message: err instanceof Error ? err.message : String(err),
          canUseSaved: !useSaved && snapshotMatches(lat, lon),
        });
      }
    },
    [farmCase.lat, farmCase.lon, farmCase.years],
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
        {screen === 'explore' && view.kind === 'wizard' && (
          <Wizard value={farmCase} onChange={patch} step={view.step} setStep={(step) => setView({ kind: 'wizard', step })} onRun={(s) => void run(s)} lot={lot} />
        )}
        {screen === 'explore' && view.kind === 'results' && (
          <ResultsScreen
            farmCase={farmCase}
            onLot={(lotPolygon, lotSource) => lot.setLot(lotPolygon, lotSource, false)}
            lot={lot}
            onAnalyseAt={(lat, lon) => {
              patch({ lat, lon, placeId: null });
              void run(false, { lat, lon });
            }}
            load={load}
            onEdit={(step = 4) => setView({ kind: 'wizard', step })}
            onRetry={() => void run(false)}
            onUseSaved={() => void run(true)}
          />
        )}
      </main>
      <footer className="bg-[#283618] text-[#FEFAE0] mt-12">
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
