import { ArrowLeft, Printer } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import type { Scenario } from '../../engine/analysis/climate';
import type { StrategyResult } from '../../engine/domain/rotations';
import { RESOURCES, ringCentroid, toFarmContext, type AssumptionKey, type FarmCase } from '../../case/model';
import { DEFAULT_PAW_MM } from '../../engine/domain/rotations';
import type { LoadedSeries } from '../../case/climateSource';
import { polygonAreaHa } from '../../imagery/flightOrder';
import { CROP_COLORS, cropAbbr, primaryBtn, secondaryBtn, textOn } from '../ui';

function Calendar({ s, label }: { s: StrategyResult; label: string }) {
  const { lang, months } = useLang();
  return (
    <div className="mt-2">
      <p className="text-xs font-bold">{label}</p>
      <div className="mt-1 grid grid-cols-24 gap-px text-[8px] leading-tight">
        {s.timeline.map((c) => {
          const bg = c.crop ? CROP_COLORS[c.crop] : '#F4EAD2';
          return (
            <div key={c.index} className="flex h-9 flex-col items-center justify-center border border-[#DECFA7]" style={{ background: bg, color: c.crop ? textOn(bg) : '#3B2F20' }}>
              <span>{months[c.calendarMonth - 1]}</span>
              <span className="font-bold">{c.crop ? cropAbbr(lang, c.crop) : '·'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid border-t border-[#3B2F20]/30 pt-3">
      <h2 className="text-sm font-bold uppercase tracking-[0.06em] text-[#283618]">{title}</h2>
      <div className="mt-1.5 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

/** One printable page (or PDF) to hand to an adviser or a drone pilot. Everything on it says where it comes from. */
export function FieldSheet({
  farmCase,
  data,
  from,
  to,
  scenario,
  reference,
  option,
  why,
  watch,
  checks,
  assumptions,
  alerts,
  onClose,
}: {
  farmCase: FarmCase;
  data: LoadedSeries;
  from: number;
  to: number;
  scenario: Scenario | null;
  reference: StrategyResult;
  option: StrategyResult;
  why: string[];
  watch: string[];
  checks: { when: string; what: string }[];
  assumptions: AssumptionKey[];
  alerts: { enso: string; heat: string[]; water: string[] };
  onClose: () => void;
}) {
  const { t, num, crop, lang } = useLang();
  const ring = farmCase.lotPolygon;
  const centre = ring ? ringCentroid(ring) : null;
  const terrain = farmCase.terrain;
  const today = new Date().toISOString().slice(0, 10);
  const used = new Set([...reference.timeline, ...option.timeline].map((c) => c.crop).filter((c): c is NonNullable<typeof c> => c !== null));
  const { farm } = toFarmContext(farmCase);
  const soilHere = farmCase.soil && Math.abs(farmCase.soil.lat - farmCase.lat) < 1e-4 && Math.abs(farmCase.soil.lon - farmCase.lon) < 1e-4 ? farmCase.soil : null;
  const declared = RESOURCES.filter((r) => farmCase.resources[r] !== 'unknown');

  return (
    <div className="max-w-[820px] mx-auto">
      <div className="print:hidden mb-6 flex flex-wrap gap-2">
        <button type="button" className={secondaryBtn} onClick={onClose}>
          <ArrowLeft aria-hidden className="h-4 w-4" /> {t('sheet.back')}
        </button>
        <button type="button" className={primaryBtn} onClick={() => window.print()}>
          <Printer aria-hidden className="h-4 w-4" /> {t('sheet.print')}
        </button>
        <p className="w-full text-xs text-[#3B2F20]/85">{t('sheet.printHelp')}</p>
      </div>

      <article className="rounded-xl bg-white p-6 sm:p-8 text-[#1F1A12] shadow-earth-card print:shadow-none print:p-0 space-y-4">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-lg tracking-[0.06em]">
              <span className="font-extralight uppercase">FIELD</span>
              <span className="font-bold uppercase">SHIFT</span>
            </p>
            <h1 className="text-2xl font-bold text-[#283618]">{t('sheet.title')}</h1>
          </div>
          <p className="text-xs">{t('sheet.date', { date: today })}</p>
        </header>

        <Block title={t('sheet.lot')}>
          {ring && centre ? (
            <ul className="space-y-0.5">
              <li>
                {t('terrain.area')}: <strong>{num(polygonAreaHa(ring), 1)} ha</strong>
                {farmCase.lotSource?.kind === 'example' && ` · ${t('example.name')}`}
                {farmCase.lotSource?.parcel && ` · ${farmCase.lotSource.parcel}`}
              </li>
              <li>
                {t('terrain.centre')}: {centre[0].toFixed(5)}, {centre[1].toFixed(5)} (WGS 84)
              </li>
              {terrain && (
                <li>
                  {t('sheet.terrain', {
                    mean: num(terrain.meanM, terrain.source === 'drone' ? 2 : 0),
                    relief: num(terrain.reliefM, terrain.source === 'drone' ? 2 : 1),
                    slope: num(terrain.slopePct, 1),
                    src: t(terrain.source === 'drone' ? 'sheet.srcDrone' : 'sheet.srcSrtm'),
                  })}
                </li>
              )}
            </ul>
          ) : (
            <p>
              {t('res.point', { lat: farmCase.lat.toFixed(4), lon: farmCase.lon.toFixed(4) })} · {t('sheet.noLot')}
            </p>
          )}
        </Block>

        <Block title={t('soil.title')}>
          <p>
            {t('sheet.soil', {
              texture: farm.soilPawMm !== undefined && soilHere ? t(`soil.${soilHere.texture}`) : t('soil.unknown'),
              mm: num(farm.soilPawMm ?? DEFAULT_PAW_MM),
              src: t(farmCase.soilPawDeclaredMm !== null ? 'sheet.srcTest' : farm.soilPawMm !== undefined ? 'sheet.srcSoilgrids' : 'sheet.srcDefault'),
            })}
          </p>
        </Block>

        <Block title={t('sheet.climate')}>
          <p>
            {data.origin === 'saved' ? t('res.dataSaved', { from, to, date: data.retrievedOn }) : t('res.dataLive', { from, to, date: data.retrievedOn })}
            {scenario && ` · ${t('sheet.scenario', { p: `${scenario.precipPct > 0 ? '+' : ''}${scenario.precipPct}`, t: `${scenario.tempC > 0 ? '+' : ''}${num(scenario.tempC, 1)}` })}`}
          </p>
        </Block>

        <Block title={t('sheet.compare')}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-[#606C38]">{t('hero.today')}</p>
              <p className="font-bold">{t(`template.${reference.templateId}`)}</p>
              <p className="text-xs">
                {t('cmp.index')}: {Math.round(reference.overall)}/100 · {t('hero.bare')}: {reference.bareMonths}/24
              </p>
            </div>
            {option !== reference && (
              <div>
                <p className="text-xs font-bold text-[#BC6C25]">{t('sheet.option')}</p>
                <p className="font-bold">{t(`template.${option.templateId}`)}</p>
                <p className="text-xs">
                  {t('cmp.index')}: {Math.round(option.overall)}/100 · {t('hero.bare')}: {option.bareMonths}/24
                </p>
              </div>
            )}
          </div>
          <Calendar s={reference} label={t('hero.today')} />
          {option !== reference && <Calendar s={option} label={t('sheet.option')} />}
          <p className="mt-1 text-[10px]">
            {[...used].map((c) => `${cropAbbr(lang, c)} = ${crop(c)}`).join(' · ')} · «·» = {t('scene.empty')}
          </p>
        </Block>

        {option !== reference && (
          <div className="grid grid-cols-2 gap-4">
            <Block title={t('hero.why')}>
              <ul className="list-disc pl-4 space-y-0.5">
                {why.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </Block>
            <Block title={t('hero.watch')}>
              <ul className="list-disc pl-4 space-y-0.5">
                {watch.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </Block>
          </div>
        )}

        <Block title={t('risk.title')}>
          <p>{alerts.enso}</p>
          <p className="mt-1 font-bold">{t('sheet.heat')}</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {alerts.heat.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          <p className="mt-1 font-bold">{t('sheet.water')}</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {alerts.water.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </Block>

        <Block title={t('verify.titleShort')}>
          <ul className="space-y-1">
            {checks.map((c, i) => (
              <li key={i}>
                <strong>{c.when}:</strong> {c.what}
              </li>
            ))}
          </ul>
        </Block>

        <Block title={t('sheet.declared')}>
          <p>
            {t('review.current')}: {farmCase.currentChoice === 'other' && farmCase.otherCrop ? `${farmCase.otherCrop} → ` : ''}
            {t(`template.${farmCase.currentTemplate}`)}
          </p>
          <p>
            {t('res.irrigation')}: {t(`access.${farmCase.resources.irrigation}`)}
            {farmCase.irrigationMm !== null && ` · ${farmCase.irrigationMm} mm`}
          </p>
          <p>
            {t('review.priorities')}: {farmCase.goals.length ? farmCase.goals.map((g) => t(`goal.${g}`)).join(' · ') : t('review.noGoals')}
          </p>
          {declared.length > 0 && (
            <p>
              {t('farm.machinery')}: {declared.filter((r) => r !== 'irrigation').map((r) => `${t(`res.${r}`)} (${t(`access.${farmCase.resources[r]}`)})`).join(' · ') || '—'}
            </p>
          )}
        </Block>

        {assumptions.length > 0 && (
          <Block title={t('res.assumptions')}>
            <ul className="list-disc pl-4 space-y-0.5">
              {assumptions.map((a) => (
                <li key={a}>{t(`assume.${a}`)}</li>
              ))}
            </ul>
          </Block>
        )}

        <footer className="border-t border-[#3B2F20]/30 pt-3 text-[11px] leading-relaxed text-[#3B2F20]">
          <p>{t('cmp.indexNote')}</p>
          <p className="mt-1">{t('sheet.disclaimer')}</p>
          <p className="mt-1">{t('footer.sources')}</p>
        </footer>
      </article>
    </div>
  );
}
