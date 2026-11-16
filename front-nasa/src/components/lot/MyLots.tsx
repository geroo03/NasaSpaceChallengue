import { useCallback, useEffect, useId, useState } from 'react';
import { FolderOpen, Loader2, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { deleteLot, listLots, updateLot, type RemoteLot } from '../../backend/api';
import { Notice, secondaryBtn } from '../ui';
import { forgetLot } from '../../backend/cloudLog';
import { currentSession } from '../../backend/supabase';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; lots: RemoteLot[] };

/** The signed-in user's saved fields: open one in the flow, rename it or delete it. Only shown with a session. */
export function MyLots({ onOpen, activeId }: { onOpen: (lot: RemoteLot) => void; activeId?: string | null }) {
  const { t, num, lang } = useLang();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState(false);
  const headingId = useId();

  const load = useCallback(() => {
    setState({ status: 'loading' });
    listLots()
      .then((lots) => setState({ status: 'ready', lots }))
      .catch(() => setState({ status: 'error' }));
  }, []);
  useEffect(load, [load]);

  const when = (iso: string) => new Date(iso).toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const replace = (lot: RemoteLot) => state.status === 'ready' && setState({ status: 'ready', lots: state.lots.map((l) => (l.id === lot.id ? lot : l)) });

  const saveName = async (lot: RemoteLot) => {
    const nombre = draft.trim();
    if (!nombre || nombre === lot.nombre) return setRenaming(null);
    setBusy(lot.id);
    setActionError(false);
    try {
      replace(await updateLot(lot.id, { nombre }));
      setRenaming(null);
      setMessage(t('lots.renamed', { name: nombre }));
    } catch {
      setActionError(true);
    } finally {
      setBusy(null);
    }
  };
  const remove = async (lot: RemoteLot) => {
    setBusy(lot.id);
    setActionError(false);
    try {
      await deleteLot(lot.id);
      void currentSession().then((ses) => ses && forgetLot(ses.user.id, lot.id));
      if (state.status === 'ready') setState({ status: 'ready', lots: state.lots.filter((l) => l.id !== lot.id) });
      setConfirming(null);
      setMessage(t('lots.deleted', { name: lot.nombre }));
    } catch {
      setActionError(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-[#DECFA7] bg-white/70 p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className="flex items-center gap-2 text-lg font-bold text-[#283618]">
          <FolderOpen aria-hidden className="h-5 w-5" /> {t('lots.title')}
        </h2>
        {state.status !== 'loading' && (
          <button type="button" onClick={load} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-[#9A5518] hover:bg-[#FEFAE0] focus-visible:outline-2 focus-visible:outline-[#BC6C25]">
            <RefreshCw aria-hidden className="h-4 w-4" /> {t('lots.refresh')}
          </button>
        )}
      </div>
      <p className="sr-only" role="status" aria-live="polite">{message}</p>

      {state.status === 'loading' && (
        <p className="flex items-center gap-2 text-sm text-[#3B2F20]" role="status">
          <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" /> {t('lots.loading')}
        </p>
      )}
      {state.status === 'error' && (
        <Notice tone="warn">
          {t('lots.error')}{' '}
          <button type="button" onClick={load} className="font-bold underline underline-offset-2">{t('lots.retry')}</button>
        </Notice>
      )}
      {state.status === 'ready' && state.lots.length === 0 && <p className="text-sm text-[#3B2F20]">{t('lots.empty')}</p>}
      {actionError && <Notice tone="error">{t('lots.actionError')}</Notice>}

      {state.status === 'ready' && state.lots.length > 0 && (
        <ul className="divide-y divide-[#EFE3C2]">
          {state.lots.map((lot) => {
            const active = lot.id === activeId;
            return (
              <li key={lot.id} className="py-3">
                {renaming === lot.id ? (
                  <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void saveName(lot);
                    }}
                  >
                    <label className="min-w-0 flex-1 text-sm font-bold text-[#283618]">
                      {t('lots.newName')}
                      <input
                        autoFocus
                        maxLength={120}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Escape' && setRenaming(null)}
                        className="mt-1 w-full min-h-[44px] rounded-lg border border-[#DECFA7] bg-white px-3 font-normal"
                      />
                    </label>
                    <button type="submit" className={secondaryBtn} disabled={busy === lot.id || !draft.trim()}>{t('lots.save')}</button>
                    <button type="button" className="min-h-[44px] px-3 text-sm font-bold text-[#3B2F20] underline underline-offset-2" onClick={() => setRenaming(null)}>{t('lots.cancel')}</button>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-[#283618]">
                        {lot.nombre}
                        {active && <span className="ml-2 rounded-full bg-[#E3EBDD] px-2 py-0.5 text-[11px] font-bold text-[#283618]">{t('lots.open')}</span>}
                      </p>
                      <p className="text-xs text-[#3B2F20]/85">
                        {num(Number(lot.area_ha), 1)} ha · {t(`lots.origen.${lot.origen}`)} · {when(lot.creado_en)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => onOpen(lot)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#283618] px-3 text-sm font-bold text-[#FEFAE0] hover:bg-[#1d2711] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BC6C25]" aria-label={t('lots.openAria', { name: lot.nombre })}>
                        <FolderOpen aria-hidden className="h-4 w-4" /> {t('lots.openBtn')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(lot.nombre);
                          setRenaming(lot.id);
                          setConfirming(null);
                        }}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#DECFA7] bg-white px-3 text-sm font-bold text-[#283618] hover:bg-[#E3EBDD] focus-visible:outline-2 focus-visible:outline-[#BC6C25]"
                        aria-label={t('lots.renameAria', { name: lot.nombre })}
                      >
                        <Pencil aria-hidden className="h-4 w-4" /> {t('lots.rename')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(confirming === lot.id ? null : lot.id)}
                        aria-expanded={confirming === lot.id}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#E0A774] bg-white px-3 text-sm font-bold text-[#7A3A0E] hover:bg-[#FBE7D6] focus-visible:outline-2 focus-visible:outline-[#BC6C25]"
                        aria-label={t('lots.deleteAria', { name: lot.nombre })}
                      >
                        <Trash2 aria-hidden className="h-4 w-4" /> {t('lots.delete')}
                      </button>
                    </div>
                    {confirming === lot.id && (
                      <div role="alertdialog" aria-label={t('lots.confirmTitle', { name: lot.nombre })} className="basis-full rounded-xl border-2 border-[#E0A774] bg-[#FBF1DD] p-3 text-sm text-[#283618]">
                        <p>
                          <strong className="block">{t('lots.confirmTitle', { name: lot.nombre })}</strong>
                          {t('lots.confirmText')}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" autoFocus disabled={busy === lot.id} onClick={() => void remove(lot)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#9A3412] px-3 font-bold text-white hover:bg-[#7A2A0E] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#283618]">
                            {busy === lot.id ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden className="h-4 w-4" />} {t('lots.confirmDelete')}
                          </button>
                          <button type="button" onClick={() => setConfirming(null)} className="min-h-[44px] px-3 font-bold underline underline-offset-2">{t('lots.cancel')}</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
