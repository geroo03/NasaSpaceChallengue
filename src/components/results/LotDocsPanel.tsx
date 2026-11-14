import { useEffect, useState } from 'react';
import { FileText, FileUp, Loader2 } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import type { LatLon } from '../../imagery/flightOrder';
import type { CandidatePolygon, ImportNotice, LotProblem } from '../../imagery/lotImport';
import type { LotSource } from '../../case/model';
import { Notice, secondaryBtn } from '../ui';

/** Coordinate systems offered for DXF surveyor plans (DXF files carry no CRS of their own). */
const DXF_CRS: { epsg: number; key: string }[] = [
  ...[1, 2, 3, 4, 5, 6, 7].map((f) => ({ epsg: 5342 + f, key: `posgar${f}` })),
  { epsg: 32719, key: 'utm19s' },
  { epsg: 32720, key: 'utm20s' },
  { epsg: 32721, key: 'utm21s' },
  { epsg: 4326, key: 'wgs84' },
];

interface Doc {
  name: string;
  url: string;
  kind: 'pdf' | 'image';
}

export function LotDocsPanel({ onLot }: { onLot: (ring: LatLon[], source: LotSource) => void }) {
  const { t, num } = useLang();
  const [dxfEpsg, setDxfEpsg] = useState(5346); // POSGAR 2007 faja 4: Santiago del Estero
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState<{ file: string; format: string; items: (CandidatePolygon & { problem: LotProblem | null })[] } | null>(null);
  const [notices, setNotices] = useState<ImportNotice[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => () => docs.forEach((d) => URL.revokeObjectURL(d.url)), [docs]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    setPending(null);
    setNotices([]);
    if (/\.(pdf|png|jpe?g)$/i.test(file.name)) {
      setDocs((d) => [...d, { name: file.name, url: URL.createObjectURL(file), kind: /\.pdf$/i.test(file.name) ? 'pdf' : 'image' }]);
      return;
    }
    setBusy(true);
    try {
      const mod = await import('../../imagery/lotImport');
      try {
        const { format, polygons, notices: found } = await mod.importLotFile(file, dxfEpsg);
        setNotices(found);
        const items = polygons.map((p) => ({ ...p, problem: p.blocked ?? mod.validateLot(p.ring) }));
        const valid = items.filter((p) => !p.problem);
        if (items.length === 1 && valid.length === 1) {
          onLot(valid[0]!.ring, { kind: 'file', fileName: file.name, format, parcel: valid[0]!.name });
        } else {
          setPending({ file: file.name, format, items });
        }
      } catch (e) {
        setErr(e instanceof mod.LotImportError ? t(`docs.err.${e.code}`, { detail: e.detail, mb: 30 }) : String(e));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#DECFA7] bg-[#FEFAE0] p-4 space-y-3">
      <h3 className="font-bold text-[#283618]">{t('docs.title')}</h3>
      <p className="text-sm text-[#3B2F20]/90">{t('docs.help')}</p>
      <ul className="text-xs text-[#3B2F20]/90 list-disc pl-5 space-y-0.5">
        <li>{t('docs.fmt.kml')}</li>
        <li>{t('docs.fmt.shp')}</li>
        <li>{t('docs.fmt.geojson')}</li>
        <li>{t('docs.fmt.dxf')}</li>
        <li>{t('docs.fmt.pdf')}</li>
      </ul>
      <div className="flex flex-wrap items-end gap-3">
        <label className={`${secondaryBtn} cursor-pointer`}>
          {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <FileUp aria-hidden className="h-4 w-4" />}
          {busy ? t('docs.reading') : t('docs.upload')}
          <input
            type="file"
            accept=".kml,.kmz,.geojson,.json,.zip,.dxf,.pdf,.png,.jpg,.jpeg"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        <label className="text-xs font-bold text-[#3B2F20]">
          {t('docs.dxfCrs')}
          <select value={dxfEpsg} onChange={(e) => setDxfEpsg(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-[#DECFA7] bg-white px-2 py-2 text-sm font-normal">
            {DXF_CRS.map((c) => (
              <option key={c.epsg} value={c.epsg}>
                {t(`docs.crs.${c.key}`)}
                {c.epsg === 5346 ? ` · ${t('docs.crs.sde')}` : ''} (EPSG:{c.epsg})
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-[#3B2F20]/80">{t('docs.privacy')}</p>
      {err && <Notice tone="error">{err}</Notice>}
      {notices.length > 0 && (
        <Notice tone="warn">
          <ul className="list-disc pl-5 space-y-0.5">
            {notices.map((n, i) => (
              <li key={i}>{t(`docs.notice.${n.key}`, n.params ?? {})}</li>
            ))}
          </ul>
        </Notice>
      )}

      {pending && (
        <div className="space-y-2" role="group" aria-label={t('docs.choose')}>
          <p className="text-sm font-bold text-[#283618]">{t('docs.choose')}</p>
          <ul className="space-y-1.5">
            {pending.items.map((p, i) => (
              <li key={i}>
                <button
                  type="button"
                  disabled={p.problem !== null}
                  onClick={() => {
                    onLot(p.ring, { kind: 'file', fileName: pending.file, format: pending.format, parcel: p.name });
                    setPending(null);
                  }}
                  className="w-full flex justify-between gap-3 rounded-lg border border-[#DECFA7] bg-white px-3 py-2 text-left text-sm hover:border-[#283618] disabled:opacity-60 disabled:hover:border-[#DECFA7] focus-visible:outline-2 focus-visible:outline-[#BC6C25]"
                >
                  <span className="font-bold break-all">{p.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {num(p.areaHa, 1)} ha{p.problem ? ` · ${t(`lot.problem.${p.problem}`)}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {docs.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-[#283618]">{t('docs.attached')}</p>
          <ul className="space-y-1">
            {docs.map((d, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-[#DECFA7] bg-white px-3 py-2 text-sm">
                <span className="flex items-center gap-2 break-all">
                  <FileText aria-hidden className="h-4 w-4 shrink-0 text-[#606C38]" /> {d.name}
                </span>
                <a href={d.url} target="_blank" rel="noreferrer" className="shrink-0 font-bold text-[#9A5518] underline-offset-2 hover:underline">
                  {t('docs.open')}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#3B2F20]/80">{t('docs.attachedNote')}</p>
        </div>
      )}
    </div>
  );
}
