import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  CropSegment,
  EvidencePayload,
  FieldLot,
  SegmentType,
} from '../types/agronomy';
import {
  CAMPAIGN_MONTHS,
  validateCropSegmentInput,
  validateNewLotInput,
} from '../utils/agronomyEngine';
import { DataSourceChip } from './AgroIcons';

interface AddSegmentModalProps {
  onClose: () => void;
  onAdd: (segment: CropSegment) => void;
}

const PRESET_CROPS = [
  {
    type: SegmentType.COSECHA,
    code: 'MZ-T',
    label: 'MZ-T Maíz tardío',
    waterImpactMm: -88,
    nitrogenBalanceKgHa: -45,
    yieldTHa: 9.4,
  },
  {
    type: SegmentType.COSECHA,
    code: 'SJ-1',
    label: 'SJ-1 Soja primera',
    waterImpactMm: -72,
    nitrogenBalanceKgHa: 24,
    yieldTHa: 4.2,
  },
  {
    type: SegmentType.COBERTURA,
    code: 'VV-C',
    label: 'Vicia villosa · cobertura',
    waterImpactMm: 22,
    nitrogenBalanceKgHa: 72,
    yieldTHa: 0,
  },
  {
    type: SegmentType.BARBECHO,
    code: 'BAR',
    label: 'Barbecho · +36 mm',
    waterImpactMm: 36,
    nitrogenBalanceKgHa: 10,
    yieldTHa: 0,
  },
];

