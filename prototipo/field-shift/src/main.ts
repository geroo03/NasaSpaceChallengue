import 'leaflet/dist/leaflet.css';
import './styles.css';
import L from 'leaflet';
import { Chart, registerables } from 'chart.js';
import { fetchClimateSeries, PowerApiError, type ClimateSeries } from './data/power';
import { applyScenario, buildClimateProfile, type ClimateProfile, type Trend } from './analysis/climate';
import {
  compareStrategies,
  DIMENSIONS,
  GLOBAL_GAPS,
  TEMPLATES,
  type Dimension,
  type FarmContext,
  type StrategyResult,
  type TemplateId,
} from './domain/rotations';
import type { CropId } from './domain/crops';
import { cropName, MONTHS, msg, t, type Lang } from './i18n';

Chart.register(...registerables);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const DEFAULT_POINT = { lat: -27.7834, lon: -64.2642 }; // Santiago del Estero, AR – change freely
const DEFAULT_PRIORITIES: Record<Dimension, number> = {
  waterSecurity: 4, waterUse: 3, climateRisk: 3, soil: 4, erosion: 3, pests: 2, income: 3,
};

const CROP_COLORS: Record<CropId, string> = {
  soy: '#7fb069', soy2: '#a7c957', maize: '#e9c46a', sorghum: '#d68c45', sunflower: '#f4d35e',
  cotton: '#cdb4db', wheat: '#c9a227', chickpea: '#95b8d1', vetch: '#6a994e', cereal_rye: '#588157',
  oat_cover: '#84a98c', alfalfa: '#2a9d8f',
};

let lang: Lang = 'es';
let cachedSeries: { key: string; series: ClimateSeries } | null = null;
let lastRun: { profile: ClimateProfile; strategies: StrategyResult[] } | null = null;
let climateChart: Chart | null = null;
let radarChart: Chart | null = null;

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
};

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------

const latInput = $<HTMLInputElement>('lat');
const lonInput = $<HTMLInputElement>('lon');
latInput.value = String(DEFAULT_POINT.lat);
lonInput.value = String(DEFAULT_POINT.lon);

const map = L.map('map').setView([DEFAULT_POINT.lat, DEFAULT_POINT.lon], 6);
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap',
}).addTo(map);

