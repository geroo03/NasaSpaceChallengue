import { describe, expect, it } from 'vitest';
import { writeArrayBuffer } from 'geotiff';
import { readVigor } from './vigor';
import { DroneImageError } from './drone';

// Node has Blob/File but no FileReader, which geotiff's fromBlob uses in the browser.
if (typeof globalThis.FileReader === 'undefined') {
  class NodeFileReader {
    onload: ((e: { target: { result: ArrayBuffer } }) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    onabort: ((e: unknown) => void) | null = null;
    abort() {}
    readAsArrayBuffer(blob: Blob) {
      blob.arrayBuffer().then((result) => this.onload?.({ target: { result } }), (e) => this.onerror?.(e));
    }
  }
  (globalThis as unknown as { FileReader: unknown }).FileReader = NodeFileReader;
}

/** A real 4-band GeoTIFF in POSGAR faja 4 (EPSG:5346), 10 m pixels. */
function tiff(bands: number[], photometric: number, extra?: number[]): File {
  const w = 4;
  const h = 4;
  const data = new Uint8Array(w * h * bands.length);
  for (let i = 0; i < w * h; i++) bands.forEach((v, b) => (data[i * bands.length + b] = v));
  const meta: Record<string, unknown> = {
    width: w,
    height: h,
    SamplesPerPixel: bands.length,
    BitsPerSample: bands.map(() => 8),
    PhotometricInterpretation: photometric,
    ModelPixelScale: [10, 10, 0],
    ModelTiepoint: [0, 0, 0, 4_500_000, 6_860_000, 0],
    GTModelTypeGeoKey: 1,
    ProjectedCSTypeGeoKey: 5346,
  };
  if (extra) meta.ExtraSamples = extra;
  const buf = writeArrayBuffer(data as unknown as number[], meta);
  return new File([buf], 'mapa.tif', { type: 'image/tiff' });
}

describe('reading a drone vigour GeoTIFF', () => {
  it('rejects an RGB/RGBA orthomosaic: its 4th band is not near-infrared', async () => {
    const rgba = tiff([120, 80, 50, 255], 2);
    await expect(readVigor(rgba, null)).rejects.toMatchObject({ code: 'vigorBands' });
    await expect(readVigor(rgba, null)).rejects.toBeInstanceOf(DroneImageError);
  });

  it('rejects a grey stack whose 4th band is declared alpha', async () => {
    await expect(readVigor(tiff([120, 80, 50, 255], 1, [2]), null)).rejects.toMatchObject({ code: 'vigorBands' });
  });

  it('computes NDVI from a multispectral stack (G, R, RE, NIR)', async () => {
    const r = await readVigor(tiff([90, 50, 200, 250], 1), null);
    expect(r.source).toBe('computed');
    expect(r.values[0]).toBeCloseTo((250 - 50) / (250 + 50), 5);
  });
});
