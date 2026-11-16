import { useLang } from '../../i18n/LangContext';
import type { FarmCase } from '../../case/model';
import type { LotApi } from '../../case/lotApi';
import { LotStart } from './LotStart';
import { TerrainCard } from './TerrainCard';
import { DroneRequestPanel } from './DroneRequestPanel';
import { Collapsible } from '../ui';

/** Screen 1, lot-first: boundary → land data → optional drone survey request. Lazy-loaded (Leaflet, Geoman, importers). */
export function LotStep({ farmCase, lot, readOnly = false }: { farmCase: FarmCase; lot: LotApi; readOnly?: boolean }) {
  const { t } = useLang();
  if (readOnly) return <TerrainCard farmCase={farmCase} lot={lot} />;
  return (
    <div className="space-y-5">
      <LotStart
        lat={farmCase.lat}
        lon={farmCase.lon}
        polygon={farmCase.lotPolygon}
        source={farmCase.lotSource}
        onLot={(ring, src) => lot.setLot(ring, src, true)}
      />
      {farmCase.lotPolygon && (
        <>
          <p className="text-sm text-[#283618]">{t('start.point', { lat: farmCase.lat.toFixed(4), lon: farmCase.lon.toFixed(4) })}</p>
          <TerrainCard farmCase={farmCase} lot={lot} />
          <Collapsible title={t('req.cta')}>
            <DroneRequestPanel farmCase={farmCase} />
          </Collapsible>
        </>
      )}
    </div>
  );
}
