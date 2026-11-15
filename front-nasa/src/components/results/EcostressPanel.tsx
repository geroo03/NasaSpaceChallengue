import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, RefreshCw, Satellite, Upload } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { appeearsTask, defaultPeriod, ECOSTRESS_PRODUCT, EcostressError, hasEcostressSnapshot, loadEcostressSnapshot, MAX_CSV_BYTES, parseEcostressCsv, searchEcostress, validateExtraction, type EcostressData, type EcostressScene, type Point } from '../../ecostress/data';
import { ecostressApi, startEcostress } from '../../ecostress/client';
import { persistEcostress, readEcostress, type SavedEcostress as Saved } from '../../ecostress/storage';
import { Card, Collapsible, Notice, primaryBtn, secondaryBtn } from '../ui';

/** Point extraction, never an area mean or an automatic calibration of the historical rotation index. */
export function EcostressPanel({ lat, lon }: Point) {
  const { t, num } = useLang();
  const point = { lat, lon };
  const [saved, setSaved] = useState<Saved>(() => readEcostress(point));
  const [data, setData] = useState<EcostressData | null>(() => saved.csv ? parseEcostressCsv(saved.csv, point) : null);
  const [period, setPeriod] = useState(defaultPeriod);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scenes, setScenes] = useState<EcostressScene[] | null>(null);
  const [searching, setSearching] = useState(false);
  const alive = useRef(true);
  const action = useRef<AbortController | null>(null);
  const polling = useRef<AbortController | null>(null);
  const search = useRef<AbortController | null>(null);
  useEffect(() => {
    alive.current = true;
    const ctrl = new AbortController();
    void ecostressApi({ signal: ctrl.signal }).then((r) => { if (!ctrl.signal.aborted) setConfigured(r.configured === true); }).catch(() => undefined);
    return () => { alive.current = false; ctrl.abort(); action.current?.abort(); search.current?.abort(); };
  }, []);

  const fail = (e: unknown) => e instanceof EcostressError ? e.code : 'network';
  const keep = (csv: string, source: Saved['source'], fileName?: string, retrievedOn = new Date().toISOString().slice(0, 10)) => {
    const parsed = parseEcostressCsv(csv, point);
    polling.current?.abort();
    const next: Saved = { csv, source, fileName, retrievedOn };
    setData(parsed); setSaved(next); persistEcostress(point, next); setError(null);
  };

  // A signed task can be resumed after leaving this screen or reopening the app. No credentials in storage.
  useEffect(() => {
    if (!saved.job || paused) return;
    const ctrl = new AbortController(); polling.current = ctrl; let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      try {
        const r = await ecostressApi({ signal: ctrl.signal }, saved.job);
        if (ctrl.signal.aborted) return;
        if (r.status === 'done' && typeof r.csv === 'string') keep(r.csv, 'appeears');
        else if (r.status === 'pending') timer = setTimeout(() => void check(), 10_000);
        else throw new EcostressError('network');
      } catch (e) {
        if (!ctrl.signal.aborted) { setError(fail(e)); setPaused(true); }
      }
    };
    void check();
    return () => { ctrl.abort(); clearTimeout(timer); };
    // Point changes remount this component; the job belongs to that point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved.job, paused]);

  const find = async () => {
    search.current?.abort(); const ctrl = new AbortController(); search.current = ctrl;
    setSearching(true); setError(null); setScenes(null);
    try {
      const x = validateExtraction({ ...point, ...period });
      const list = await searchEcostress(x, ctrl.signal);
      if (!ctrl.signal.aborted) setScenes(list);
    } catch (e) { if (!ctrl.signal.aborted) setError(fail(e)); }
    finally { if (!ctrl.signal.aborted) setSearching(false); }
  };
  const extract = async () => {
    action.current?.abort(); const ctrl = new AbortController(); action.current = ctrl;
    setBusy(true); setError(null);
    try {
      const r = await startEcostress(validateExtraction({ ...point, ...period }), ctrl.signal);
      if (!ctrl.signal.aborted && r.status === 'done' && typeof r.csv === 'string') keep(r.csv, r.source ?? 'appeears');
      else if (!ctrl.signal.aborted && r.status === 'pending' && typeof r.job === 'string') {
        const next = { ...saved, job: r.job }; setSaved(next); persistEcostress(point, next); setPaused(false);
      } else if (!ctrl.signal.aborted) throw new EcostressError('network');
    } catch (e) { if (!ctrl.signal.aborted) setError(fail(e)); }
    finally { if (!ctrl.signal.aborted) setBusy(false); }
  };
  const importCsv = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      if (file.size > MAX_CSV_BYTES) throw new EcostressError('large');
      const csv = await file.text();
      if (!alive.current) return;
      action.current?.abort(); setBusy(false); keep(csv, 'file', file.name);
    } catch (e) { if (alive.current) setError(fail(e)); }
  };
  const loadSaved = async () => {
    action.current?.abort(); const ctrl = new AbortController(); action.current = ctrl;
    setBusy(true); setError(null);
    try {
      const s = await loadEcostressSnapshot(point, ctrl.signal);
      if (!ctrl.signal.aborted) keep(s.csv, 'saved', undefined, s.retrievedOn);
    } catch (e) { if (!ctrl.signal.aborted) setError(fail(e)); }
    finally { if (!ctrl.signal.aborted) setBusy(false); }
  };
  const requestFile = () => {
    try {
      const x = validateExtraction({ ...point, ...period });
      const blob = new Blob([JSON.stringify(appeearsTask(x), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = 'field-shift-ecostress-request.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(fail(e)); }
  };
  const latest = data?.observations[0];
  const waiting = Boolean(saved.job) && !paused;
  return (
    <Card className="space-y-4" as="section">
      <div className="flex flex-wrap items-center gap-2">
        <Satellite aria-hidden className="h-5 w-5 text-[#606C38]" />
        <h2 className="text-xl font-bold text-[#283618]">{t('eco.title')}</h2>
        <span className="rounded-full border border-[#C9B27C] bg-[#EFE3C2] px-2 py-0.5 text-[11px] font-bold">{t('eco.provenance')}</span>
      </div>
      <p className="text-sm">{t('eco.help')}</p>
      <p className="text-xs text-[#3B2F20]/85">{t('eco.point', { lat: lat.toFixed(5), lon: lon.toFixed(5) })}</p>
      {hasEcostressSnapshot(point) && <button type="button" className={secondaryBtn} disabled={busy || waiting} onClick={() => void loadSaved()}><Download aria-hidden className="h-4 w-4" />{t('eco.saved')}</button>}
      {latest && (
        <div className="rounded-xl border border-[#A3B18A] bg-[#E3EBDD] p-4">
          <p className="text-sm font-bold">{t('eco.latest', { date: latest.date })}</p>
          <p className="mt-1 text-2xl font-bold text-[#283618]">{num(latest.etMmDay, 2)} <span className="text-base">{t('eco.unit')}</span></p>
          <p className="mt-1 text-xs">{t('eco.flux')}</p>
        </div>
      )}
      {data && (
        <div className="space-y-2 text-sm">
          <p>{t('eco.quality', { valid: data.observations.length, cloud: data.rejected.cloud, water: data.rejected.water, missing: data.rejected.missing })}</p>
          {!latest && <Notice tone="warn">{t('eco.noValid')}</Notice>}
          {data.otherPoints > 0 && <p className="text-xs">{t('eco.other', { n: data.otherPoints })}</p>}
          <p className="text-xs break-words">{ECOSTRESS_PRODUCT} · {saved.source === 'file' ? t('eco.file', { name: saved.fileName ?? 'CSV' }) : saved.source === 'earthdata' || saved.source === 'saved' ? t(`eco.origin.${saved.source}`) : 'AppEEARS'} · {t('eco.loaded', { date: saved.retrievedOn ?? '' })}</p>
          {latest && <Collapsible title={t('eco.table')}>
            <table className="w-full text-sm tabular-nums">
              <caption className="py-2 text-left text-xs">{t('eco.tableNote')}</caption>
              <thead><tr><th scope="col" className="text-left">{t('eco.date')}</th><th scope="col" className="text-right">ETdaily ({t('eco.unit')})</th></tr></thead>
              <tbody>{data.observations.slice(0, 10).map((o, i) => <tr key={`${o.date}-${i}`} className="border-t border-[#DECFA7]"><td className="py-2">{o.date}</td><td className="text-right">{num(o.etMmDay, 2)}</td></tr>)}</tbody>
            </table>
          </Collapsible>}
          <button type="button" className="min-h-[44px] underline" onClick={() => { polling.current?.abort(); setData(null); setSaved({}); persistEcostress(point, {}); setPaused(false); }}>{t('eco.clear')}</button>
        </div>
      )}
      <Collapsible title={t('eco.connect')}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {(['from', 'to'] as const).map((k) => <label key={k} className="text-sm font-bold">
              {t(`eco.${k}`)}<input type="date" value={period[k]} disabled={waiting || busy || searching} min="2018-07-01" max={new Date().toISOString().slice(0, 10)} onChange={(e) => { setPeriod({ ...period, [k]: e.target.value }); setScenes(null); }} className="mt-1 block w-full min-h-[44px] rounded-lg border border-[#DECFA7] bg-white px-3 font-normal" />
            </label>)}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondaryBtn} disabled={searching} onClick={() => void find()}>{searching ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Satellite aria-hidden className="h-4 w-4" />}{t('eco.search')}</button>
            {configured && <button type="button" className={primaryBtn} disabled={busy || waiting} onClick={() => void extract()}>{busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <RefreshCw aria-hidden className="h-4 w-4" />}{t('eco.extract')}</button>}
          </div>
          {scenes !== null && <div className="text-xs space-y-2">
            <p>{t(scenes.length ? 'eco.scenes' : 'eco.noScenes', { n: scenes.length })}</p>
            <ul className="space-y-1">{scenes.map((s) => <li key={s.id}><a className="underline" target="_blank" rel="noreferrer" href={`https://cmr.earthdata.nasa.gov/search/concepts/${encodeURIComponent(s.id)}.umm_json`}>{s.acquiredAt.replace('T', ' ').replace('Z', ' UTC')}</a></li>)}</ul>
            {scenes.length > 0 && <p>{t('eco.catalogNote')}</p>}
          </div>}
          {!configured && <p className="text-sm">{t('eco.setup')}</p>}
          <div className="flex flex-wrap gap-2">
            <label className={`${secondaryBtn} cursor-pointer`}><Upload aria-hidden className="h-4 w-4" />{t('eco.upload')}<input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { void importCsv(e.target.files?.[0]); e.target.value = ''; }} /></label>
            <button type="button" className={secondaryBtn} onClick={requestFile}><Download aria-hidden className="h-4 w-4" />{t('eco.request')}</button>
            <a className={secondaryBtn} href="https://appeears.earthdatacloud.nasa.gov/" target="_blank" rel="noreferrer">AppEEARS ↗</a>
          </div>
          <p className="text-xs">{t('eco.instructions')}</p>
        </div>
      </Collapsible>
      {waiting && <p role="status" className="flex items-start gap-2 text-sm"><Loader2 aria-hidden className="h-5 w-5 shrink-0 animate-spin" />{t('eco.pending')}</p>}
      {waiting && <button type="button" className={secondaryBtn} onClick={() => { polling.current?.abort(); const next = { ...saved }; delete next.job; setSaved(next); persistEcostress(point, next); }}>{t('eco.stop')}</button>}
      {error && <Notice tone="error">{t(`eco.error.${error}`) === `eco.error.${error}` ? t('eco.error.network') : t(`eco.error.${error}`)}</Notice>}
      {paused && saved.job && <button type="button" className={secondaryBtn} onClick={() => { setError(null); setPaused(false); }}>{t('eco.resume')}</button>}
      <p className="text-xs text-[#3B2F20]/85">{t('eco.limit')}</p>
      <a className="inline-block min-h-[44px] py-3 text-xs underline" href="https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002" target="_blank" rel="noreferrer">{t('eco.documentation')}</a>
    </Card>
  );
}
