import { useEffect, useState } from 'react';
import { ChevronDown, History, Loader2 } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { listActivity, listAnalyses, listLots, listRequests, setRequestStatus, type Activity, type RemoteRequest } from '../backend/api';
import { readAnalysis, type AnalysisView } from '../backend/analysisView';

const STATES: RemoteRequest['estado'][] = ['enviado', 'aceptado', 'hecho', 'cancelado'];

/** What the signed-in user did, from the cloud: drone requests (with status) and the activity log. */
export function HistoryPanel() {
  const { t, lang } = useLang();
  const [data, setData] = useState<{ activity: Activity[]; requests: RemoteRequest[]; analyses: AnalysisView[]; lotNames: Record<string, string> } | 'loading' | 'error'>('loading');
  const [openAnalysis, setOpenAnalysis] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([listActivity(), listRequests(), listAnalyses(), listLots()])
      .then(([activity, requests, analyses, lots]) =>
        live && setData({ activity, requests, analyses: analyses.map(readAnalysis), lotNames: Object.fromEntries(lots.map((l) => [l.id, l.nombre])) }),
      )
      .catch(() => live && setData('error'));
    return () => {
      live = false;
    };
  }, []);

  const when = (iso: string) => new Date(iso).toLocaleString(lang === 'es' ? 'es-AR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const describe = (a: Activity) => {
    const d = a.detalle as Record<string, string | number | undefined>;
    return t(`hist.${a.tipo}`, {
      nombre: String(d.nombre ?? ''),
      modelo: String(d.modelo ?? ''),
      ha: d.area_ha !== undefined ? String(Math.round(Number(d.area_ha) * 10) / 10) : '',
      trabajo: d.trabajo ? t(`ops.job.${d.trabajo}`) : '',
      ejecutor: d.ejecutor === 'propio' ? t('hist.propio') : 'Vuelo Verde',
      estado: d.estado ? t(`hist.estado.${d.estado}`) : '',
    });
  };
  const change = async (id: string, estado: RemoteRequest['estado']) => {
    if (typeof data !== 'object') return;
    setData({ ...data, requests: data.requests.map((r) => (r.id === id ? { ...r, estado } : r)) });
    try {
      await setRequestStatus(id, estado);
    } catch {
      setData('error');
    }
  };

  return (
    <section aria-labelledby="hist-h" className="space-y-3 rounded-xl border border-[#DECFA7] bg-white/70 p-4">
      <h3 id="hist-h" className="flex items-center gap-2 text-base font-bold text-[#283618]">
        <History aria-hidden className="h-4 w-4" /> {t('hist.title')}
      </h3>
      {data === 'loading' && (
        <p className="flex items-center gap-2 text-sm"><Loader2 aria-hidden className="h-4 w-4 animate-spin" /> {t('hist.loading')}</p>
      )}
      {data === 'error' && <p className="text-sm font-bold text-[#7A3F0C]">{t('hist.error')}</p>}
      {typeof data === 'object' && (
        <>
          {data.requests.length > 0 && (
            <div>
              <p className="text-sm font-bold text-[#283618]">{t('hist.requests')}</p>
              <ul className="mt-1 divide-y divide-[#EFE3C2] text-sm">
                {data.requests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                    <span>
                      <strong>{t(`ops.job.${r.trabajo}`)}</strong> · {r.ejecutor === 'propio' ? t('hist.propio') : 'Vuelo Verde'}
                      <span className="block text-xs text-[#3B2F20]/80">{when(r.creado_en)}</span>
                    </span>
                    <select
                      aria-label={t('hist.status')}
                      value={r.estado}
                      onChange={(e) => void change(r.id, e.target.value as RemoteRequest['estado'])}
                      className="min-h-[40px] rounded-lg border border-[#DECFA7] bg-white px-2 text-sm"
                    >
                      {STATES.map((s) => (
                        <option key={s} value={s}>{t(`hist.estado.${s}`)}</option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.analyses.length > 0 && (
            <div>
              <p className="text-sm font-bold text-[#283618]">{t('hist.analyses')}</p>
              <ul className="mt-1 divide-y divide-[#EFE3C2] text-sm">
                {data.analyses.map((a) => {
                  const open = openAnalysis === a.id;
                  const tpl = (x: string | null) => (x ? t(`template.${x}`) : t('hist.an.unknown'));
                  const score = (x: number | null) => (x === null ? '—' : `${Math.round(x)}/100`);
                  return (
                    <li key={a.id} className="py-1.5">
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={`an-${a.id}`}
                        onClick={() => setOpenAnalysis(open ? null : a.id)}
                        className="flex w-full min-h-[44px] items-center justify-between gap-2 rounded-lg px-1 text-left hover:bg-[#FEFAE0] focus-visible:outline-2 focus-visible:outline-[#BC6C25]"
                      >
                        <span>
                          <strong>{(a.lotId && data.lotNames[a.lotId]) || t('hist.an.point', { lat: a.lat.toFixed(3), lng: a.lng.toFixed(3) })}</strong>
                          <span className="block text-xs text-[#3B2F20]/80">{when(a.createdOn)} · {score(a.current.score)} → {score(a.alternative.score)}</span>
                        </span>
                        <ChevronDown aria-hidden className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>
                      {open && (
                        <dl id={`an-${a.id}`} className="mt-1 grid gap-x-3 gap-y-1 rounded-lg bg-[#FEFAE0] p-3 text-xs sm:grid-cols-[auto_1fr]">
                          <dt className="font-bold">{t('hist.an.today')}</dt>
                          <dd>{tpl(a.current.template)} · {score(a.current.score)}{a.current.bareMonths !== null && ` · ${t('hist.an.bare', { n: String(a.current.bareMonths) })}`}</dd>
                          <dt className="font-bold">{t('hist.an.alt')}</dt>
                          <dd>
                            {tpl(a.alternative.template)} · {score(a.alternative.score)}
                            {a.alternative.bareMonths !== null && ` · ${t('hist.an.bare', { n: String(a.alternative.bareMonths) })}`}
                            {a.alternative.suitable === false && ` · ${t('hist.an.unsuitable')}`}
                          </dd>
                          <dt className="font-bold">{t('hist.an.irrigation')}</dt>
                          <dd>
                            {a.irrigationMm ? `${a.irrigationMm} mm` : t('hist.an.rainfed')}
                            {a.irrigationMm && a.irrigationSystem ? ` · ${t(`irr.${a.irrigationSystem}`)}` : ''}
                          </dd>
                          {a.priorities.length > 0 && (
                            <>
                              <dt className="font-bold">{t('hist.an.priorities')}</dt>
                              <dd>{a.priorities.slice(0, 3).map((p) => `${t(`dim.${p.key}`)} (${p.weight})`).join(', ')}</dd>
                            </>
                          )}
                          {a.years !== null && (
                            <>
                              <dt className="font-bold">{t('hist.an.climate')}</dt>
                              <dd>{t('hist.an.years', { n: String(a.years) })}</dd>
                            </>
                          )}
                          <dd className="sm:col-span-2 text-[#3B2F20]/80">{t('hist.an.note')}</dd>
                        </dl>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {data.activity.length === 0 ? (
            <p className="text-sm text-[#3B2F20]">{t('hist.empty')}</p>
          ) : (
            <ol className="max-h-56 overflow-y-auto text-sm">
              {data.activity.map((a) => (
                <li key={a.id} className="flex gap-3 py-1">
                  <span className="w-28 shrink-0 text-xs tabular-nums text-[#3B2F20]/75">{when(a.creado_en)}</span>
                  <span>{describe(a)}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
}
