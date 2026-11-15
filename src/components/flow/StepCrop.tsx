import { Sprout, HelpCircle, CircleSlash } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { PRESET_TEMPLATES, type FarmCase } from '../../case/model';
import { TEMPLATES, type TemplateId } from '../../engine/domain/rotations';
import { ChoiceCard, CROP_COLORS, Notice, cropAbbr, textOn } from '../ui';

export function TemplateChips({ id }: { id: TemplateId }) {
  const { crop, lang, months } = useLang();
  const slots = [...TEMPLATES[id].slots].sort((a, b) => a.year - b.year || ((a.sowMonthSouth + 5) % 12) - ((b.sowMonthSouth + 5) % 12));
  return (
    <span className="mt-1.5 flex flex-wrap gap-1.5">
      {slots.map((s, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold"
          style={{ background: CROP_COLORS[s.crop], color: textOn(CROP_COLORS[s.crop]) }}
          title={crop(s.crop)}
        >
          {cropAbbr(lang, s.crop)} · {crop(s.crop)} · {months[s.sowMonthSouth - 1]}
        </span>
      ))}
    </span>
  );
}

export function StepCrop({ value, onChange }: { value: FarmCase; onChange: (patch: Partial<FarmCase>) => void }) {
  const { t } = useLang();
  const isPreset = value.currentChoice === 'preset';
  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label={t('crop.q')} className="grid gap-3 sm:grid-cols-2">
        {PRESET_TEMPLATES.map((id) => (
          <ChoiceCard
            key={id}
            selected={isPreset && value.currentTemplate === id}
            onSelect={() => onChange({ currentChoice: 'preset', currentTemplate: id })}
            icon={<Sprout aria-hidden className="h-5 w-5" />}
            title={t(`template.${id}`)}
            description={<TemplateChips id={id} />}
          />
        ))}
        <ChoiceCard
          selected={value.currentChoice === 'other'}
          onSelect={() => onChange({ currentChoice: 'other' })}
          icon={<HelpCircle aria-hidden className="h-5 w-5" />}
          title={t('crop.other')}
        />
        <ChoiceCard
          selected={value.currentChoice === 'none'}
          onSelect={() => onChange({ currentChoice: 'none' })}
          icon={<CircleSlash aria-hidden className="h-5 w-5" />}
          title={t('crop.none')}
        />
      </div>

      {value.currentChoice === 'other' && (
        <div className="space-y-3">
          <label className="block">
            <span className="block text-sm font-bold text-[#283618] mb-1">{t('crop.otherLabel')}</span>
            <input
              type="text"
              value={value.otherCrop}
              placeholder={t('crop.otherPlaceholder')}
              onChange={(e) => onChange({ otherCrop: e.target.value })}
              className="w-full rounded-lg border border-[#DECFA7] bg-white px-3 py-2.5"
            />
          </label>
          <Notice tone="warn">{t('crop.otherWarn')}</Notice>
        </div>
      )}
      {value.currentChoice === 'none' && <Notice tone="warn">{t('crop.noneWarn')}</Notice>}
      {!isPreset && (
        <label className="block">
          <span className="block text-sm font-bold text-[#283618] mb-1">{t('crop.substitute')}</span>
          <select
            value={value.currentTemplate}
            onChange={(e) => onChange({ currentTemplate: e.target.value as TemplateId })}
            className="w-full rounded-lg border border-[#DECFA7] bg-white px-3 py-2.5"
          >
            {PRESET_TEMPLATES.map((id) => (
              <option key={id} value={id}>
                {t(`template.${id}`)}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="text-xs text-[#3B2F20]/85">{t('crop.datesNote')}</p>
    </div>
  );
}