// NASA GIBS imagery: the date snaps to the closest available composite.
const gibsDate = new Date(Date.now() - 20 * 86_400_000).toISOString().slice(0, 10);
const ndvi = L.tileLayer(
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_NDVI_16Day/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`,
  { maxNativeZoom: 9, maxZoom: 18, opacity: 0.7, attribution: 'NASA GIBS / MODIS' },
);
const smap = L.tileLayer(
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Root_Zone_Soil_Moisture/default/${gibsDate}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
  { maxNativeZoom: 6, maxZoom: 18, opacity: 0.6, attribution: 'NASA GIBS / SMAP L4' },
);
L.control
  .layers({ OpenStreetMap: osm }, { [`MODIS NDVI (${gibsDate})`]: ndvi, [`SMAP root-zone soil moisture (${gibsDate})`]: smap })
  .addTo(map);

const marker = L.circleMarker([DEFAULT_POINT.lat, DEFAULT_POINT.lon], { radius: 8, color: '#2f6b3a', weight: 3 }).addTo(map);
map.on('click', (e: L.LeafletMouseEvent) => {
  latInput.value = e.latlng.lat.toFixed(4);
  lonInput.value = L.Util.wrapNum(e.latlng.lng, [-180, 180], true).toFixed(4);
  marker.setLatLng(e.latlng);
});
for (const input of [latInput, lonInput]) {
  input.addEventListener('change', () => {
    const lat = Number(latInput.value);
    const lon = Number(lonInput.value);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      marker.setLatLng([lat, lon]);
      map.panTo([lat, lon]);
    }
  });
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

const templateSelect = $<HTMLSelectElement>('current-template');
const prioritiesBox = $<HTMLDivElement>('priorities');
const precipInput = $<HTMLInputElement>('precip-pct');
const tempInput = $<HTMLInputElement>('temp-c');
const statusEl = $<HTMLParagraphElement>('status');
const form = $<HTMLFormElement>('farm-form');

for (const d of DIMENSIONS) {
  const label = document.createElement('label');
  const span = document.createElement('span');
  span.dataset['i18n'] = `dim.${d}`;
  const out = document.createElement('output');
  out.id = `prio-out-${d}`;
  out.textContent = String(DEFAULT_PRIORITIES[d]);
  const input = document.createElement('input');
  Object.assign(input, { type: 'range', min: '0', max: '5', step: '1', id: `prio-${d}`, value: String(DEFAULT_PRIORITIES[d]) });
  input.addEventListener('input', () => {
    out.textContent = input.value;
  });
  input.addEventListener('change', rerunIfReady);
  label.append(span, ' ', out, input);
  prioritiesBox.append(label);
}

precipInput.addEventListener('input', () => ($('precip-out').textContent = `${precipInput.value}%`));
tempInput.addEventListener('input', () => ($('temp-out').textContent = `+${tempInput.value}°C`.replace('+-', '−')));
for (const el of [precipInput, tempInput, templateSelect, $('irrigation'), $('slope')]) el.addEventListener('change', rerunIfReady);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  void run();
});

document.querySelectorAll<HTMLButtonElement>('.lang button').forEach((btn) =>
  btn.addEventListener('click', () => {
    lang = btn.dataset['lang'] === 'en' ? 'en' : 'es';
    document.documentElement.lang = lang;
    document.querySelectorAll<HTMLButtonElement>('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    applyStaticTexts();
    if (lastRun) render(lastRun.profile, lastRun.strategies);
  }),
);

function applyStaticTexts(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(lang, el.dataset['i18n'] ?? '');
  });
  const selected = templateSelect.value || 'soy_maize_fallow';
  templateSelect.replaceChildren(
    ...Object.values(TEMPLATES)
      .filter((tpl) => tpl.isPreset)
      .map((tpl) => new Option(t(lang, `template.${tpl.id}`), tpl.id, false, tpl.id === selected)),
  );
}

function readFarm(): FarmContext {
  const priorities = Object.fromEntries(
    DIMENSIONS.map((d) => [d, Number(($(`prio-${d}`) as HTMLInputElement).value)]),
  ) as Record<Dimension, number>;
  const irrigation = Math.max(0, Number(($('irrigation') as HTMLInputElement).value) || 0);
  const slopeValue = ($('slope') as HTMLSelectElement).value;
  const slope: FarmContext['slope'] = slopeValue === 'flat' || slopeValue === 'steep' ? slopeValue : 'gentle';
  return { irrigationMm: irrigation, slope, priorities };
}

function setStatus(text: string, isError = false): void {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  const lat = Number(latInput.value);
  const lon = Number(lonInput.value);
  const years = Math.min(30, Math.max(5, Math.round(Number(($('years') as HTMLInputElement).value) || 15)));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    setStatus(t(lang, 'status.error', { msg: 'lat/lon' }), true);
    return;
  }
  const endYear = new Date().getFullYear() - 1; // last complete year
  const startYear = endYear - years + 1;
  const key = `${lat.toFixed(4)},${lon.toFixed(4)},${startYear}-${endYear}`;

  const button = form.querySelector<HTMLButtonElement>('button[type=submit]');
  if (button) button.disabled = true;
  try {
    if (cachedSeries?.key !== key) {
      setStatus(t(lang, 'status.loading', { years }));
      cachedSeries = { key, series: await fetchClimateSeries(lat, lon, startYear, endYear) };
    }
    analyse(cachedSeries.series);
  } catch (err) {
    const message = err instanceof PowerApiError || err instanceof Error ? err.message : String(err);
    setStatus(t(lang, 'status.error', { msg: message }), true);
    console.error(err);
  } finally {
    if (button) button.disabled = false;
  }
}

function rerunIfReady(): void {
  if (cachedSeries) analyse(cachedSeries.series);
}

function analyse(series: ClimateSeries): void {
  const scenario = { precipPct: Number(precipInput.value), tempC: Number(tempInput.value) };
  const profile = buildClimateProfile(applyScenario(series, scenario));
  const strategies = compareStrategies(profile, readFarm(), { currentTemplate: templateSelect.value as TemplateId });
  lastRun = { profile, strategies };
  setStatus(
    t(lang, 'status.done', {
      days: series.days.length,
      from: profile.yearsAnalysed[0] ?? '',
      to: profile.yearsAnalysed[profile.yearsAnalysed.length - 1] ?? '',
    }),
  );
  render(profile, strategies);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function render(profile: ClimateProfile, strategies: StrategyResult[]): void {
  $('results').hidden = false;
  renderClimateCards(profile);
  renderClimateChart(profile);
  renderAnomaly(profile);
  renderStrategies(strategies, profile);
  renderRadar(strategies);
  $('global-gaps').replaceChildren(...GLOBAL_GAPS.map((g) => li(msg(lang, g))));
  $('sources').replaceChildren(...['source.power', 'source.gibs', 'source.fao'].map((k) => li(t(lang, k))));
}

function renderClimateCards(p: ClimateProfile): void {
  const fmt = (n: number, d = 0) => n.toLocaleString(lang, { maximumFractionDigits: d, minimumFractionDigits: d });
  const trendCard = (labelKey: string, tr: Trend | null, unit: string, d = 1) =>
    tr
      ? card(t(lang, labelKey), `${tr.slopePerDecade >= 0 ? '+' : ''}${fmt(tr.slopePerDecade, d)} ${unit}${t(lang, 'climate.perDecade')}`,
          t(lang, 'climate.r2', { r2: fmt(tr.r2, 2), n: tr.years }))
      : null;
  const cards = [
    card(t(lang, 'climate.precip'), `${fmt(p.annual.precipMm)} mm`),
    card(t(lang, 'climate.et0'), `${fmt(p.annual.et0Mm)} mm`),
    card(t(lang, 'climate.aridity'), fmt(p.annual.aridityIndex, 2)),
    card(t(lang, 'climate.frostFree'), p.frostFreeSeasonDays === null ? t(lang, 'climate.noFrost') : `${p.frostFreeSeasonDays} ${t(lang, 'climate.days')}`),
    card(t(lang, 'climate.heatDays'), fmt(p.annual.heatDays, 1)),
    card(t(lang, 'climate.frostDays'), fmt(p.annual.frostDays, 1)),
    trendCard('climate.trendP', p.trends.precipMm, 'mm', 0),
    trendCard('climate.trendT', p.trends.tmaxC, '°C', 2),
    trendCard('climate.trendHeat', p.trends.heatDays, t(lang, 'climate.days'), 1),
    trendCard('climate.trendSm', p.trends.rootWetness, '', 3),
  ].filter((c): c is HTMLElement => c !== null);
  $('climate-cards').replaceChildren(...cards);
}

function renderClimateChart(p: ClimateProfile): void {
  climateChart?.destroy();
  const canvas = $<HTMLCanvasElement>('climate-chart');
  climateChart = new Chart(canvas, {
    data: {
      labels: MONTHS[lang],
      datasets: [
        { type: 'bar', label: t(lang, 'chart.precip'), data: p.monthly.map((m) => round(m.precipMm)), backgroundColor: '#5b8fb9', yAxisID: 'mm' },
        { type: 'line', label: t(lang, 'chart.et0'), data: p.monthly.map((m) => round(m.et0Mm)), borderColor: '#d1495b', backgroundColor: '#d1495b', yAxisID: 'mm', tension: 0.3 },
        { type: 'line', label: t(lang, 'chart.wetness'), data: p.monthly.map((m) => (m.rootWetness === null ? null : round(m.rootWetness, 2))), borderColor: '#2f6b3a', borderDash: [4, 4], yAxisID: 'frac', tension: 0.3 },
        { type: 'line', label: t(lang, 'chart.frost'), data: p.monthly.map((m) => round(m.frostProb, 2)), borderColor: '#4a90e2', backgroundColor: 'rgba(74,144,226,0.15)', fill: true, yAxisID: 'frac', stepped: 'middle' },
      ],
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        mm: { type: 'linear', position: 'left', title: { display: true, text: 'mm' } },
        frac: { type: 'linear', position: 'right', min: 0, max: 1, grid: { drawOnChartArea: false } },
      },
    },
  });
}

function renderAnomaly(p: ClimateProfile): void {
  const year = p.recentRootWetnessAnomaly[0]?.year ?? '';
  $('anomaly-title').textContent = t(lang, 'climate.anomaly', { year });
  const cells = Array.from({ length: 12 }, (_, i) => {
    const a = p.recentRootWetnessAnomaly.find((x) => x.month === i + 1);
    const div = document.createElement('div');
    const z = a?.z ?? 0;
    div.style.background = z < 0 ? `rgba(176,138,90,${Math.min(1, -z / 2)})` : `rgba(47,107,58,${Math.min(1, z / 2)})`;
    div.title = a ? `z = ${z.toFixed(2)}` : 'n/a';
    div.textContent = `${MONTHS[lang][i]} ${a ? (z >= 0 ? '+' : '') + z.toFixed(1) : '–'}`;
    return div;
  });
  $('anomaly').replaceChildren(...cells);
}

function renderStrategies(strategies: StrategyResult[], p: ClimateProfile): void {
  let altN = 0;
  const nodes: HTMLElement[] = strategies.map((s) => {
    const el = document.createElement('article');
    el.className = `strategy${s.isCurrent ? ' current' : ''}`;

    const header = document.createElement('header');
    const titleBox = document.createElement('div');
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = s.isCurrent ? t(lang, 'strategy.current') : t(lang, 'strategy.alt', { n: ++altN });
    const h = document.createElement('h3');
    h.textContent = t(lang, `template.${s.templateId}`);
    titleBox.append(tag, h);
    const overall = document.createElement('div');
    overall.className = 'overall';
    overall.textContent = String(Math.round(s.overall));
    const small = document.createElement('small');
    small.textContent = t(lang, 'strategy.overall');
    overall.append(small);
    header.append(titleBox, overall);

    el.append(header, timeline(s, p), cropLegend(s), scores(s), explain(s));
    return el;
  });
  if (strategies.length === 1) {
    const note = document.createElement('p');
    note.className = 'disclaimer';
    note.textContent = t(lang, 'strategies.noneViable');
    nodes.push(note);
  }
  $('strategies').replaceChildren(...nodes);
}

function timeline(s: StrategyResult, p: ClimateProfile): HTMLElement {
  const wrap = document.createElement('div');
  const bar = document.createElement('div');
  bar.className = 'timeline';
  const labels = document.createElement('div');
  labels.className = 'timeline-labels';
  for (const c of s.timeline) {
    const cell = document.createElement('div');
    cell.className = `cell${c.bare ? ' bare' : ''}`;
    const base = c.crop ? CROP_COLORS[c.crop] : '#efe9df';
    // darker red overlay = more climate pressure
    cell.style.background = c.bare ? '#efe9df' : base;
    cell.style.boxShadow = `inset 0 -${Math.round(c.pressure * 34)}px 0 rgba(181,70,47,0.55)`;
    cell.title = `${MONTHS[lang][c.calendarMonth - 1]} · ${c.crop ? cropName(lang, c.crop) : t(lang, 'timeline.bare')} · ${Math.round(c.pressure * 100)}%`;
    bar.append(cell);
    const lab = document.createElement('div');
    lab.textContent = MONTHS[lang][c.calendarMonth - 1]?.charAt(0) ?? '';
    labels.append(lab);
  }
  void p;
  wrap.append(bar, labels);
  return wrap;
}

function cropLegend(s: StrategyResult): HTMLElement {
  const div = document.createElement('div');
  div.className = 'crop-legend';
  const seen = new Set<CropId>();
  for (const a of [...s.slots].sort((x, y) => x.startIndex - y.startIndex)) {
    if (seen.has(a.crop.id)) continue;
    seen.add(a.crop.id);
    const span = document.createElement('span');
    span.style.setProperty('--c', CROP_COLORS[a.crop.id]);
    span.textContent = cropName(lang, a.crop.id);
    div.append(span);
  }
  return div;
}

function scores(s: StrategyResult): HTMLElement {
  const box = document.createElement('div');
  box.className = 'scores';
  for (const d of DIMENSIONS) {
    const row = document.createElement('div');
    row.className = 'score';
    const name = document.createElement('span');
    name.textContent = t(lang, `dim.${d}`);
    const val = document.createElement('strong');
    val.textContent = String(s.scores[d]);
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('i');
    fill.style.width = `${s.scores[d]}%`;
    bar.append(fill);
    row.append(name, val, bar);
    box.append(row);
  }
  return box;
}

function explain(s: StrategyResult): HTMLElement {
  const box = document.createElement('div');
  box.className = 'explain';
  const section = (titleKey: string, items: string[], cls = '') => {
    const div = document.createElement('div');
    if (cls) div.className = cls;
    const h = document.createElement('h4');
    h.textContent = t(lang, titleKey);
    const ul = document.createElement('ul');
    ul.append(...(items.length ? items : [t(lang, 'strategy.none')]).map(li));
    div.append(h, ul);
    return div;
  };
  if (!s.suitable) box.append(section('strategy.unsuitable', s.unsuitable.map((m) => msg(lang, m)), 'risks'));
  const schedule = [...s.slots]
    .sort((a, b) => a.startIndex - b.startIndex)
    .map((a) =>
      t(lang, 'schedule.item', {
        crop: a.crop.id,
        sow: monthName(a.months[0]),
        end: monthName(a.months[a.months.length - 1]),
        months: a.months.length,
      }),
    );
  box.append(
    section('strategy.why', s.rationale.map((m) => msg(lang, m))),
    section('strategy.schedule', schedule),
    section('strategy.evidence', s.evidence.map((m) => msg(lang, m))),
  );
  if (!s.isCurrent) {
    box.append(
      section('strategy.benefits', s.benefits.map((m) => msg(lang, m))),
      section('strategy.tradeoffs', s.tradeoffs.map((m) => msg(lang, m))),
    );
  }
  box.append(section('strategy.risks', s.risks.map((m) => msg(lang, m)), 'risks'), section('strategy.gaps', s.gaps.map((m) => msg(lang, m))));
  return box;
}

function monthName(index: number | undefined): string {
  if (index === undefined || !lastRun) return '';
  const cell = lastRun.strategies[0]?.timeline[index];
  return cell ? (MONTHS[lang][cell.calendarMonth - 1] ?? '') : '';
}

function renderRadar(strategies: StrategyResult[]): void {
  radarChart?.destroy();
  const palette = ['#5e6b63', '#2f6b3a', '#d68c45', '#5b8fb9', '#8e5ea2'];
  radarChart = new Chart($<HTMLCanvasElement>('radar-chart'), {
    type: 'radar',
    data: {
      labels: DIMENSIONS.map((d) => t(lang, `dim.${d}`)),
      datasets: strategies.map((s, i) => ({
        label: t(lang, `template.${s.templateId}`),
        data: DIMENSIONS.map((d) => s.scores[d]),
        borderColor: palette[i % palette.length],
        backgroundColor: 'transparent',
        borderDash: s.isCurrent ? [5, 5] : [],
        pointRadius: 2,
      })),
    },
    options: { maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { stepSize: 25 } } } },
  });
}

// ---------------------------------------------------------------------------
// tiny DOM helpers
// ---------------------------------------------------------------------------

function card(label: string, value: string, sub?: string): HTMLElement {
  const div = document.createElement('div');
  div.className = 'card';
  const l = document.createElement('div');
  l.className = 'label';
  l.textContent = label;
  const v = document.createElement('div');
  v.className = 'value';
  v.textContent = value;
  div.append(l, v);
  if (sub) {
    const s = document.createElement('div');
    s.className = 'sub';
    s.textContent = sub;
    div.append(s);
  }
  return div;
}

function li(text: string): HTMLLIElement {
  const el = document.createElement('li');
  el.textContent = text;
  return el;
}

function round(n: number, d = 0): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

applyStaticTexts();
