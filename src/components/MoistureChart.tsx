import React, { useState } from 'react';
import { DataSourceType, MonthlyClimatePoint } from '../types/agronomy';
import { DataSourceChip } from './AgroIcons';

interface MoistureChartProps {
  climateSeries: MonthlyClimatePoint[];
  simulatedCurve: number[];
  capacityMm: number;
  onInspectEvidence: () => void;
}

export const MoistureChart: React.FC<MoistureChartProps> = ({
  climateSeries,
  simulatedCurve,
  capacityMm,
  onInspectEvidence,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number>(7); // Default Jan peak

  const width = 680;
  const height = 240;
  const padLeft = 42;
  const padRight = 18;
  const padTop = 20;
  const padBottom = 34;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const maxBarMm = 180;
  const maxCurveMm = Math.max(capacityMm, 240);
  const colWidth = innerW / 12;

  const points = simulatedCurve.map((val, idx) => {
    const x = padLeft + colWidth * idx + colWidth / 2;
    const y = padTop + innerH - (Math.min(maxCurveMm, val) / maxCurveMm) * innerH;
    return { x, y, val };
  });

  const polylineStr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const activePoint = climateSeries[hoveredIdx] ?? climateSeries[0];
  const activeSimMoisture = simulatedCurve[hoveredIdx] ?? activePoint?.soilMoistureMm ?? 0;

  return (
    <section className="rounded-2xl bg-[#E3EBDD]/65 border border-[#A3B18A] p-5 sm:p-6 shadow-earth-card flex flex-col justify-between">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="mb-2">
            <DataSourceChip source={DataSourceType.NASA_POWER} onClick={onInspectEvidence} />
          </div>
          <h3 className="text-lg font-bold text-[#283618]">
            Balance hídrico mensual y lámina útil
          </h3>
        </div>

        <button
          type="button"
          onClick={onInspectEvidence}
          className="rounded-lg bg-[#BC6C25] hover:bg-[#9A5518] active:scale-[0.98] text-white text-xs font-bold tracking-[0.05em] px-3.5 py-2 whitespace-nowrap shrink-0 transition-all duration-150"
        >
          Ver evidencia
        </button>
      </div>

      {/* Series Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#3B2F20] mb-2.5">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-[#283618] inline-block rounded-full" />
          Agua útil perfil (mm)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 bg-[#A3B18A] inline-block rounded-sm" />
          Precipitación mensual (mm)
        </span>
      </div>

      {/* Interactive Chart */}
      <div className="rounded-xl bg-[#FEFAE0] border border-[#DECFA7] p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label="Gráfico de precipitación mensual y humedad útil simulada"
        >
          {/* Horizontal guide lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padTop + innerH * (1 - t);
            const labelVal = Math.round(maxCurveMm * t);
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#DECFA7"
                  strokeDasharray={t === 0 ? undefined : '4 4'}
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#3B2F20]/65 text-[10px] font-bold tabular-nums"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Precipitation Bars & Hover Targets */}
          {climateSeries.map((pt, idx) => {
            const barH = (Math.min(maxBarMm, pt.precipitationMm) / maxBarMm) * innerH * 0.65;
            const x = padLeft + idx * colWidth + colWidth * 0.22;
            const barW = colWidth * 0.56;
            const y = padTop + innerH - barH;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={pt.monthLabel}
                onMouseEnter={() => setHoveredIdx(idx)}
                onClick={() => setHoveredIdx(idx)}
                className="cursor-pointer"
              >
                <rect
                  x={padLeft + idx * colWidth}
                  y={padTop}
                  width={colWidth}
                  height={innerH + 22}
                  fill={isHovered ? 'rgba(221, 161, 94, 0.14)' : 'transparent'}
                  rx={6}
                />
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={4}
                  fill={isHovered ? '#606C38' : '#A3B18A'}
                />
                <text
                  x={padLeft + idx * colWidth + colWidth / 2}
                  y={height - 10}
                  textAnchor="middle"
                  className={`text-[11px] font-bold ${
                    isHovered ? 'fill-[#9A5518]' : 'fill-[#3B2F20]/75'
                  }`}
                >
                  {pt.monthLabel}
                </text>
              </g>
            );
          })}

          {/* Moisture Polyline */}
          <polyline
            fill="none"
            stroke="#283618"
            strokeWidth={2.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineStr}
          />

          {/* Curve Nodes */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 5.5 : 3.5}
              fill={hoveredIdx === idx ? '#BC6C25' : '#283618'}
              stroke="#FEFAE0"
              strokeWidth={2}
              pointerEvents="none"
            />
          ))}
        </svg>
      </div>

      {/* Selected month readout */}
      {activePoint && (
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[#FEFAE0] border border-[#DECFA7] px-4 py-2.5 text-xs">
          <div>
            <span className="text-[#3B2F20]/70 block">Mes seleccionado</span>
            <span className="font-bold text-[#283618] text-sm">{activePoint.monthLabel}</span>
          </div>
          <div>
            <span className="text-[#3B2F20]/70 block">Lluvia / ETo</span>
            <span className="font-bold text-[#3B2F20] text-sm tabular-nums">
              {activePoint.precipitationMm} mm / {activePoint.etoMm} mm
            </span>
          </div>
          <div>
            <span className="text-[#3B2F20]/70 block">Agua útil perfil</span>
            <span className="font-bold text-[#BC6C25] text-sm tabular-nums">
              {activeSimMoisture} mm
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
