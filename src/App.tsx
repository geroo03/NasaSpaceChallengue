import { useEffect, useMemo, useState } from 'react';
import {
  AppScreen,
  CropSegment,
  EvidencePayload,
  FieldDiaryEntry,
  FieldLot,
} from './types/agronomy';
import {
  INITIAL_DIARY_ENTRIES,
  INITIAL_LOTS,
  INITIAL_SATELLITE_PASSES,
} from './data/seedAgronomy';
import { simulateRotation } from './utils/agronomyEngine';
import { HeaderBar } from './components/HeaderBar';
import { LotsDashboardScreen } from './components/LotsDashboardScreen';
import { SatelliteMonitorScreen } from './components/SatelliteMonitorScreen';
import { FieldDiaryScreen } from './components/FieldDiaryScreen';
import { EditorialStoryScreen } from './components/EditorialStoryScreen';
import {
  AddSegmentModal,
  EvidenceModal,
  NewLotModal,
} from './components/Modals';

const STORAGE_LOTS_KEY = 'terraviva_lots_v1';
const STORAGE_DIARY_KEY = 'terraviva_diary_v1';

function loadStoredLots(): FieldLot[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_LOTS_KEY);
    if (!raw) return INITIAL_LOTS;
    const parsed = JSON.parse(raw) as FieldLot[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_LOTS;
  } catch {
    return INITIAL_LOTS;
  }
}

