import { z } from 'zod';

/** Request bodies. Everything the client sends is validated here before it reaches the database. */
const uuid = z.string().uuid();
const finite = z.number().finite();

export const perfilIn = z.object({
  nombre: z.string().trim().min(1).max(120),
  establecimiento: z.string().trim().max(160).default(''),
  idioma: z.enum(['es', 'en']).default('en'),
});

const pulveriza = z.object({ tankL: finite.min(0).max(200), swathM: finite.min(0).max(30), speedKmh: finite.min(0).max(60) });
const siembra = z.object({ hopperKg: finite.min(0).max(300), swathM: finite.min(0).max(30), speedKmh: finite.min(0).max(60) });

export const dronIn = z.object({
  modelo: z.string().trim().min(1).max(120),
  camara_mapeo: z.enum(['none', 'rgb', 'multispectral']),
  bateria_min: finite.min(0).max(120).default(0),
  pulveriza: pulveriza.nullable().default(null),
  siembra: siembra.nullable().default(null),
  activo: z.boolean().default(true),
});
export const dronPatch = dronIn.partial();

const position = z.tuple([finite.min(-180).max(180), finite.min(-90).max(90)]);
const polygon = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(position).min(4).max(5000)).min(1).max(50),
});

export const loteIn = z.object({
  nombre: z.string().trim().min(1).max(120),
  geometry: polygon,
  centroid_lat: finite.min(-90).max(90),
  centroid_lng: finite.min(-180).max(180),
  area_ha: finite.positive().max(1_000_000),
  origen: z.enum(['dibujo', 'kml', 'shp', 'geojson', 'dxf', 'ejemplo']).default('dibujo'),
  pendiente_pct: finite.min(0).max(100).nullable().default(null),
  fuente_pendiente: z.enum(['srtm', 'dsm', 'declarada']).nullable().default(null),
  agua_util_mm: finite.min(0).max(1000).nullable().default(null),
  fuente_suelo: z.enum(['soilgrids', 'analisis', 'supuesto']).nullable().default(null),
});
export const lotePatch = loteIn.partial();

/** Snapshots: free-form JSON, but bounded in size. */
const snapshot = z.record(z.string(), z.unknown()).refine((v) => JSON.stringify(v).length <= 20_000, 'too large');

export const analisisIn = z.object({
  lote_id: uuid.nullable().default(null),
  lat: finite.min(-90).max(90),
  lng: finite.min(-180).max(180),
  entrada: snapshot,
  resultado: snapshot,
});

export const pedidoIn = z.object({
  lote_id: uuid.nullable().default(null),
  dron_id: uuid.nullable().default(null),
  trabajo: z.enum(['map', 'vra', 'seed', 'spray', 'survey']),
  ejecutor: z.enum(['propio', 'vuelo_verde']),
  canal: z.enum(['whatsapp', 'email', 'compartir', 'copiado']),
  plan: snapshot.default({}),
  texto: z.string().min(1).max(8000),
});
export const pedidoEstado = z.object({ estado: z.enum(['enviado', 'aceptado', 'hecho', 'cancelado']) });

export type PerfilIn = z.infer<typeof perfilIn>;
export type DronIn = z.infer<typeof dronIn>;
export type LoteIn = z.infer<typeof loteIn>;
export type AnalisisIn = z.infer<typeof analisisIn>;
export type PedidoIn = z.infer<typeof pedidoIn>;
export { uuid };
