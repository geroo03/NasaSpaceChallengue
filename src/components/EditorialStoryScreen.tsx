import React, { useState } from 'react';
import { TelemetryIconKind, TelemetryIconTile } from './AgroIcons';

const EARTHY_PALETTE = [
  { name: 'Crema', hex: '#FEFAE0', role: 'Lienzo base y descanso visual al sol', textDark: true },
  { name: 'Verde Bosque', hex: '#283618', role: 'Títulos principales, cosecha y ancla', textDark: false },
  { name: 'Verde Oliva', hex: '#606C38', role: 'Estados activos y órbita satelital', textDark: false },
  { name: 'Verde Salvia', hex: '#A3B18A', role: 'Bordes orgánicos, agua y coberturas', textDark: true },
  { name: 'Verde Niebla', hex: '#E3EBDD', role: 'Contenedores suaves y tarjetas satélite', textDark: true },
  { name: 'Arena', hex: '#EFE3C2', role: 'Superficies estructurales y barbecho', textDark: true },
  { name: 'Terracota', hex: '#BC6C25', role: 'Acción principal y grano cosechado', textDark: false },
  { name: 'Terracota Oscuro', hex: '#9A5518', role: 'Enlaces, hover y cuaderno de campo', textDark: false },
  { name: 'Ocre', hex: '#DDA15E', role: 'Alertas solares y déficit hídrico', textDark: true },
  { name: 'Marrón Tierra', hex: '#3B2F20', role: 'Tipografía de lectura y datos tabulares', textDark: false },
];

const TELEMETRY_SPECIMENS: Array<{
  kind: TelemetryIconKind;
  title: string;
  source: string;
}> = [
  { kind: 'satelite', title: 'Satélite', source: 'NASA POWER · Clima' },
  { kind: 'orbita', title: 'Órbita', source: 'GIBS / Sentinel-2' },
  { kind: 'cuaderno', title: 'Cuaderno', source: 'Campo · Aforo real' },
  { kind: 'grano', title: 'Grano', source: 'Cultivo de cosecha' },
  { kind: 'gota', title: 'Gota', source: 'Humedad y lámina útil' },
  { kind: 'alerta', title: 'Alerta', source: 'Estrés hídrico' },
];

export const EditorialStoryScreen: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState(EARTHY_PALETTE[6]);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="space-y-12">
      {/* Editorial Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl bg-[#EFE3C2]/55 border border-[#DECFA7] p-6 sm:p-10 shadow-earth-card">
          <div>
            <h1 className="headline-display text-[2rem] sm:text-[3.25rem] leading-[1.15] uppercase text-[#283618]">
              NUESTRA HISTORIA
            </h1>
            <h2 className="mt-3 text-xl sm:text-2xl font-bold text-[#9A5518]">
              Del campo a tu mesa
            </h2>
            <p className="mt-5 text-base text-[#3B2F20] leading-relaxed">
              Nacimos en el sur de Santa Fe con una convicción simple: cada lote tiene
              una memoria hídrica y biológica que merece ser leída con precisión antes
              de decidir la próxima siembra.
            </p>
            <p className="mt-4 text-base text-[#3B2F20]/85 leading-relaxed">
              Combinamos observación satelital abierta de NASA POWER y GIBS con el
              cuaderno de campo cotidiano del ingeniero agrónomo, transformando datos
              orbitales en rotaciones regenerativas con cultivos de cobertura y menor
              huella hídrica.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-[#DECFA7] grid grid-cols-3 gap-4">
            <div>
              <span className="text-2xl font-bold text-[#283618] tabular-nums block">
                455 ha
              </span>
              <span className="text-xs text-[#3B2F20]/75">Bajo rotación activa</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-[#606C38] tabular-nums block">
                +38%
              </span>
              <span className="text-xs text-[#3B2F20]/75">Retención con vicia</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-[#BC6C25] tabular-nums block">
                100%
              </span>
              <span className="text-xs text-[#3B2F20]/75">Trazabilidad lote a mesa</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-[#A3B18A] shadow-earth-card bg-[#283618] min-h-[320px]">
          {!imgFailed ? (
            <img
              src="/src/assets/images/field_harvest_story_1794667809067.jpg"
              alt="Parcelas agrícolas sustentables al atardecer con maíz y cultivos de cobertura"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8 text-[#FEFAE0] font-bold">
              Del campo a tu mesa · Agricultura regenerativa de precisión
            </div>
          )}
        </div>
      </section>

      {/* Paleta de Colores */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="headline-display text-[1.75rem] sm:text-[2.25rem] uppercase text-[#283618]">
              PALETA DE COLORES
            </h2>
            <p className="text-sm text-[#3B2F20]/80 mt-1">
              Diez pigmentos de tierra, follaje y sol calibrados para legibilidad a plena luz de campo.
            </p>
          </div>
          <div className="rounded-xl bg-[#EFE3C2] border border-[#DECFA7] px-4 py-2 text-xs">
            <span className="font-bold text-[#283618]">{selectedColor.name}</span>
            <span className="mx-2 text-[#3B2F20]/50">·</span>
            <span className="font-bold tabular-nums text-[#9A5518]">{selectedColor.hex}</span>
            <span className="mx-2 text-[#3B2F20]/50">·</span>
            <span className="text-[#3B2F20]">{selectedColor.role}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {EARTHY_PALETTE.map((swatch) => {
            const active = selectedColor.hex === swatch.hex;
            return (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => setSelectedColor(swatch)}
                className={`text-left rounded-2xl overflow-hidden border transition-transform duration-150 hover:-translate-y-0.5 ${
                  active
                    ? 'border-[#BC6C25] ring-2 ring-[#BC6C25]/40'
                    : 'border-[#DECFA7]'
                } shadow-earth-card bg-[#FEFAE0]`}
              >
                <div
                  className="h-20 w-full flex items-end p-3"
                  style={{ backgroundColor: swatch.hex }}
                >
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      swatch.textDark ? 'text-[#3B2F20]' : 'text-[#FEFAE0]'
                    }`}
                  >
                    {swatch.hex}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-[#283618]">{swatch.name}</p>
                  <p className="text-xs text-[#3B2F20]/75 mt-0.5 line-clamp-2">
                    {swatch.role}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Semantic Agro-Telemetry Iconography */}
      <section className="rounded-2xl bg-[#E3EBDD]/65 border border-[#A3B18A] p-6 sm:p-8 shadow-earth-card">
        <h2 className="headline-display text-[1.5rem] sm:text-[2rem] uppercase text-[#283618] mb-5">
          ICONOGRAFÍA DE TELEMETRÍA
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {TELEMETRY_SPECIMENS.map((item) => (
            <div
              key={item.kind}
              className="rounded-xl bg-[#FEFAE0] border border-[#DECFA7] p-4 flex flex-col items-start gap-3"
            >
              <TelemetryIconTile kind={item.kind} size="lg" />
              <div>
                <p className="text-sm font-bold text-[#283618]">{item.title}</p>
                <p className="text-xs text-[#3B2F20]/75 mt-0.5">{item.source}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
