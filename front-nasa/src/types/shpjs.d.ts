declare module 'shpjs' {
  /** Parses a zipped shapefile (shp + dbf + prj) into GeoJSON in WGS84. Returns an array for multi-layer zips. */
  export default function shp(input: ArrayBuffer | string): Promise<unknown>;
}