function loadStoredDiary(): FieldDiaryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_DIARY_KEY);
    if (!raw) return INITIAL_DIARY_ENTRIES;
    const parsed = JSON.parse(raw) as FieldDiaryEntry[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : INITIAL_DIARY_ENTRIES;
  } catch {
    return INITIAL_DIARY_ENTRIES;
  }
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>(AppScreen.LOTES);
  const [lots, setLots] = useState<FieldLot[]>(loadStoredLots);
  const [activeLotId, setActiveLotId] = useState<string>(
    () => loadStoredLots()[0]?.id ?? INITIAL_LOTS[0].id,
  );
  const [diaryEntries, setDiaryEntries] =
    useState<FieldDiaryEntry[]>(loadStoredDiary);

  const [isDirty, setIsDirty] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const [showAddSegment, setShowAddSegment] = useState(false);
  const [showNewLot, setShowNewLot] = useState(false);
  const [evidencePayload, setEvidencePayload] =
    useState<EvidencePayload | null>(null);

  const activeLot = useMemo(
    () => lots.find((l) => l.id === activeLotId) ?? lots[0],
    [lots, activeLotId],
  );

  const simulation = useMemo(() => simulateRotation(activeLot), [activeLot]);

  useEffect(() => {
    if (!saveFeedback) return;
    const timer = window.setTimeout(() => setSaveFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [saveFeedback]);

  const updateActiveLot = (updater: (lot: FieldLot) => FieldLot) => {
    setLots((prev) =>
      prev.map((l) => (l.id === activeLot.id ? updater(l) : l)),
    );
    setIsDirty(true);
  };

  const handleSimulate = () => {
    const res = simulateRotation(activeLot);
    setSaveFeedback(
      `Simulación completada para ${activeLot.name}: humedad final ${res.finalMoistureMm} mm · rinde proyectado ${res.projectedYieldTHa} t/ha (${res.stressLevel}).`,
    );
  };

  const handleAddSegment = (segment: CropSegment) => {
    updateActiveLot((lot) => ({
      ...lot,
      segments: [...lot.segments, segment],
    }));
    setSaveFeedback(`Etapa "${segment.label}" añadida al calendario.`);
  };

  const handleRemoveSegment = (segmentId: string) => {
    updateActiveLot((lot) => ({
      ...lot,
      segments: lot.segments.filter((s) => s.id !== segmentId),
    }));
  };

  const handleSaveLot = () => {
    try {
      window.localStorage.setItem(STORAGE_LOTS_KEY, JSON.stringify(lots));
      setIsDirty(false);
      setSaveFeedback(`Cambios de "${activeLot.name}" guardados correctamente.`);
    } catch {
      setSaveFeedback('No se pudo persistir en almacenamiento local.');
    }
  };

  const handleResetLot = () => {
    const seedMatch = INITIAL_LOTS.find((l) => l.id === activeLot.id);
    if (seedMatch) {
      setLots((prev) => prev.map((l) => (l.id === activeLot.id ? seedMatch : l)));
      setIsDirty(false);
      setSaveFeedback(`Rotación de "${seedMatch.name}" restablecida al valor base.`);
    } else {
      updateActiveLot((lot) => ({ ...lot, segments: [] }));
      setSaveFeedback(`Etapas de "${activeLot.name}" restablecidas.`);
    }
  };

  const handleCreateLot = (newLot: FieldLot) => {
    const nextLots = [...lots, newLot];
    setLots(nextLots);
    setActiveLotId(newLot.id);
    try {
      window.localStorage.setItem(STORAGE_LOTS_KEY, JSON.stringify(nextLots));
    } catch {
      // ignore storage errors
    }
    setActiveScreen(AppScreen.LOTES);
    setIsDirty(false);
    setSaveFeedback(`Lote "${newLot.name}" creado y guardado.`);
  };

  const handleAddDiaryEntry = (entry: FieldDiaryEntry) => {
    const next = [entry, ...diaryEntries];
    setDiaryEntries(next);
    try {
      window.localStorage.setItem(STORAGE_DIARY_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const handleNavigate = (screen: AppScreen) => {
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FEFAE0] text-[#3B2F20]">
      <HeaderBar
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        onOpenNewLot={() => setShowNewLot(true)}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
        {activeScreen === AppScreen.LOTES && (
          <LotsDashboardScreen
            lots={lots}
            activeLot={activeLot}
            simulation={simulation}
            isDirty={isDirty}
            saveFeedback={saveFeedback}
            onSelectLot={(id) => {
              setActiveLotId(id);
              setSaveFeedback(null);
            }}
            onUpdateLotField={(patch) =>
              updateActiveLot((lot) => ({ ...lot, ...patch }))
            }
            onSimulate={handleSimulate}
            onOpenAddSegment={() => setShowAddSegment(true)}
            onSaveLot={handleSaveLot}
            onResetLot={handleResetLot}
            onRemoveSegment={handleRemoveSegment}
            onOpenEvidence={setEvidencePayload}
          />
        )}

        {activeScreen === AppScreen.SATELITE && (
          <SatelliteMonitorScreen
            activeLot={activeLot}
            passes={INITIAL_SATELLITE_PASSES}
            onOpenEvidence={setEvidencePayload}
          />
        )}

        {activeScreen === AppScreen.CUADERNO && (
          <FieldDiaryScreen
            lots={lots}
            activeLot={activeLot}
            entries={diaryEntries}
            onAddEntry={handleAddDiaryEntry}
            onOpenEvidence={setEvidencePayload}
          />
        )}

        {activeScreen === AppScreen.HISTORIA && <EditorialStoryScreen />}
      </main>

      {/* Dark Verde Bosque Footer */}
      <footer className="bg-[#283618] text-[#FEFAE0] border-t border-[#606C38]/40 mt-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-base tracking-[0.06em]">
              <span className="font-extralight uppercase">TERRA</span>
              <span className="font-bold">VIVA</span>
              <span className="mx-2 text-[#A3B18A]">·</span>
              <span className="text-sm text-[#E3EBDD]">
                Agronomía de Precisión y Manejo Regenerativo
              </span>
            </p>
            <p className="text-xs text-[#A3B18A] mt-1">
              Fuentes integradas: NASA POWER · GIBS Sentinel-2 · Cuaderno de Campo
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-bold tracking-[0.05em]">
            <button
              type="button"
              onClick={() => setActiveScreen(AppScreen.LOTES)}
              className="text-[#FEFAE0] hover:text-[#DDA15E] transition-colors"
            >
              Lotes y Rotación
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen(AppScreen.SATELITE)}
              className="text-[#FEFAE0] hover:text-[#DDA15E] transition-colors"
            >
              Satélite
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen(AppScreen.CUADERNO)}
              className="text-[#FEFAE0] hover:text-[#DDA15E] transition-colors"
            >
              Cuaderno de Campo
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen(AppScreen.HISTORIA)}
              className="text-[#FEFAE0] hover:text-[#DDA15E] transition-colors"
            >
              Nuestra Historia
            </button>
          </div>
        </div>
      </footer>

      {showAddSegment && (
        <AddSegmentModal
          onClose={() => setShowAddSegment(false)}
          onAdd={handleAddSegment}
        />
      )}

      {showNewLot && (
        <NewLotModal
          templateLot={activeLot}
          onClose={() => setShowNewLot(false)}
          onCreate={handleCreateLot}
        />
      )}

      {evidencePayload && (
        <EvidenceModal
          payload={evidencePayload}
          onClose={() => setEvidencePayload(null)}
        />
      )}
    </div>
  );
}
