import React, { useState } from 'react';
import {
  DataSourceType,
  EvidencePayload,
  FieldLot,
  SatellitePass,
} from '../types/agronomy';
import { DataSourceChip, TelemetryIconTile } from './AgroIcons';

type SpectralLayer = 'ndvi' | 'moisture' | 'thermal';

interface SatelliteMonitorScreenProps {
  activeLot: FieldLot;
  passes: SatellitePass[];
  onOpenEvidence: (payload: EvidencePayload) => void;
}

const LAYER_CONFIG: Record<
  SpectralLayer,
  { label: string; badge: string; overlayColor: string; note: string }
> = {
  ndvi: {
    label: 'NDVI Vigor',
    badge: 'Índice Verde Normalizado · Sentinel-2',
    overlayColor: 'rgba(96, 108, 56, 0.28)',
    note: 'Canopeo denso en sectores norte y central (0.74–0.83). Alta tasa fotosintética.',
  },
  moisture: {
    label: 'Humedad Útil',
    badge: 'Índice NDWI · Estrato 0–60 cm',
    overlayColor: 'rgba(163, 177, 138, 0.34)',
    note: 'Retención hídrica superior en franjas con cobertura de Vicia villosa.',
  },
  thermal: {
    label: 'Anomalía Térmica',
    badge: 'Temperatura Superficial · Landsat',
    overlayColor: 'rgba(221, 161, 94, 0.32)',
    note: 'Cabecera oeste +2,1 °C sobre media del lote por menor residuo superficial.',
  },
};

