import React from 'react';
import {
  DataSourceType,
  EvidencePayload,
  FieldLot,
  SimulationResult,
  StressLevel,
} from '../types/agronomy';
import { DataSourceChip, TelemetryIconTile } from './AgroIcons';
import { CropTimeline } from './CropTimeline';
import { MoistureChart } from './MoistureChart';

interface LotsDashboardScreenProps {
  lots: FieldLot[];
  activeLot: FieldLot;
  simulation: SimulationResult;
  isDirty: boolean;
  saveFeedback: string | null;
  onSelectLot: (lotId: string) => void;
  onUpdateLotField: (patch: Partial<FieldLot>) => void;
  onSimulate: () => void;
  onOpenAddSegment: () => void;
  onSaveLot: () => void;
  onResetLot: () => void;
  onRemoveSegment: (segmentId: string) => void;
  onOpenEvidence: (payload: EvidencePayload) => void;
}

export const LotsDashboardScreen: React.FC<LotsDashboardScreenProps> = ({
  lots,
  activeLot,
  simulation,
  isDirty,
  saveFeedback,
  onSelectLot,
  onUpdateLotField,
  onSimulate,
  onOpenAddSegment,
  onSaveLot,
  onResetLot,
  onRemoveSegment,
  onOpenEvidence,
}) => {
  const openNasaEvidence = () =>
    onOpenEvidence({
      title: `Evidencia Climática · ${activeLot.name}`,
      subtitle: 'Serie decádica y balance evapotranspirativo',
      source: DataSourceType.NASA_POWER,
      timestamp: 'Actualizado 14 Nov 2026 · 06:00 UTC',
      coordinates: activeLot.coordinates,
      metrics: [
        {
          label: 'Agua útil proyectada',
          value: `${simulation.finalMoistureMm} mm`,
        },
        {
          label: 'Delta vs inicio campaña',
          value: `${simulation.moistureDeltaMm >= 0 ? '+' : ''}${simulation.moistureDeltaMm} mm`,
        },
        {
          label: 'Capacidad de campo',
          value: `${activeLot.usableWaterCapacityMm} mm`,
        },
        {
          label: 'Balance de Nitrógeno',
          value: `${simulation.nitrogenNetKgHa >= 0 ? '+' : ''}${simulation.nitrogenNetKgHa} kg/ha`,
        },
      ],
      interpretation: simulation.summaryText,
    });

  const openGibsEvidence = () =>
    onOpenEvidence({
      title: `Lectura Orbital NDVI · ${activeLot.name}`,
      subtitle: 'Reflectancia multiespectral Sentinel-2 / GIBS',
      source: DataSourceType.GIBS,
      timestamp: 'Pasada orbital 12 Nov 2026 · 14:15 UTC',
      coordinates: activeLot.coordinates,
      metrics: [
        { label: 'Índice NDVI medio', value: activeLot.currentNdvi.toFixed(2) },
        { label: 'Cobertura de servicio', value: `${simulation.coverCropSharePct}%` },
        { label: 'Superficie auditada', value: `${activeLot.hectares} ha` },
        { label: 'Nubosidad en escena', value: '4%' },
      ],
      interpretation:
        'La franja central muestra vigor fotosintético sostenido. Los cultivos de cobertura mantienen temperatura superficial 2,4 °C menor frente a barbecho descubierto.',
    });

  const openFieldEvidence = () =>
    onOpenEvidence({
      title: `Aforo y Sonda en Campo · ${activeLot.name}`,
      subtitle: 'Calibración directa en perfil 0–100 cm',
      source: DataSourceType.CAMPO,
      timestamp: 'Relevamiento 13 Nov 2026',
      coordinates: activeLot.coordinates,
      metrics: [
        { label: 'Rinde proyectado', value: `${simulation.projectedYieldTHa} t/ha` },
        { label: 'Serie de suelo', value: activeLot.soilType },
        { label: 'Humedad inicial', value: `${activeLot.initialMoistureMm} mm` },
        { label: 'Estado hídrico', value: simulation.stressLevel },
      ],
      interpretation:
        'Aforo calibrado con sonda gravimétrica y muestreo en 5 estaciones georreferenciadas dentro del lote.',
    });

  const stressColorClass =
    simulation.stressLevel === StressLevel.OPTIMO
      ? 'text-[#A3B18A]'
      : simulation.stressLevel === StressLevel.MODERADO
        ? 'text-[#DDA15E]'
        : 'text-[#FFB781]';

  return (
    <div className="space-y-8">
      {/* Screen Header & Lot Selector */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <h1 className="headline-display text-[1.75rem] sm:text-[2.5rem] leading-tight uppercase text-[#283618]">
            TABLERO DE LOTES Y ROTACIÓN
          </h1>
          <div className="flex flex-wrap items-center gap-2.5">
            <DataSourceChip source={DataSourceType.NASA_POWER} onClick={openNasaEvidence} />
            <DataSourceChip source={DataSourceType.GIBS} onClick={openGibsEvidence} />
            <DataSourceChip source={DataSourceType.CAMPO} onClick={openFieldEvidence} />
          </div>
        </div>

        {/* Lot Switcher Tabs */}
        <div
          role="tablist"
          aria-label="Seleccionar lote activo"
          className="flex flex-wrap items-center gap-2 rounded-xl bg-[#EFE3C2]/70 border border-[#DECFA7] p-1.5"
        >
          {lots.map((lot) => {
            const active = lot.id === activeLot.id;
            return (
              <button
                key={lot.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectLot(lot.id)}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 ${
                  active
                    ? 'bg-[#283618] text-[#FEFAE0] shadow-sm'
                    : 'text-[#3B2F20] hover:bg-[#FEFAE0]/70'
                }`}
              >
                <span>{lot.code}</span>
                <span className="mx-1.5 opacity-50">·</span>
                <span className="tabular-nums">{lot.hectares} ha</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Confirmation Banner */}
      {saveFeedback && (
        <div
          role="status"
          className="rounded-xl bg-[#E3EBDD] border border-[#606C38] px-4 py-3 flex items-center justify-between gap-3 text-sm font-bold text-[#283618]"
        >
          <span>{saveFeedback}</span>
          <span className="text-xs font-normal text-[#3B2F20]/80">
            Sincronizado en almacenamiento local
          </span>
        </div>
      )}

      {/* 4 KPI Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Humedad útil */}
        <div className="rounded-2xl bg-[#EFE3C2] border border-[#A3B18A] p-5 shadow-earth-card flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#3B2F20]/75">
              Humedad útil perfil
            </p>
            <p className="mt-2 text-3xl font-bold text-[#283618] tabular-nums">
              {simulation.finalMoistureMm} <span className="text-base font-bold">mm</span>
            </p>
            <p className="mt-1 text-xs text-[#3B2F20]/80 tabular-nums">
              Delta campaña:{' '}
              <span className="font-bold text-[#606C38]">
                {simulation.moistureDeltaMm >= 0 ? '+' : ''}
                {simulation.moistureDeltaMm} mm
              </span>
            </p>
          </div>
          <TelemetryIconTile kind="gota" size="md" />
        </div>

        {/* KPI 2: Índice NDVI */}
        <div className="rounded-2xl bg-[#E3EBDD] border border-[#A3B18A] p-5 shadow-earth-card flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#3B2F20]/75">
              Índice NDVI (GIBS)
            </p>
            <p className="mt-2 text-3xl font-bold text-[#283618] tabular-nums">
              {activeLot.currentNdvi.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-[#3B2F20]/80 tabular-nums">
              Cobertura activa:{' '}
              <span className="font-bold text-[#283618]">
                {simulation.coverCropSharePct}%
              </span>
            </p>
          </div>
          <TelemetryIconTile kind="orbita" size="md" />
        </div>

        {/* KPI 3: Rendimiento estimado */}
        <div className="rounded-2xl bg-[#EFE3C2] border border-[#A3B18A] p-5 shadow-earth-card flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#3B2F20]/75">
              Rinde proyectado
            </p>
            <p className="mt-2 text-3xl font-bold text-[#BC6C25] tabular-nums">
              {simulation.projectedYieldTHa}{' '}
              <span className="text-base font-bold">t/ha</span>
            </p>
            <p className="mt-1 text-xs text-[#3B2F20]/80 tabular-nums">
              Balance N:{' '}
              <span className="font-bold text-[#3B2F20]">
                {simulation.nitrogenNetKgHa >= 0 ? '+' : ''}
                {simulation.nitrogenNetKgHa} kg/ha
              </span>
            </p>
          </div>
          <TelemetryIconTile kind="grano" size="md" />
        </div>

        {/* KPI 4: Estrés hídrico (dark forest alert card) */}
        <div className="rounded-2xl bg-[#283618] border border-[#606C38] p-5 shadow-earth-card flex items-start justify-between gap-3 text-[#FEFAE0]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#A3B18A]">
              Riesgo de estrés hídrico
            </p>
            <p className={`mt-2 text-2xl sm:text-3xl font-bold ${stressColorClass}`}>
              {simulation.stressLevel}
            </p>
            <p className="mt-1 text-xs text-[#FEFAE0]/80 tabular-nums">
              Déficit estival:{' '}
              <span className="font-bold text-[#DDA15E]">
                {simulation.waterDeficitMm} mm
              </span>
            </p>
          </div>
          <TelemetryIconTile kind="alerta" size="md" />
        </div>
      </div>

      {/* Interactive Crop Timeline Planner */}
      <CropTimeline
        lot={activeLot}
        isDirty={isDirty}
        onSimulate={onSimulate}
        onOpenAddSegment={onOpenAddSegment}
        onSaveLot={onSaveLot}
        onResetLot={onResetLot}
        onRemoveSegment={onRemoveSegment}
      />

      {/* Analytics Chart + Lot Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <MoistureChart
            climateSeries={activeLot.climateSeries}
            simulatedCurve={simulation.monthlyMoistureCurve}
            capacityMm={activeLot.usableWaterCapacityMm}
            onInspectEvidence={openNasaEvidence}
          />
        </div>

        {/* Quick Lot Parameter Editor */}
        <section className="lg:col-span-5 rounded-2xl bg-[#EFE3C2]/65 border border-[#DECFA7] p-5 sm:p-6 shadow-earth-card flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#283618]">
                  Ficha edafológica y parámetros
                </h3>
                <p className="text-xs text-[#3B2F20]/75 mt-0.5">
                  {activeLot.region} · {activeLot.coordinates}
                </p>
              </div>
              <TelemetryIconTile kind="cuaderno" size="md" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="lot-name-input"
                  className="block text-xs font-bold text-[#3B2F20] mb-1.5"
                >
                  Nombre del lote
                </label>
                <input
                  id="lot-name-input"
                  type="text"
                  value={activeLot.name}
                  onChange={(e) => onUpdateLotField({ name: e.target.value })}
                  className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3.5 py-2 text-sm text-[#3B2F20] placeholder:text-[#3B2F20]/50"
                />
              </div>

              <div>
                <label
                  htmlFor="lot-hectares-input"
                  className="block text-xs font-bold text-[#3B2F20] mb-1.5"
                >
                  Superficie (ha)
                </label>
                <input
                  id="lot-hectares-input"
                  type="number"
                  min={1}
                  max={50000}
                  value={activeLot.hectares}
                  onChange={(e) =>
                    onUpdateLotField({
                      hectares: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3.5 py-2 text-sm text-[#3B2F20] tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="lot-moisture-input"
                  className="block text-xs font-bold text-[#3B2F20] mb-1.5"
                >
                  Humedad inicial (mm)
                </label>
                <input
                  id="lot-moisture-input"
                  type="number"
                  min={20}
                  max={300}
                  value={activeLot.initialMoistureMm}
                  onChange={(e) =>
                    onUpdateLotField({
                      initialMoistureMm: Math.max(20, Number(e.target.value) || 20),
                    })
                  }
                  className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3.5 py-2 text-sm text-[#3B2F20] tabular-nums"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="lot-soil-input"
                  className="block text-xs font-bold text-[#3B2F20] mb-1.5"
                >
                  Serie y textura de suelo
                </label>
                <input
                  id="lot-soil-input"
                  type="text"
                  value={activeLot.soilType}
                  onChange={(e) => onUpdateLotField({ soilType: e.target.value })}
                  className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3.5 py-2 text-sm text-[#3B2F20]"
                />
              </div>
            </div>
          </div>

          {/* Agronomic diagnosis callout */}
          <div className="mt-5 rounded-xl bg-[#FEFAE0] border border-[#A3B18A] p-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#606C38]">
                Diagnóstico de rotación
              </p>
              <p className="mt-1 text-sm text-[#3B2F20] leading-relaxed">
                {simulation.summaryText}
              </p>
            </div>
            <button
              type="button"
              onClick={openFieldEvidence}
              className="text-xs font-bold text-[#9A5518] hover:underline whitespace-nowrap shrink-0 mt-0.5"
            >
              Ver evidencia
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
