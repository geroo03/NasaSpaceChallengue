import { useMemo, useState } from 'react';
import { Check, Copy, Download, MessageCircle, Share2 } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { ringCentroid, type FarmCase } from '../../case/model';
import { buildSurveyText, SURVEY_SERVICES, SURVEY_WINDOWS, whatsappLink, type SurveyService, type SurveyWindow } from '../../case/droneRequest';
import { toPosgar } from '../../imagery/crs';
import { buildFlightKml } from '../../imagery/flightOrder';
import { areaHa } from '../../imagery/lotImport';
import { Notice, primaryBtn, secondaryBtn } from '../ui';

// Optional, set in Vercel when Vuelo Verde confirms the contact channel. Never hard-coded.
import { VUELO_VERDE } from '../../case/provider';
const PROVIDER_WHATSAPP = VUELO_VERDE.whatsapp;

function download(name: string, mime: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Drone survey request built from the lot, modelled on the services in Vuelo Verde's technical report. */
export function DroneRequestPanel({ farmCase, checks }: { farmCase: FarmCase; checks?: { when: string; what: string }[] }) {
  const { t, num } = useLang();
  const [services, setServices] = useState<SurveyService[]>(['altimetry', 'ortho']);
  const [when, setWhen] = useState<SurveyWindow>('beforeSowing');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const ring = farmCase.lotPolygon;

  const text = useMemo(() => {
    if (!ring) return '';
    const centre = ringCentroid(ring) ?? [farmCase.lat, farmCase.lon];
    return buildSurveyText(
      {
        services,
        window: when,
        notes,
        areaHa: areaHa(ring),
        centre,
        posgar: toPosgar(centre[0], centre[1]),
        terrain: farmCase.terrain,
        lotLabel: farmCase.lotSource?.parcel ?? null,
        checks,
      },
      t,
      num,
    );
  }, [ring, services, when, notes, farmCase.terrain, farmCase.lotSource, farmCase.lat, farmCase.lon, checks, t, num]);

  const toggle = (s: SurveyService) => setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : SURVEY_SERVICES.filter((x) => x === s || cur.includes(x))));
  const ready = ring !== null && services.length > 0;
  const wa = ready ? whatsappLink(PROVIDER_WHATSAPP, text) : null;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  const kml = () => {
    if (!ring) return;
    const createdOn = new Date().toISOString().slice(0, 10);
    download(
      `lote-relevamiento-${createdOn}.kml`,
      'application/vnd.google-earth.kml+xml',
      buildFlightKml({ title: farmCase.lotSource?.parcel ?? t('req.kmlTitle'), polygon: ring, checks: checks ?? [], createdOn, notes: [t('req.kmlNote')] }),
    );
  };

  return (
    <section aria-labelledby="req-h" className="rounded-xl border border-[#DECFA7] bg-[#FEFAE0] p-4 space-y-4">
      <div>
        <h2 id="req-h" className="text-lg font-bold text-[#283618]">
          {t('req.title')}
        </h2>
        <p className="mt-1 text-sm text-[#3B2F20]/90">{t('req.help')}</p>
      </div>
      {!ring ? (
        <p className="text-sm font-bold text-[#7A3F0C]">{t('req.needLot')}</p>
      ) : (
        <>
          <fieldset>
            <legend className="text-sm font-bold text-[#283618]">{t('req.services')}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {SURVEY_SERVICES.map((s) => (
                <label
                  key={s}
                  className={`flex items-start gap-2 rounded-lg border-2 bg-white p-3 text-sm cursor-pointer ${services.includes(s) ? 'border-[#283618]' : 'border-[#DECFA7]'}`}
                >
                  <input type="checkbox" className="mt-1 accent-[#BC6C25]" checked={services.includes(s)} onChange={() => toggle(s)} />
                  <span>
                    <span className="font-bold text-[#283618]">{t(`req.svc.${s}`)}</span>
                    <span className="block text-xs text-[#3B2F20]/85">{t(`req.svc.${s}.d`)}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)]">
            <label className="text-sm font-bold text-[#283618]">
              {t('req.when')}
              <select value={when} onChange={(e) => setWhen(e.target.value as SurveyWindow)} className="mt-1 block w-full min-h-[44px] rounded-lg border border-[#DECFA7] bg-white px-2 text-sm font-normal">
                {SURVEY_WINDOWS.map((w) => (
                  <option key={w} value={w}>
                    {t(`req.when.${w}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-[#283618]">
              {t('req.notes')}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 600))}
                placeholder={t('req.notesPh')}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-[#DECFA7] bg-white px-3 py-2 text-sm font-normal"
              />
            </label>
          </div>

          {services.length === 0 ? (
            <Notice tone="warn">{t('req.needService')}</Notice>
          ) : (
            <div>
              <p className="text-sm font-bold text-[#283618]">{t('req.preview')}</p>
              <pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[#DECFA7] bg-white p-3 text-xs leading-relaxed font-sans">{text}</pre>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className={primaryBtn}>
                <MessageCircle aria-hidden className="h-4 w-4" /> {t('req.whatsapp')}
              </a>
            )}
            <button type="button" className={wa ? secondaryBtn : primaryBtn} disabled={!ready} onClick={() => void copy()}>
              {copied ? <Check aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />} {copied ? t('req.copied') : t('req.copy')}
            </button>
            {canShare && (
              <button type="button" className={secondaryBtn} disabled={!ready} onClick={() => void navigator.share({ title: t('req.title'), text }).catch(() => undefined)}>
                <Share2 aria-hidden className="h-4 w-4" /> {t('req.share')}
              </button>
            )}
            <button type="button" className={secondaryBtn} onClick={kml}>
              <Download aria-hidden className="h-4 w-4" /> {t('req.kml')}
            </button>
          </div>
          <span aria-live="polite" className="sr-only">
            {copied ? t('req.copied') : ''}
          </span>
          {!wa && <p className="text-xs text-[#3B2F20]/85">{t('req.noContact')}</p>}
        </>
      )}
    </section>
  );
}
