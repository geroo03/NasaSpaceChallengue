import React, { useState } from 'react';
import { Droplets, Plus, RotateCcw, Save, Sparkles, Trash2, Wheat } from 'lucide-react';
import { CropSegment, FieldLot, SegmentType } from '../types/agronomy';
import { CAMPAIGN_MONTHS, formatMonthRange } from '../utils/agronomyEngine';

interface CropTimelineProps {
  lot: FieldLot;
  isDirty: boolean;
  onSimulate: () => void;
  onOpenAddSegment: () => void;
  onSaveLot: () => void;
  onResetLot: () => void;
  onRemoveSegment: (segmentId: string) => void;
}

export const CropTimeline: React.FC<CropTimelineProps> = ({
  lot,
  isDirty,
  onSimulate,
  onOpenAddSegment,
  onSaveLot,
  onResetLot,
  onRemoveSegment,
}) => {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    lot.segments[lot.segments.length - 1]?.id ?? null,
  );

  const selectedSegment: CropSegment | undefined =
    lot.segments.find((s) => s.id === selectedSegmentId) ?? lot.segments[0];

  return (
    <section
      aria-labelledby="timeline-heading"
      className="rounded-2xl bg-[#EFE3C2]/55 border border-[#DECFA7] p-5 sm:p-6 shadow-earth-card"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
        <div>
          <h2
            id="timeline-heading"
            className="text-xl font-bold text-[#283618] tracking-tight"
          >
            Calendario de rotación de cultivos · Campaña 2026/27
          </h2>
          <p className="text-sm text-[#3B2F20]/80 mt-0.5">
            Secuencia modular de barbecho, cultivos de servicio y cosecha en{' '}
            <span className="font-bold text-[#3B2F20]">{lot.name}</span>.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#3B2F20]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#283618] inline-block" />
            Cultivo de cosecha
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded cover-crop-hatch border border-[#A3B18A] inline-block" />
            Cobertura
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#EFE3C2] border border-[#DECFA7] inline-block" />
            Barbecho
          </span>
        </div>
      </div>

      {/* Horizontal kinetic scroll ribbon on mobile */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="min-w-[920px] rounded-xl bg-[#FEFAE0] border border-[#DECFA7] p-4">
          {/* 12-month header */}
          <div className="grid grid-cols-12 gap-1.5 mb-3 border-b border-[#DECFA7]/80 pb-2">
            {CAMPAIGN_MONTHS.map((month, idx) => (
              <div
                key={month}
                className="text-center text-xs font-bold uppercase tracking-[0.08em] text-[#3B2F20]/75 tabular-nums"
              >
                {month}
                <span className="block text-[10px] font-normal text-[#3B2F20]/50">
                  M{idx + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Timeline Tracks */}
          {lot.segments.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#3B2F20]/70">
              No hay etapas programadas en esta campaña. Presione{' '}
              <span className="font-bold text-[#9A5518]">Añadir cultivo</span> para
              comenzar.
            </div>
          ) : (
            <div className="space-y-2.5">
              {lot.segments.map((seg) => {
                const isSelected = selectedSegment?.id === seg.id;
                const startCol = seg.startMonth + 1;
                const spanCol = Math.max(1, Math.min(12 - seg.startMonth, seg.spanMonths));

                const segmentClasses =
                  seg.type === SegmentType.COSECHA
                    ? 'bg-[#283618] text-[#FEFAE0] border border-[#283618]'
                    : seg.type === SegmentType.COBERTURA
                      ? 'cover-crop-hatch text-[#3B2F20] border-[1.5px] border-[#A3B18A]'
                      : 'bg-[#EFE3C2] text-[#3B2F20] border border-[#DECFA7]';

                return (
                  <div key={seg.id} className="grid grid-cols-12 gap-1.5 items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedSegmentId(seg.id)}
                      style={{
                        gridColumn: `${startCol} / span ${spanCol}`,
                      }}
                      className={`h-11 px-3 rounded-lg flex items-center justify-between gap-2 text-left transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#606C38] ${segmentClasses} ${
                        isSelected
                          ? 'ring-2 ring-[#BC6C25] ring-offset-2 ring-offset-[#FEFAE0]'
                          : 'hover:brightness-[0.97]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        {seg.type === SegmentType.BARBECHO && (
                          <Droplets
                            size={15}
                            className="shrink-0 text-[#DDA15E]"
                            strokeWidth={2.2}
                            aria-hidden="true"
                          />
                        )}
                        <span className="text-xs sm:text-sm font-bold truncate">
                          {seg.label}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-2 shrink-0">
                        {spanCol >= 3 && (
                          <span
                            className={`text-[11px] font-bold tabular-nums ${
                              seg.type === SegmentType.COSECHA
                                ? 'text-[#FEFAE0]/75'
                                : 'text-[#3B2F20]/70'
                            }`}
                          >
                            {formatMonthRange(seg.startMonth, seg.spanMonths)}
                          </span>
                        )}
                        {seg.type === SegmentType.COSECHA && (
                          <Wheat
                            size={16}
                            className="shrink-0 text-[#BC6C25]"
                            strokeWidth={2.2}
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected segment inspector bar */}
      {selectedSegment && (
        <div className="mt-4 rounded-xl bg-[#E3EBDD]/75 border border-[#A3B18A] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.06em] text-[#283618]">
              <span>{selectedSegment.code}</span>
              <span aria-hidden="true">·</span>
              <span>{formatMonthRange(selectedSegment.startMonth, selectedSegment.spanMonths)}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Balance agua:{' '}
                {selectedSegment.waterImpactMm >= 0
                  ? `+${selectedSegment.waterImpactMm}`
                  : selectedSegment.waterImpactMm}{' '}
                mm
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Nitrógeno:{' '}
                {selectedSegment.nitrogenBalanceKgHa >= 0
                  ? `+${selectedSegment.nitrogenBalanceKgHa}`
                  : selectedSegment.nitrogenBalanceKgHa}{' '}
                kg/ha
              </span>
            </div>
            <p className="text-sm text-[#3B2F20]">
              {selectedSegment.notes || selectedSegment.label}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRemoveSegment(selectedSegment.id)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9A5518] hover:underline whitespace-nowrap shrink-0 self-start sm:self-center"
          >
            <Trash2 size={14} aria-hidden="true" />
            <span>Quitar etapa ({selectedSegment.code})</span>
          </button>
        </div>
      )}

      {/* Action buttons following exact Earthy Harmony button hierarchy */}
      <div className="mt-5 pt-4 border-t border-[#DECFA7] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSimulate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#283618] hover:bg-[#606C38] active:scale-[0.98] text-white text-sm font-bold tracking-[0.04em] px-5 py-2.5 whitespace-nowrap shrink-0 transition-all duration-150"
          >
            <Sparkles size={16} aria-hidden="true" />
            <span>Simular rotación</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddSegment}
            className="inline-flex items-center gap-2 rounded-lg bg-[#FEFAE0] hover:bg-[#EFE3C2]/70 active:scale-[0.98] border-[1.5px] border-[#BC6C25] text-[#3B2F20] text-sm font-bold tracking-[0.04em] px-4 py-2.5 whitespace-nowrap shrink-0 transition-all duration-150"
          >
            <Plus size={16} className="text-[#BC6C25]" aria-hidden="true" />
            <span>Añadir cultivo</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onResetLot}
            className="inline-flex items-center gap-1.5 bg-transparent text-[#9A5518] hover:text-[#7B4210] hover:underline text-sm font-bold tracking-[0.04em] px-2 py-2 whitespace-nowrap shrink-0"
          >
            <RotateCcw size={15} aria-hidden="true" />
            <span>Restablecer</span>
          </button>

          <button
            type="button"
            onClick={onSaveLot}
            className="inline-flex items-center gap-2 rounded-lg bg-[#BC6C25] hover:bg-[#9A5518] active:scale-[0.98] active:bg-[#814612] text-white text-sm font-bold tracking-[0.04em] px-5 py-2.5 whitespace-nowrap shrink-0 transition-all duration-150"
          >
            <Save size={16} aria-hidden="true" />
            <span>{isDirty ? 'Guardar lote *' : 'Guardar lote'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
