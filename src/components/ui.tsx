import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import type { CropId } from '../engine/domain/crops';

export type Provenance = 'declared' | 'source' | 'measured' | 'modeled' | 'assumed' | 'unknown' | 'notUsed';

const PROV_STYLE: Record<Provenance, string> = {
  declared: 'bg-[#E3EBDD] text-[#283618] border-[#A3B18A]',
  source: 'bg-[#283618] text-[#FEFAE0] border-[#283618]',
  measured: 'bg-[#606C38] text-[#FEFAE0] border-[#606C38]',
  modeled: 'bg-[#EFE3C2] text-[#3B2F20] border-[#C9B27C]',
  assumed: 'bg-[#FBE9D0] text-[#7A3F0C] border-[#DDA15E]',
  unknown: 'bg-white text-[#7A3F0C] border-[#BC6C25] border-dashed',
  notUsed: 'bg-white text-[#3B2F20]/80 border-[#DECFA7]',
};

/** Text label (never colour alone) for where a value comes from. */
export function ProvTag({ kind }: { kind: Provenance }) {
  const { t } = useLang();
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap ${PROV_STYLE[kind]}`}>
      {t(`prov.${kind}`)}
    </span>
  );
}

export function Card({ children, className = '', as: As = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' }) {
  return <As className={`rounded-2xl bg-white/70 border border-[#DECFA7] p-5 sm:p-6 shadow-earth-card ${className}`}>{children}</As>;
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl sm:text-2xl font-bold text-[#283618]">{children}</h2>
      {sub && <p className="mt-1 text-sm text-[#3B2F20]/85 leading-relaxed">{sub}</p>}
    </div>
  );
}

export function Collapsible({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group rounded-xl border border-[#DECFA7] bg-[#FEFAE0]" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-[#283618] [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown aria-hidden className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 text-sm text-[#3B2F20]">{children}</div>
    </details>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'error'; children: ReactNode }) {
  const cls =
    tone === 'error'
      ? 'bg-[#FDE8E4] border-[#B5462F] text-[#6E2414]'
      : tone === 'warn'
        ? 'bg-[#FBE9D0] border-[#DDA15E] text-[#5C3209]'
        : 'bg-[#E3EBDD] border-[#A3B18A] text-[#283618]';
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${cls}`}>
      {children}
    </div>
  );
}

/** Large, tappable option used across the wizard. */
export function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
  icon,
  role = 'radio',
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  role?: 'radio' | 'checkbox';
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 px-4 py-3.5 min-h-[56px] flex items-start gap-3 transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#BC6C25] ${
        selected ? 'border-[#283618] bg-[#E3EBDD]' : 'border-[#DECFA7] bg-white hover:border-[#A3B18A]'
      }`}
    >
      {icon && <span className="mt-0.5 shrink-0 text-[#606C38]">{icon}</span>}
      <span className="flex-1">
        <span className="block font-bold text-[#283618]">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-[#3B2F20]/85">{description}</span>}
      </span>
      <span
        aria-hidden
        className={`mt-1 h-5 w-5 shrink-0 ${role === 'radio' ? 'rounded-full' : 'rounded-md'} border-2 ${
          selected ? 'border-[#283618] bg-[#283618] shadow-[inset_0_0_0_3px_#E3EBDD]' : 'border-[#A3B18A] bg-white'
        }`}
      />
    </button>
  );
}

export const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#BC6C25] px-5 py-3 min-h-[48px] font-bold text-white hover:bg-[#9A5518] disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#283618]';
export const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#283618] px-5 py-3 min-h-[48px] font-bold text-[#283618] hover:bg-[#E3EBDD] disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#BC6C25]';
export const linkBtn = 'font-bold text-[#9A5518] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#BC6C25] rounded';

// ---------------------------------------------------------------------------
// Crop visuals
// ---------------------------------------------------------------------------

export const CROP_COLORS: Record<CropId, string> = {
  soy: '#6B8E3D',
  soy2: '#9AAE52',
  maize: '#D9A441',
  sorghum: '#B5651D',
  sunflower: '#E8C547',
  cotton: '#CDBFAF',
  wheat: '#C2A15A',
  chickpea: '#8C7A5B',
  vetch: '#5E7F5A',
  cereal_rye: '#7D9471',
  oat_cover: '#A3B18A',
  alfalfa: '#3F7A5C',
};

const ABBR: Record<'es' | 'en', Record<CropId, string>> = {
  es: { soy: 'Sj', soy2: 'S2', maize: 'Mz', sorghum: 'Sg', sunflower: 'Gi', cotton: 'Al', wheat: 'Tr', chickpea: 'Ga', vetch: 'Vi', cereal_rye: 'Ce', oat_cover: 'Av', alfalfa: 'Af' },
  en: { soy: 'Sb', soy2: 'S2', maize: 'Mz', sorghum: 'Sg', sunflower: 'Sf', cotton: 'Ct', wheat: 'Wh', chickpea: 'Cp', vetch: 'Vt', cereal_rye: 'Ry', oat_cover: 'Oa', alfalfa: 'Af' },
};

export function cropAbbr(lang: 'es' | 'en', id: CropId): string {
  return ABBR[lang][id];
}

/** Dark or light text for a background colour (WCAG relative luminance). */
export function textOn(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * (ch[0] ?? 0) + 0.7152 * (ch[1] ?? 0) + 0.0722 * (ch[2] ?? 0);
  return lum > 0.3 ? '#2A2116' : '#FFFFFF';
}
