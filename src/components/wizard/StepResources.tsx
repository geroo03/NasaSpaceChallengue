import { Droplets, Hand, Layers, SprayCan, Sprout, Tractor, Wheat, type LucideIcon } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { ACCESS_LEVELS, RESOURCES, hasIrrigationAccess, type Access, type Availability, type FarmCase, type ResourceId } from '../../case/model';
import { Notice } from '../ui';
import { Pill } from '../flow/LotScreen';

const ICONS: Record<ResourceId, LucideIcon> = {
  manual: Hand,
  tractor: Tractor,
  seeder: Sprout,
  sprayer: SprayCan,
  harvest: Wheat,
  irrigation: Droplets,
  coverMgmt: Layers,
};

type Props = { value: FarmCase; onChange: (patch: Partial<FarmCase>) => void };

/** The only resource the engine uses today: irrigation (access, confirmation, mm per season). */
export function IrrigationQuestion(props: Props) {
  return <ResourceCards {...props} only={['irrigation']} />;
}

/** Machinery and services: recorded for the field sheet and the checklist, not used by the calculation yet. */
export function MachineryList(props: Props) {
  const { t } = useLang();
  return (
    <div className="space-y-3">
      <Notice tone="warn">
        <strong className="block">{t('res.pending')}</strong>
        {t('res.pendingNote')}
      </Notice>
      <ResourceCards {...props} only={RESOURCES.filter((r) => r !== 'irrigation')} />
    </div>
  );
}

function ResourceCards({ value, onChange, only }: Props & { only: readonly ResourceId[] }) {
  const { t } = useLang();
  const setAccess = (r: ResourceId, a: Access) => onChange({ resources: { ...value.resources, [r]: a } });
  const setAvail = (r: ResourceId, a: Availability) => onChange({ availability: { ...value.availability, [r]: a } });

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {only.map((r) => {
          const Icon = ICONS[r];
          const access = value.resources[r];
          const needsWindow = access === 'shared' || access === 'contracted';
          return (
            <li key={r} className="rounded-xl border border-[#DECFA7] bg-white p-4">
              <fieldset>
                <legend className="flex items-center gap-2 font-bold text-[#283618]">
                  <Icon aria-hidden className="h-5 w-5 text-[#606C38]" />
                  {t(`res.${r}`)}
                </legend>
                {r === 'tractor' && <p className="mt-1 text-xs text-[#3B2F20]/85">{t('res.tractorNote')}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {ACCESS_LEVELS.map((a) => (
                    <Pill key={a} selected={access === a} onClick={() => setAccess(r, a)}>
                      {t(`access.${a}`)}
                    </Pill>
                  ))}
                </div>
              </fieldset>
              {needsWindow && (
                <fieldset className="mt-3 border-t border-[#EFE3C2] pt-3">
                  <legend className="text-sm font-bold text-[#3B2F20]">{t('res.availability')}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['confirmed', 'pending'] as Availability[]).map((a) => (
                      <Pill key={a} selected={value.availability[r] === a} onClick={() => setAvail(r, a)}>
                        {t(`avail.${a}`)}
                      </Pill>
                    ))}
                  </div>
                </fieldset>
              )}
              {r === 'irrigation' && hasIrrigationAccess(value) && (
                <div className="mt-3 border-t border-[#EFE3C2] pt-3">
                  <label className="block text-sm font-bold text-[#3B2F20]" htmlFor="irrigation-mm">
                    {t('res.irrigationMm')}
                  </label>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <input
                      id="irrigation-mm"
                      type="number"
                      min={0}
                      max={800}
                      step={10}
                      value={value.irrigationMm ?? ''}
                      placeholder={t('res.irrigationPlaceholder')}
                      onChange={(e) => onChange({ irrigationMm: e.target.value === '' ? null : Math.max(0, Math.min(800, Number(e.target.value) || 0)) })}
                      className="w-28 rounded-lg border border-[#DECFA7] bg-white px-3 py-2 tabular-nums disabled:bg-[#EFE3C2]/50"
                    />
                    <span className="text-sm">{t('res.irrigationUnit')}</span>
                    <Pill
                      selected={value.irrigationMm === null}
                      onClick={() => onChange({ irrigationMm: null })}
                    >
                      {t('res.irrigationUnknown')}
                    </Pill>
                  </div>
                  <p className="mt-2 text-xs text-[#283618] font-bold">{t('res.irrigationUsed')}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
