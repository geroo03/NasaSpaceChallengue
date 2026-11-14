import type { ReactNode } from 'react';
import { useLang } from '../../i18n/LangContext';
import { RESOURCES, toFarmContext, type FarmCase } from '../../case/model';
import { polygonAreaHa as areaHa } from '../../imagery/flightOrder';
import { SAVED_SNAPSHOT, snapshotMatches } from '../../case/climateSource';
import { Notice, ProvTag, linkBtn, type Provenance } from '../ui';

function Row({ label, onEdit, children, prov }: { label: string; onEdit: () => void; children: ReactNode; prov: Provenance }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 py-4 border-b border-[#EFE3C2] last:border-0">
      <div className="sm:w-48 shrink-0 flex items-center gap-2">
        <span className="font-bold text-[#283618]">{label}</span>
      </div>
      <div className="flex-1 text-sm text-[#3B2F20] space-y-1">
        <ProvTag kind={prov} />
        <div>{children}</div>
      </div>
      <button type="button" onClick={onEdit} className={`${linkBtn} self-start text-sm`} aria-label={`${t('review.edit')}: ${label}`}>
        {t('review.edit')}
      </button>
    </div>
  );
}

export function StepReview({ value, goTo }: { value: FarmCase; goTo: (step: number) => void }) {
  const { t, num } = useLang();
  const { assumptions } = toFarmContext(value);
  const declared = RESOURCES.filter((r) => value.resources[r] !== 'unknown').length;
  const place = value.lotPolygon
    ? t('review.lotPlace', { ha: num(areaHa(value.lotPolygon), 1) })
    : value.placeId
      ? t(`loc.place.${value.placeId}`)
      : t('loc.place.custom');
  const slopeProv: Provenance =
    value.slope === 'unknown' ? 'unknown' : value.slopeSource === 'srtm' ? 'source' : value.slopeSource === 'drone' ? 'measured' : 'declared';
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#DECFA7] bg-white px-4">
        <Row label={t('review.location')} onEdit={() => goTo(0)} prov="declared">
          {place} · {value.lat.toFixed(4)}, {value.lon.toFixed(4)} · {t('review.years', { n: value.years })}
        </Row>
        <Row label={t('review.terrain')} onEdit={() => goTo(0)} prov={slopeProv}>
          {t('loc.slope')} {t(`slope.${value.slope}`)}
          {value.terrain && ` (${num(value.terrain.slopePct, 1)} %${value.slopeSource && value.slopeSource !== 'declared' ? ` · ${t(`terrain.src.${value.slopeSource}`)}` : ''})`} · {t('loc.soil')} {t(`soil.${value.soilTexture}`)}
        </Row>
        <Row label={t('review.current')} onEdit={() => goTo(1)} prov={value.currentChoice === 'preset' ? 'declared' : 'assumed'}>
          {value.currentChoice === 'other' && value.otherCrop && <strong>{value.otherCrop} → </strong>}
          {t(`template.${value.currentTemplate}`)}
        </Row>
        <Row label={t('review.resources')} onEdit={() => goTo(2)} prov={declared === 0 ? 'unknown' : 'declared'}>
          {t('review.resCount', { declared, unknown: RESOURCES.length - declared })}
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {RESOURCES.map((r) => (
              <li key={r}>
                <strong>{t(`res.${r}`)}:</strong> {t(`access.${value.resources[r]}`)}
              </li>
            ))}
          </ul>
          <span className="mt-1 block text-xs font-bold text-[#7A3F0C]">{t('res.pending')}</span>
        </Row>
        <Row label={t('review.priorities')} onEdit={() => goTo(3)} prov="declared">
          {value.goals.length ? value.goals.map((g) => t(`goal.${g}`)).join(' · ') : t('review.noGoals')}
        </Row>
      </div>
      {assumptions.length > 0 && (
        <Notice tone="warn">
          <strong className="block mb-1">{t('res.assumptions')}</strong>
          <ul className="list-disc pl-5 space-y-0.5">
            {assumptions.map((a) => (
              <li key={a}>{t(`assume.${a}`)}</li>
            ))}
          </ul>
        </Notice>
      )}
      {snapshotMatches(value.lat, value.lon) && (
        <p className="text-xs text-[#3B2F20]/85">
          {t('review.savedNote', { from: SAVED_SNAPSHOT.startYear, to: SAVED_SNAPSHOT.endYear, date: SAVED_SNAPSHOT.retrievedOn })}
        </p>
      )}
    </div>
  );
}