export const AddSegmentModal: React.FC<AddSegmentModalProps> = ({
  onClose,
  onAdd,
}) => {
  const [type, setType] = useState<SegmentType>(SegmentType.COSECHA);
  const [code, setCode] = useState('GR-S');
  const [label, setLabel] = useState('GR-S Girasol estival');
  const [startMonth, setStartMonth] = useState(5);
  const [spanMonths, setSpanMonths] = useState(4);
  const [waterImpactMm, setWaterImpactMm] = useState(-64);
  const [nitrogenBalanceKgHa, setNitrogenBalanceKgHa] = useState(-28);
  const [estimatedYieldTHa, setEstimatedYieldTHa] = useState('3.4');
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (preset: (typeof PRESET_CROPS)[number]) => {
    setType(preset.type);
    setCode(preset.code);
    setLabel(preset.label);
    setWaterImpactMm(preset.waterImpactMm);
    setNitrogenBalanceKgHa(preset.nitrogenBalanceKgHa);
    setEstimatedYieldTHa(preset.yieldTHa > 0 ? String(preset.yieldTHa) : '');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateCropSegmentInput({
      code,
      label,
      startMonth,
      spanMonths,
    });
    if (!check.valid) {
      setError(check.error ?? 'Verifique los datos de la etapa.');
      return;
    }

    onAdd({
      id: `seg-${Date.now()}`,
      type,
      code: code.trim().toUpperCase(),
      label: label.trim(),
      startMonth,
      spanMonths,
      waterImpactMm: Number(waterImpactMm),
      nitrogenBalanceKgHa: Number(nitrogenBalanceKgHa),
      estimatedYieldTHa:
        type === SegmentType.COSECHA && estimatedYieldTHa
          ? Number(estimatedYieldTHa)
          : undefined,
      notes: `Etapa agregada al calendario (${CAMPAIGN_MONTHS[startMonth]} · ${spanMonths} meses).`,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-segment-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#283618]/50 backdrop-blur-[2px] p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#FEFAE0] border border-[#DECFA7] shadow-earth-modal p-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#DECFA7]">
          <div>
            <h2 id="add-segment-title" className="text-xl font-bold text-[#283618]">
              Añadir cultivo o manejo
            </h2>
            <p className="text-xs text-[#3B2F20]/75 mt-0.5">
              Inserte una etapa en el calendario de rotación de la campaña.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar diálogo"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3B2F20] hover:bg-[#EFE3C2]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Presets */}
        <div className="mt-4">
          <p className="text-xs font-bold text-[#3B2F20]/75 mb-2">
            Plantillas frecuentes
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_CROPS.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-3 py-1.5 rounded-lg bg-[#EFE3C2]/70 hover:bg-[#EFE3C2] border border-[#DECFA7] text-xs font-bold text-[#283618]"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl bg-[#ffdad6] border border-[#ba1a1a]/40 px-3.5 py-2.5 text-xs font-bold text-[#93000a]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="seg-type"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Categoría
              </label>
              <select
                id="seg-type"
                value={type}
                onChange={(e) => setType(e.target.value as SegmentType)}
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3 py-2 text-sm text-[#3B2F20]"
              >
                <option value={SegmentType.COSECHA}>Cultivo de cosecha</option>
                <option value={SegmentType.COBERTURA}>Cultivo de cobertura</option>
                <option value={SegmentType.BARBECHO}>Barbecho</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="seg-code"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Código corto
              </label>
              <input
                id="seg-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej. MZ-T"
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3 py-2 text-sm text-[#3B2F20]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="seg-label"
              className="block text-xs font-bold text-[#3B2F20] mb-1.5"
            >
              Nombre visible en calendario
            </label>
            <input
              id="seg-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej. GR-S Girasol estival"
              className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3 py-2 text-sm text-[#3B2F20]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="seg-start"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Mes de inicio
              </label>
              <select
                id="seg-start"
                value={startMonth}
                onChange={(e) => setStartMonth(Number(e.target.value))}
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3 py-2 text-sm text-[#3B2F20]"
              >
                {CAMPAIGN_MONTHS.map((m, i) => (
                  <option key={m} value={i}>
                    {m} (Mes {i + 1})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="seg-span"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Duración (meses)
              </label>
              <input
                id="seg-span"
                type="number"
                min={1}
                max={12}
                value={spanMonths}
                onChange={(e) => setSpanMonths(Number(e.target.value))}
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3 py-2 text-sm text-[#3B2F20] tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="seg-water"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Agua (mm)
              </label>
              <input
                id="seg-water"
                type="number"
                value={waterImpactMm}
                onChange={(e) => setWaterImpactMm(Number(e.target.value))}
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3 py-2 text-sm text-[#3B2F20] tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="seg-n"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                N (kg/ha)
              </label>
              <input
                id="seg-n"
                type="number"
                value={nitrogenBalanceKgHa}
                onChange={(e) => setNitrogenBalanceKgHa(Number(e.target.value))}
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3 py-2 text-sm text-[#3B2F20] tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="seg-yield"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Rinde (t/ha)
              </label>
              <input
                id="seg-yield"
                type="number"
                step="0.1"
                disabled={type !== SegmentType.COSECHA}
                value={estimatedYieldTHa}
                onChange={(e) => setEstimatedYieldTHa(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3 py-2 text-sm text-[#3B2F20] disabled:opacity-45 tabular-nums"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#DECFA7] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-[#9A5518] hover:underline"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#BC6C25] hover:bg-[#9A5518] text-white text-sm font-bold px-5 py-2.5"
            >
              Agregar al calendario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface NewLotModalProps {
  onClose: () => void;
  onCreate: (lot: FieldLot) => void;
  templateLot: FieldLot;
}

export const NewLotModal: React.FC<NewLotModalProps> = ({
  onClose,
  onCreate,
  templateLot,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [region, setRegion] = useState('Marcos Juárez · Córdoba');
  const [hectares, setHectares] = useState('135');
  const [soilType, setSoilType] = useState('Argiudol típico');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateNewLotInput({
      code,
      name,
      region,
      hectares,
      soilType,
    });
    if (!check.valid) {
      setError(check.error ?? 'Complete todos los campos del lote.');
      return;
    }

    const created: FieldLot = {
      ...templateLot,
      id: `lot-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      region: region.trim(),
      coordinates: '32.6976° S, 62.1066° O',
      hectares: Number(hectares),
      soilType: soilType.trim(),
      initialMoistureMm: 162,
      currentNdvi: 0.72,
      segments: [
        {
          id: `seg-init-${Date.now()}`,
          type: SegmentType.BARBECHO,
          code: 'BAR',
          label: 'Barbecho · +32 mm',
          startMonth: 0,
          spanMonths: 3,
          waterImpactMm: 32,
          nitrogenBalanceKgHa: 10,
          notes: 'Barbecho inicial de establecimiento.',
        },
      ],
    };

    onCreate(created);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-lot-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#283618]/50 backdrop-blur-[2px] p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#FEFAE0] border border-[#DECFA7] shadow-earth-modal p-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#DECFA7]">
          <div>
            <h2 id="new-lot-title" className="text-xl font-bold text-[#283618]">
              Crear nuevo lote agrícola
            </h2>
            <p className="text-xs text-[#3B2F20]/75 mt-0.5">
              Defina la superficie y serie edafológica para iniciar su rotación.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar diálogo"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3B2F20] hover:bg-[#EFE3C2]"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl bg-[#ffdad6] border border-[#ba1a1a]/40 px-3.5 py-2.5 text-xs font-bold text-[#93000a]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="new-lot-code"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Código
              </label>
              <input
                id="new-lot-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="L-15"
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3 py-2 text-sm text-[#3B2F20]"
              />
            </div>

            <div className="col-span-2">
              <label
                htmlFor="new-lot-name"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Nombre del lote
              </label>
              <input
                id="new-lot-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="San Martín · Lote 15"
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3 py-2 text-sm text-[#3B2F20]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="new-lot-ha"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Superficie (ha)
              </label>
              <input
                id="new-lot-ha"
                type="number"
                value={hectares}
                onChange={(e) => setHectares(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3 py-2 text-sm text-[#3B2F20] tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="new-lot-region"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Zona agroecológica
              </label>
              <input
                id="new-lot-region"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3 py-2 text-sm text-[#3B2F20]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="new-lot-soil"
              className="block text-xs font-bold text-[#3B2F20] mb-1.5"
            >
              Serie de suelo
            </label>
            <input
              id="new-lot-soil"
              type="text"
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3 py-2 text-sm text-[#3B2F20]"
            />
          </div>

          <div className="pt-3 border-t border-[#DECFA7] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-[#9A5518] hover:underline"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#BC6C25] hover:bg-[#9A5518] text-white text-sm font-bold px-5 py-2.5"
            >
              Guardar lote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EvidenceModalProps {
  payload: EvidencePayload;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  payload,
  onClose,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#283618]/50 backdrop-blur-[2px] p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#FEFAE0] border border-[#DECFA7] shadow-earth-modal p-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#DECFA7]">
          <div className="space-y-2">
            <DataSourceChip source={payload.source} />
            <h2 id="evidence-modal-title" className="text-xl font-bold text-[#283618]">
              {payload.title}
            </h2>
            <p className="text-xs text-[#3B2F20]/75">
              {payload.subtitle} · {payload.timestamp}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar evidencia"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3B2F20] hover:bg-[#EFE3C2]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {payload.metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl bg-[#EFE3C2]/70 border border-[#DECFA7] p-3.5"
            >
              <span className="text-xs text-[#3B2F20]/75 block">{m.label}</span>
              <span className="mt-1 text-base font-bold text-[#283618] tabular-nums block">
                {m.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-[#E3EBDD] border border-[#A3B18A] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-[#283618]">
            Interpretación técnica ({payload.coordinates})
          </p>
          <p className="mt-1.5 text-sm text-[#3B2F20] leading-relaxed">
            {payload.interpretation}
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#283618] hover:bg-[#606C38] text-white text-sm font-bold px-5 py-2.5"
          >
            Cerrar evidencia
          </button>
        </div>
      </div>
    </div>
  );
};
