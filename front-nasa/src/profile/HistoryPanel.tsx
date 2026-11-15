import { useEffect, useState } from 'react';
import { History, Loader2 } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { listActivity, listRequests, setRequestStatus, type Activity, type RemoteRequest } from '../backend/api';

const STATES: RemoteRequest['estado'][] = ['enviado', 'aceptado', 'hecho', 'cancelado'];

/** What the signed-in user did, from the cloud: drone requests (with status) and the activity log. */
export function HistoryPanel() {
  const { t, lang } = useLang();
  const [data, setData] = useState<{ activity: Activity[]; requests: RemoteRequest[] } | 'loading' | 'error'>('loading');

  useEffect(() => {
    let live = true;
    Promise.all([listActivity(), listRequests()])
      .then(([activity, requests]) => live && setData({ activity, requests }))
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
