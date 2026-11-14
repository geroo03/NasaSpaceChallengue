import React, { useState } from 'react';
import { Search } from 'lucide-react';
import {
  DataSourceType,
  EvidencePayload,
  FieldDiaryEntry,
  FieldLot,
  StressLevel,
} from '../types/agronomy';
import { validateDiaryEntryInput } from '../utils/agronomyEngine';
import { DataSourceChip, TelemetryIconTile } from './AgroIcons';

interface FieldDiaryScreenProps {
  lots: FieldLot[];
  activeLot: FieldLot;
  entries: FieldDiaryEntry[];
  onAddEntry: (entry: FieldDiaryEntry) => void;
  onOpenEvidence: (payload: EvidencePayload) => void;
}

export const FieldDiaryScreen: React.FC<FieldDiaryScreenProps> = ({
  lots,
  activeLot,
  entries,
  onAddEntry,
  onOpenEvidence,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lotFilter, setLotFilter] = useState<string>('all');

  // Form state
  const [formLotId, setFormLotId] = useState(activeLot.id);
  const [observer, setObserver] = useState('Ing. Agr. Sofía Peralta');
  const [stage, setStage] = useState('');
  const [soilMoisturePct, setSoilMoisturePct] = useState('62');
  const [biomassKgHa, setBiomassKgHa] = useState('4200');
  const [measuredYieldTHa, setMeasuredYieldTHa] = useState('');
  const [alertLevel, setAlertLevel] = useState<StressLevel>(StressLevel.OPTIMO);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const filteredEntries = entries.filter((entry) => {
    const matchesLot = lotFilter === 'all' || entry.lotId === lotFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchesQuery =
      !q ||
      entry.stage.toLowerCase().includes(q) ||
      entry.observer.toLowerCase().includes(q) ||
      entry.notes.toLowerCase().includes(q) ||
      entry.lotName.toLowerCase().includes(q);
    return matchesLot && matchesQuery;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess(null);

    const check = validateDiaryEntryInput({
      observer,
      stage,
      soilMoisturePct,
      biomassKgHa,
      notes,
    });

    if (!check.valid) {
      setFormError(check.error ?? 'Verifique los campos obligatorios.');
      return;
    }

    const selectedLot = lots.find((l) => l.id === formLotId) ?? activeLot;
    const yieldNum = measuredYieldTHa.trim() ? Number(measuredYieldTHa) : null;

    const newEntry: FieldDiaryEntry = {
      id: `diary-${Date.now()}`,
      lotId: selectedLot.id,
      lotName: selectedLot.name,
      date: '14 Nov 2026',
      observer: observer.trim(),
      stage: stage.trim(),
      soilMoisturePct: Number(soilMoisturePct),
      measuredYieldTHa: yieldNum !== null && !Number.isNaN(yieldNum) ? yieldNum : null,
      biomassKgHa: Number(biomassKgHa),
      source: DataSourceType.CAMPO,
      alertLevel,
      notes: notes.trim(),
    };

    onAddEntry(newEntry);
    setFormError(null);
    setFormSuccess(`Registro de aforo guardado en ${selectedLot.name}.`);
    setStage('');
    setMeasuredYieldTHa('');
    setNotes('');
  };

  const handleResetForm = () => {
    setStage('');
    setSoilMoisturePct('62');
    setBiomassKgHa('4200');
    setMeasuredYieldTHa('');
    setAlertLevel(StressLevel.OPTIMO);
    setNotes('');
    setFormError(null);
    setFormSuccess(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="headline-display text-[1.75rem] sm:text-[2.5rem] leading-tight uppercase text-[#283618]">
            CUADERNO DE CAMPO
          </h1>
          <p className="text-sm sm:text-base text-[#3B2F20]/85 mt-1">
            Relevamientos agronómicos, mediciones gravimétricas y aforos reales en lote.
          </p>
        </div>
        <DataSourceChip source={DataSourceType.CAMPO} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Search + Diary Ledger */}
        <section className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="rounded-2xl bg-[#EFE3C2]/65 border border-[#DECFA7] p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3B2F20]/50"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Buscar en cuaderno de campo"
                placeholder="Buscar por labor, técnico o nota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none pl-10 pr-3.5 py-2 text-sm text-[#3B2F20] placeholder:text-[#3B2F20]/50"
              />
            </div>

            <select
              aria-label="Filtrar por lote"
              value={lotFilter}
              onChange={(e) => setLotFilter(e.target.value)}
              className="rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3.5 py-2 text-sm font-bold text-[#3B2F20]"
            >
              <option value="all">Todos los lotes ({entries.length})</option>
              {lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} · {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Entries List */}
          {filteredEntries.length === 0 ? (
            <div className="rounded-2xl bg-[#FEFAE0] border border-[#DECFA7] p-8 text-center">
              <p className="text-base font-bold text-[#283618]">
                No hay registros que coincidan con el filtro actual
              </p>
              <p className="text-sm text-[#3B2F20]/75 mt-1">
                Limpie el buscador o registre un nuevo aforo en el formulario lateral.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setLotFilter('all');
                }}
                className="mt-4 text-sm font-bold text-[#9A5518] hover:underline"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-2xl bg-[#EFE3C2]/55 border border-[#DECFA7] p-5 shadow-earth-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <TelemetryIconTile kind="cuaderno" size="md" />
                      <div>
                        <h2 className="text-base font-bold text-[#283618]">
                          {entry.stage}
                        </h2>
                        <p className="text-xs text-[#3B2F20]/75 mt-0.5">
                          {entry.lotName} · {entry.date} · {entry.observer}
                        </p>
                      </div>
                    </div>

                    <DataSourceChip source={entry.source} />
                  </div>

                  <p className="mt-3 text-sm text-[#3B2F20] leading-relaxed">
                    {entry.notes}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#DECFA7] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#3B2F20] tabular-nums">
                      <span>
                        Humedad:{' '}
                        <span className="text-[#283618]">{entry.soilMoisturePct}%</span>
                      </span>
                      <span>
                        Biomasa:{' '}
                        <span className="text-[#606C38]">
                          {entry.biomassKgHa.toLocaleString('es-AR')} kg/ha
                        </span>
                      </span>
                      {entry.measuredYieldTHa !== null && (
                        <span>
                          Aforo grano:{' '}
                          <span className="text-[#BC6C25]">
                            {entry.measuredYieldTHa} t/ha
                          </span>
                        </span>
                      )}
                      <span
                        className={
                          entry.alertLevel === StressLevel.OPTIMO
                            ? 'text-[#606C38]'
                            : 'text-[#9A5518]'
                        }
                      >
                        Estado: {entry.alertLevel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenEvidence({
                          title: `Aforo de campo · ${entry.stage}`,
                          subtitle: `${entry.lotName} · ${entry.date}`,
                          source: entry.source,
                          timestamp: entry.date,
                          coordinates:
                            lots.find((l) => l.id === entry.lotId)?.coordinates ??
                            activeLot.coordinates,
                          metrics: [
                            { label: 'Responsable', value: entry.observer },
                            {
                              label: 'Humedad gravimétrica',
                              value: `${entry.soilMoisturePct}%`,
                            },
                            {
                              label: 'Biomasa seca',
                              value: `${entry.biomassKgHa} kg/ha`,
                            },
                            {
                              label: 'Rinde aforado',
                              value:
                                entry.measuredYieldTHa !== null
                                  ? `${entry.measuredYieldTHa} t/ha`
                                  : 'En desarrollo',
                            },
                          ],
                          interpretation: entry.notes,
                        })
                      }
                      className="rounded-lg bg-[#BC6C25] hover:bg-[#9A5518] text-white text-xs font-bold px-3.5 py-1.5 whitespace-nowrap"
                    >
                      Ver evidencia
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Right: New Aforo Form */}
        <section className="lg:col-span-5 rounded-2xl bg-[#E3EBDD]/70 border border-[#A3B18A] p-5 sm:p-6 shadow-earth-card">
          <h2 className="text-lg font-bold text-[#283618]">
            Registrar nuevo aforo en campo
          </h2>
          <p className="text-xs text-[#3B2F20]/80 mt-0.5 mb-4">
            Cargue mediciones directas para calibrar la proyección satelital.
          </p>

          {formError && (
            <div
              role="alert"
              className="mb-4 rounded-xl bg-[#ffdad6] border border-[#ba1a1a]/40 px-3.5 py-2.5 text-xs font-bold text-[#93000a]"
            >
              {formError}
            </div>
          )}

          {formSuccess && (
            <div
              role="status"
              className="mb-4 rounded-xl bg-[#FEFAE0] border border-[#606C38] px-3.5 py-2.5 text-xs font-bold text-[#283618]"
            >
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="diary-lot"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Lote relevado
              </label>
              <select
                id="diary-lot"
                value={formLotId}
                onChange={(e) => setFormLotId(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3.5 py-2 text-sm text-[#3B2F20]"
              >
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="diary-observer"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Responsable técnico
              </label>
              <input
                id="diary-observer"
                type="text"
                value={observer}
                onChange={(e) => setObserver(e.target.value)}
                placeholder="Ej. Ing. Agr. Sofía Peralta"
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3.5 py-2 text-sm text-[#3B2F20] placeholder:text-[#3B2F20]/50"
              />
            </div>

            <div>
              <label
                htmlFor="diary-stage"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Estadio fenológico o labor
              </label>
              <input
                id="diary-stage"
                type="text"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                placeholder="Ej. Maíz tardío V6 · recuento stand"
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3.5 py-2 text-sm text-[#3B2F20] placeholder:text-[#3B2F20]/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="diary-moisture"
                  className="block text-xs font-bold text-[#3B2F20] mb-1.5"
                >
                  Humedad suelo (%)
                </label>
                <input
                  id="diary-moisture"
                  type="number"
                  value={soilMoisturePct}
                  onChange={(e) => setSoilMoisturePct(e.target.value)}
                  className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3.5 py-2 text-sm text-[#3B2F20] tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="diary-biomass"
                  className="block text-xs font-bold text-[#3B2F20] mb-1.5"
                >
                  Biomasa (kg MS/ha)
                </label>
                <input
                  id="diary-biomass"
                  type="number"
                  value={biomassKgHa}
                  onChange={(e) => setBiomassKgHa(e.target.value)}
                  className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3.5 py-2 text-sm text-[#3B2F20] tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="diary-yield"
                  className="block text-xs font-bold text-[#3B2F20] mb-1.5"
                >
                  Aforo grano (t/ha, opc.)
                </label>
                <input
                  id="diary-yield"
                  type="number"
                  step="0.1"
                  value={measuredYieldTHa}
                  onChange={(e) => setMeasuredYieldTHa(e.target.value)}
                  placeholder="Ej. 9.2"
                  className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3.5 py-2 text-sm text-[#3B2F20] placeholder:text-[#3B2F20]/50 tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="diary-alert"
                  className="block text-xs font-bold text-[#3B2F20] mb-1.5"
                >
                  Condición hídrica
                </label>
                <select
                  id="diary-alert"
                  value={alertLevel}
                  onChange={(e) => setAlertLevel(e.target.value as StressLevel)}
                  className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3.5 py-2 text-sm text-[#3B2F20]"
                >
                  <option value={StressLevel.OPTIMO}>Óptimo</option>
                  <option value={StressLevel.MODERADO}>Moderado</option>
                  <option value={StressLevel.CRITICO}>Crítico</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="diary-notes"
                className="block text-xs font-bold text-[#3B2F20] mb-1.5"
              >
                Observaciones de campo
              </label>
              <textarea
                id="diary-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalle profundidad de napa, uniformidad de emergencia o presencia de malezas..."
                className="w-full rounded-lg bg-white border border-[#EFE3C2] focus:border-2 focus:border-[#606C38] focus:outline-none px-3.5 py-2 text-sm text-[#3B2F20] placeholder:text-[#3B2F20]/50"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="bg-transparent text-sm font-bold text-[#9A5518] hover:underline px-2 py-2"
              >
                Restablecer
              </button>

              <button
                type="submit"
                className="rounded-lg bg-[#BC6C25] hover:bg-[#9A5518] active:scale-[0.98] text-white text-sm font-bold tracking-[0.04em] px-5 py-2.5 transition-all duration-150"
              >
                Guardar registro
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