export const SatelliteMonitorScreen: React.FC<SatelliteMonitorScreenProps> = ({
  activeLot,
  passes,
  onOpenEvidence,
}) => {
  const [layer, setLayer] = useState<SpectralLayer>('ndvi');
  const [selectedSector, setSelectedSector] = useState<'norte' | 'centro' | 'oeste'>('centro');
  const [imgFailed, setImgFailed] = useState(false);

  const sectorStats = {
    norte: { name: 'Sector Norte · Bajo dulce', ndvi: 0.81, moisture: 182, temp: 25.1 },
    centro: { name: 'Franja Central · Loma media', ndvi: activeLot.currentNdvi, moisture: 168, temp: 26.4 },
    oeste: { name: 'Loma Oeste · Suelo franco-arenoso', ndvi: 0.64, moisture: 138, temp: 28.9 },
  }[selectedSector];

  const layerInfo = LAYER_CONFIG[layer];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="headline-display text-[1.75rem] sm:text-[2.5rem] leading-tight uppercase text-[#283618]">
            MONITOREO ORBITAL Y CLIMA
          </h1>
          <p className="text-sm sm:text-base text-[#3B2F20]/85 mt-1">
            Lectura multiespectral para <span className="font-bold">{activeLot.name}</span> ({activeLot.coordinates})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DataSourceChip source={DataSourceType.GIBS} />
          <DataSourceChip source={DataSourceType.NASA_POWER} />
        </div>
      </div>

      {/* Main Viewer + Telemetry Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Interactive Satellite Parcel Map */}
        <section className="lg:col-span-8 rounded-2xl bg-[#EFE3C2]/65 border border-[#DECFA7] p-5 sm:p-6 shadow-earth-card flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <TelemetryIconTile kind="orbita" size="md" />
              <div>
                <h2 className="text-lg font-bold text-[#283618]">
                  Mapa de ambientes · {layerInfo.label}
                </h2>
                <p className="text-xs text-[#3B2F20]/75">{layerInfo.badge}</p>
              </div>
            </div>

            {/* Spectral Layer Switcher */}
            <div
              role="group"
              aria-label="Capas espectrales"
              className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#FEFAE0] border border-[#DECFA7] p-1"
            >
              {(Object.keys(LAYER_CONFIG) as SpectralLayer[]).map((key) => {
                const active = layer === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLayer(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-[#606C38] text-[#FEFAE0]'
                        : 'text-[#3B2F20] hover:bg-[#EFE3C2]'
                    }`}
                  >
                    {LAYER_CONFIG[key].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orthophoto + Interactive SVG Parcel Overlay */}
          <div className="relative rounded-xl overflow-hidden border border-[#A3B18A] bg-[#283618] aspect-video">
            {!imgFailed ? (
              <img
                src="/src/assets/images/aerial_farmland_parcel_1794667809674.jpg"
                alt={`Vista aérea satelital de ${activeLot.name}`}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#283618] via-[#606C38] to-[#A3B18A] flex items-center justify-center text-[#FEFAE0] text-sm font-bold">
                Mosaico multiespectral · {activeLot.name}
              </div>
            )}

            {/* Spectral tint */}
            <div
              className="absolute inset-0 pointer-events-none transition-colors duration-200"
              style={{ backgroundColor: layerInfo.overlayColor }}
            />

            {/* Clickable parcel zone polygons */}
            <svg
              viewBox="0 0 800 450"
              className="absolute inset-0 w-full h-full"
              aria-label="Zonas interactivas del lote"
            >
              <polygon
                points="60,55 410,45 390,210 55,215"
                fill={selectedSector === 'norte' ? 'rgba(254, 250, 224, 0.25)' : 'rgba(40, 54, 24, 0.14)'}
                stroke={selectedSector === 'norte' ? '#FEFAE0' : '#A3B18A'}
                strokeWidth={selectedSector === 'norte' ? 3 : 1.5}
                className="cursor-pointer transition-all"
                onClick={() => setSelectedSector('norte')}
              />
              <rect x="75" y="76" width="168" height="26" rx="6" fill="rgba(40, 54, 24, 0.85)" className="pointer-events-none" />
              <text x="85" y="93" className="fill-[#FEFAE0] text-xs font-bold pointer-events-none">
                Sector Norte (NDVI 0.81)
              </text>

              <polygon
                points="200,225 585,220 570,405 190,405"
                fill={selectedSector === 'centro' ? 'rgba(254, 250, 224, 0.28)' : 'rgba(40, 54, 24, 0.14)'}
                stroke={selectedSector === 'centro' ? '#FEFAE0' : '#A3B18A'}
                strokeWidth={selectedSector === 'centro' ? 3 : 1.5}
                className="cursor-pointer transition-all"
                onClick={() => setSelectedSector('centro')}
              />
              <rect x="215" y="243" width="176" height="26" rx="6" fill="rgba(40, 54, 24, 0.85)" className="pointer-events-none" />
              <text x="225" y="260" className="fill-[#FEFAE0] text-xs font-bold pointer-events-none">
                Franja Central (NDVI {activeLot.currentNdvi.toFixed(2)})
              </text>

              <polygon
                points="595,120 750,120 750,395 585,400"
                fill={selectedSector === 'oeste' ? 'rgba(221, 161, 94, 0.35)' : 'rgba(188, 108, 37, 0.16)'}
                stroke={selectedSector === 'oeste' ? '#DDA15E' : '#BC6C25'}
                strokeWidth={selectedSector === 'oeste' ? 3 : 1.5}
                className="cursor-pointer transition-all"
                onClick={() => setSelectedSector('oeste')}
              />
              <rect x="598" y="139" width="134" height="26" rx="6" fill="rgba(40, 54, 24, 0.88)" className="pointer-events-none" />
              <text x="606" y="156" className="fill-[#FEFAE0] text-xs font-bold pointer-events-none">
                Loma Oeste (0.64)
              </text>
            </svg>
          </div>

          <p className="mt-3 text-sm text-[#3B2F20]">{layerInfo.note}</p>
        </section>

        {/* Sector Telemetry Readout + Dark Stress Card */}
        <aside className="lg:col-span-4 flex flex-col gap-5">
          <div className="rounded-2xl bg-[#E3EBDD] border border-[#A3B18A] p-5 shadow-earth-card">
            <div className="flex items-center gap-3 mb-4">
              <TelemetryIconTile kind="satelite" size="md" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#606C38]">
                  Ambiente seleccionado
                </p>
                <h3 className="text-base font-bold text-[#283618]">
                  {sectorStats.name}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl bg-[#FEFAE0] border border-[#DECFA7] p-3">
                <span className="text-[11px] text-[#3B2F20]/70 block">NDVI</span>
                <span className="text-xl font-bold text-[#283618] tabular-nums">
                  {sectorStats.ndvi.toFixed(2)}
                </span>
              </div>
              <div className="rounded-xl bg-[#FEFAE0] border border-[#DECFA7] p-3">
                <span className="text-[11px] text-[#3B2F20]/70 block">Humedad</span>
                <span className="text-xl font-bold text-[#606C38] tabular-nums">
                  {sectorStats.moisture} mm
                </span>
              </div>
              <div className="rounded-xl bg-[#FEFAE0] border border-[#DECFA7] p-3">
                <span className="text-[11px] text-[#3B2F20]/70 block">Temp sup.</span>
                <span className="text-xl font-bold text-[#BC6C25] tabular-nums">
                  {sectorStats.temp}°C
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenEvidence({
                  title: `Evidencia Espacial · ${sectorStats.name}`,
                  subtitle: `${activeLot.name} · ${layerInfo.label}`,
                  source: DataSourceType.GIBS,
                  timestamp: '12 Nov 2026 · 14:15 UTC',
                  coordinates: activeLot.coordinates,
                  metrics: [
                    { label: 'NDVI sector', value: sectorStats.ndvi.toFixed(2) },
                    { label: 'Humedad útil', value: `${sectorStats.moisture} mm` },
                    { label: 'Temp superficial', value: `${sectorStats.temp} °C` },
                    { label: 'Resolución píxel', value: '10 m (Sentinel-2)' },
                  ],
                  interpretation: layerInfo.note,
                })
              }
              className="mt-4 w-full rounded-lg bg-[#BC6C25] hover:bg-[#9A5518] active:scale-[0.98] text-white text-sm font-bold tracking-[0.04em] py-2.5 transition-all duration-150"
            >
              Ver evidencia
            </button>
          </div>

          {/* Dark Verde Bosque Telemetry Alert Container */}
          <div className="rounded-2xl bg-[#283618] border border-[#606C38] p-5 text-[#FEFAE0] shadow-earth-card flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <TelemetryIconTile kind="gota" size="md" />
                <TelemetryIconTile kind="alerta" size="md" />
                <div className="ml-1">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#A3B18A]">
                    Alerta hidroclimática
                  </p>
                  <p className="text-sm font-bold text-[#FEFAE0]">
                    Ventana crítica 10 días
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#FEFAE0]/85 leading-relaxed">
                La Loma Oeste registra un diferencial térmico de +2,5 °C respecto al
                promedio del lote. Se recomienda verificar humedad a 30 cm antes de
                refertilizar.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#606C38] flex items-center justify-between text-xs tabular-nums">
              <span className="text-[#A3B18A]">Lluvia pronosticada 7d</span>
              <span className="font-bold text-[#DDA15E]">+24 mm · NASA POWER</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Satellite Passes Table */}
      <section className="rounded-2xl bg-[#EFE3C2]/55 border border-[#DECFA7] p-5 sm:p-6 shadow-earth-card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-[#283618]">
            Registro de pasadas satelitales y telemetría
          </h2>
          <span className="text-xs font-bold text-[#3B2F20]/70 tabular-nums">
            {passes.length} pasadas recientes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-[#DECFA7] text-xs font-bold uppercase tracking-[0.06em] text-[#3B2F20]/75">
                <th className="py-2.5 pr-4">Fecha</th>
                <th className="py-2.5 pr-4">Sensor / Origen</th>
                <th className="py-2.5 pr-4 text-right">NDVI</th>
                <th className="py-2.5 pr-4 text-right">NDWI</th>
                <th className="py-2.5 pr-4 text-right">Nubes</th>
                <th className="py-2.5 pr-4">Observación</th>
                <th className="py-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DECFA7]/70 text-sm">
              {passes.map((p) => (
                <tr key={p.id} className="hover:bg-[#FEFAE0]/60 transition-colors">
                  <td className="py-3 pr-4 font-bold text-[#283618] whitespace-nowrap tabular-nums">
                    {p.date}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="font-bold text-[#3B2F20]">{p.sensor}</span>
                      <DataSourceChip source={p.source} />
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right font-bold text-[#283618] tabular-nums">
                    {p.ndviMean.toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 text-right font-bold text-[#606C38] tabular-nums">
                    {p.ndwiMoisture.toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 text-right text-[#3B2F20] tabular-nums">
                    {p.cloudCoverPct}%
                  </td>
                  <td className="py-3 pr-4 text-[#3B2F20]/85 max-w-xs">
                    {p.anomalyNote}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenEvidence({
                          title: `Pasada ${p.sensor}`,
                          subtitle: p.date,
                          source: p.source,
                          timestamp: p.date,
                          coordinates: activeLot.coordinates,
                          metrics: [
                            { label: 'NDVI medio', value: p.ndviMean.toFixed(2) },
                            { label: 'NDWI humedad', value: p.ndwiMoisture.toFixed(2) },
                            { label: 'Temp. superficial', value: `${p.surfaceTempC} °C` },
                            { label: 'Nubosidad', value: `${p.cloudCoverPct}%` },
                          ],
                          interpretation: p.anomalyNote,
                        })
                      }
                      className="rounded-lg bg-[#BC6C25] hover:bg-[#9A5518] text-white text-xs font-bold px-3 py-1.5 whitespace-nowrap"
                    >
                      Ver evidencia
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
