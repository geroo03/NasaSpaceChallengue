import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  Droplets,
  Orbit,
  Satellite,
  Wheat,
} from 'lucide-react';
import { DataSourceType } from '../types/agronomy';

export type TelemetryIconKind =
  | 'satelite'
  | 'orbita'
  | 'cuaderno'
  | 'grano'
  | 'gota'
  | 'alerta';

interface TelemetryTileProps {
  kind: TelemetryIconKind;
  size?: 'md' | 'lg';
  className?: string;
}

const TILE_STYLES: Record<
  TelemetryIconKind,
  { bg: string; fg: string; border: string; label: string }
> = {
  satelite: {
    bg: 'bg-[#E3EBDD]',
    fg: 'text-[#283618]',
    border: 'border border-[#A3B18A]/60',
    label: 'Satélite NASA POWER',
  },
  orbita: {
    bg: 'bg-[#E3EBDD]',
    fg: 'text-[#606C38]',
    border: 'border border-[#A3B18A]/60',
    label: 'Órbita GIBS / Sentinel',
  },
  cuaderno: {
    bg: 'bg-[#EFE3C2]',
    fg: 'text-[#9A5518]',
    border: 'border border-[#DDA15E]/70',
    label: 'Cuaderno de campo',
  },
  grano: {
    bg: 'bg-[#EFE3C2]',
    fg: 'text-[#BC6C25]',
    border: 'border border-[#DDA15E]/70',
    label: 'Cultivo de cosecha',
  },
  gota: {
    bg: 'bg-[#283618]',
    fg: 'text-[#A3B18A]',
    border: 'border border-[#283618]',
    label: 'Humedad y agua útil',
  },
  alerta: {
    bg: 'bg-[#283618]',
    fg: 'text-[#DDA15E]',
    border: 'border border-[#283618]',
    label: 'Estrés hídrico',
  },
};

export const TelemetryIconTile: React.FC<TelemetryTileProps> = ({
  kind,
  size = 'md',
  className = '',
}) => {
  const style = TILE_STYLES[kind];
  const dims = size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';
  const iconSize = size === 'lg' ? 24 : 20;

  const renderIcon = () => {
    switch (kind) {
      case 'satelite':
        return <Satellite size={iconSize} strokeWidth={2} aria-hidden="true" />;
      case 'orbita':
        return <Orbit size={iconSize} strokeWidth={2} aria-hidden="true" />;
      case 'cuaderno':
        return <BookOpen size={iconSize} strokeWidth={2} aria-hidden="true" />;
      case 'grano':
        return <Wheat size={iconSize} strokeWidth={2} aria-hidden="true" />;
      case 'gota':
        return <Droplets size={iconSize} strokeWidth={2} aria-hidden="true" />;
      case 'alerta':
        return <AlertTriangle size={iconSize} strokeWidth={2} aria-hidden="true" />;
    }
  };

  return (
    <span
      title={style.label}
      className={`inline-flex shrink-0 items-center justify-center rounded-[14px] ${dims} ${style.bg} ${style.fg} ${style.border} ${className}`}
    >
      {renderIcon()}
    </span>
  );
};

interface DataSourceChipProps {
  source: DataSourceType;
  onClick?: () => void;
  active?: boolean;
}

export const DataSourceChip: React.FC<DataSourceChipProps> = ({
  source,
  onClick,
  active = false,
}) => {
  const config =
    source === DataSourceType.NASA_POWER
      ? {
          style: 'bg-[#E3EBDD] border-[#A3B18A] text-[#283618]',
          icon: <Satellite size={14} strokeWidth={2.2} aria-hidden="true" />,
        }
      : source === DataSourceType.GIBS
        ? {
            style: 'bg-[#E3EBDD] border-[#A3B18A] text-[#606C38]',
            icon: <Orbit size={14} strokeWidth={2.2} aria-hidden="true" />,
          }
        : {
            style: 'bg-[#EFE3C2] border-[#DDA15E] text-[#9A5518]',
            icon: <BookOpen size={14} strokeWidth={2.2} aria-hidden="true" />,
          };

  const baseClass = `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-[0.06em] whitespace-nowrap shrink-0 transition-transform duration-150 ${config.style} ${
    active ? 'ring-2 ring-[#606C38] ring-offset-1 ring-offset-[#FEFAE0]' : ''
  }`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} hover:brightness-95 active:scale-[0.98]`}
      >
        {config.icon}
        <span>{source}</span>
      </button>
    );
  }

  return (
    <span className={baseClass}>
      {config.icon}
      <span>{source}</span>
    </span>
  );
};
