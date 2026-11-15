import { CROPS, type CropId } from '../engine/domain/crops';
import type { Msg } from '../engine/domain/rotations';

export type Lang = 'es' | 'en';

type Dict = Record<string, string>;

const es: Dict = {
  'slope.flat': 'Plano (<1%)',
  'slope.gentle': 'Suave (1–4%)',
  'slope.steep': 'Fuerte (>4%)',
  'dim.waterSecurity': 'Seguridad hídrica',
  'dim.waterUse': 'Menor demanda de agua',
  'dim.climateRisk': 'Riesgo climático bajo',
  'dim.soil': 'Aporte al suelo',
  'dim.erosion': 'Protección contra erosión',
  'dim.pests': 'Corte de plagas/enfermedades',
  'dim.income': 'Mercado (índice genérico)',
  'chart.frost': 'Años con helada en el mes (0–1)',
  'strategy.current': 'Manejo de referencia',
  'strategy.alt': 'Alternativa para explorar {n}',
  'strategy.evidence': 'Evidencia (NASA POWER + supuestos)',
  'strategy.benefits': 'Beneficios potenciales vs. la referencia',
  'strategy.tradeoffs': 'Lo que se resigna',
  'timeline.bare': 'Sin cultivo programado',
  'gaps.title': 'Limitaciones generales del análisis',
  'sources.title': 'Datos usados',

  'template.soy_maize_fallow': 'Soja → Maíz (barbecho invernal)',
  'template.soy_mono': 'Soja continua',
  'template.maize_wheat_soy2': 'Maíz → Trigo / Soja de 2ª',
  'template.cotton_maize': 'Algodón → Maíz',
  'template.wheat_soy2_cont': 'Trigo / Soja de 2ª continuo',
  'template.drought_sorghum_chickpea': 'Sorgo → Garbanzo → Soja (adaptada a sequía)',
  'template.diversified_sunflower_vetch': 'Girasol → Vicia → Maíz (diversificada)',
  'template.cotton_wheat_soy2': 'Algodón → Trigo / Soja de 2ª',
  'template.pasture_alfalfa': 'Fase de pastura: alfalfa 2 años',
  'template.sorghum_soy': 'Sorgo → Soja',
  'template.current_plus_covers': 'Tu rotación + cultivos de servicio',

  'rationale.soy_maize_fallow': 'Rotación de referencia: dos cultivos de verano con el lote vacío en invierno.',
  'rationale.soy_mono': 'Rotación de referencia: el mismo cultivo cada año.',
  'rationale.maize_wheat_soy2': 'Intensifica: tres cosechas en dos años y más rastrojo de gramíneas.',
  'rationale.cotton_maize': 'Rotación de referencia de zonas algodoneras.',
  'rationale.wheat_soy2_cont': 'Doble cultivo anual: máximo uso del lote, alta demanda de agua.',
  'rationale.drought_sorghum_chickpea': 'Reemplaza el maíz por sorgo (más tolerante a calor y sequía, raíz profunda) y suma garbanzo invernal (leguminosa de bajo consumo de agua).',
  'rationale.diversified_sunflower_vetch': 'Suma girasol (raíz profunda, otra familia) y vicia invernal que fija nitrógeno antes del maíz.',
  'rationale.cotton_wheat_soy2': 'Algodón con trigo/soja de 2ª: tres familias distintas y cobertura invernal.',
  'rationale.pasture_alfalfa': 'Dos años de alfalfa: recupera materia orgánica, estructura y nitrógeno; requiere destino ganadero o venta de heno.',
  'rationale.sorghum_soy': 'Cambio mínimo: sorgo en lugar de maíz, más rastrojo y tolerancia al calor.',
  'rationale.current_plus_covers': 'Cambio mínimo: mantiene tus cultivos y cubre los barbechos largos.',
  'rationale.coversAdded': 'Se agregan cultivos de servicio en los barbechos: {crops}.',

  'evidence.water': '{crop}: demanda estimada ≈ {demand} mm vs. oferta aproximada ≈ {supply} mm (75 % de la lluvia + reserva supuesta + riego) → déficit {deficit}%.',
  'evidence.frost': '{crop}: en el mes más expuesto de su ciclo hubo helada en {prob}% de los años (máximo mensual ponderado).',
  'evidence.heat': '{crop}: ≈ {days} días ≥35 °C por ciclo en promedio.',
  'evidence.bare': '{months} meses sin cultivo programado en 2 años; en esos meses llueven ≈ {rain} mm en promedio. No indica si hay rastrojo.',

  'benefit.waterSecurity': 'Mejor abastecimiento de agua (+{delta} pts).',
  'benefit.waterUse': 'Menor demanda de agua estimada (+{delta} pts).',
  'benefit.climateRisk': 'Menor exposición a helada/calor/sequía (+{delta} pts).',
  'benefit.soil': 'Mayor aporte potencial al suelo: N, rastrojo, raíces, diversidad (+{delta} pts).',
  'benefit.erosion': 'Mejor protección contra erosión (+{delta} pts).',
  'benefit.pests': 'Corta mejor ciclos de plagas y enfermedades (+{delta} pts).',
  'benefit.income': 'Índice de mercado genérico más alto (+{delta} pts).',
  'benefit.bareMonths': '{months} meses menos sin cultivo programado.',
  'tradeoff.waterSecurity': 'Menos agua disponible por cultivo (−{delta} pts).',
  'tradeoff.waterUse': 'Mayor demanda de agua estimada (−{delta} pts).',
  'tradeoff.climateRisk': 'Más exposición climática (−{delta} pts).',
  'tradeoff.soil': 'Menor aporte potencial al suelo (−{delta} pts).',
  'tradeoff.erosion': 'Menor protección contra erosión (−{delta} pts).',
  'tradeoff.pests': 'Menor corte de plagas (−{delta} pts).',
  'tradeoff.income': 'Índice de mercado genérico más bajo (−{delta} pts).',

  'risk.deficit': '{crop}: déficit hídrico esperado de {deficit}% en secano; revisar fecha de siembra o densidad.',
  'risk.deficitIrrigated': '{crop}: aun con riego, déficit esperado de {deficit}%.',
  'risk.frost': '{crop}: el mes más expuesto del ciclo tuvo helada en {prob}% de los años; revisar fecha de siembra.',
  'risk.heat': '{crop}: golpes de calor frecuentes durante el ciclo (riesgo en floración).',
  'risk.coverWater': '{crop}: puede consumir agua que necesita el cultivo siguiente; terminar temprano en años secos.',
  'risk.alfalfaMarket': 'La alfalfa necesita destino (hacienda propia o venta de rollos) y una inversión de implantación.',
  'risk.doubleCropTiming': 'La soja de 2ª depende de cosechar el trigo a tiempo; atrasos reducen rinde.',
  'risk.chickpea': 'El garbanzo es sensible a enfermedades en inviernos húmedos y tiene mercado más volátil.',
  'risk.aridCovers': 'Clima semiárido: los cultivos de servicio deben terminarse temprano para no secar el perfil.',

  'gap.coverTermination': 'La fecha óptima de secado del cultivo de servicio depende del perfil de agua de cada año.',
  'gap.livestock': 'No se modela la producción de carne/leche ni el valor del heno.',
  'gap.marketGeneric': 'El índice de mercado es genérico por cultivo; no hay precios ni costos locales.',
  'gap.resolution': 'NASA POWER tiene resolución de ~50 km: describe la zona, no tu lote. Validar con estaciones locales.',
  'gap.et0Method': 'ET₀ por Hargreaves (solo temperaturas): sobreestima en climas húmedos y subestima con viento.',
  'gap.soilData': 'No se usa todavía un mapa de suelos (SSURGO, INTA): textura y agua útil son supuestos genéricos.',
  'gap.cropParams': 'Los parámetros de cultivos (Kc, tolerancias, fechas) son de referencia y deben ajustarse por zona y variedad.',

  'unsuitable.frost': '{crop}: el mes más expuesto del ciclo tuvo helada en {prob}% de los años, aun con la mejor fecha (umbral de la regla: 50 %).',
  'unsuitable.water': '{crop}: déficit hídrico aproximado de {deficit}% en secano (umbral de la regla: 75 %).',
  'strategy.unsuitable': 'Supera un límite de las reglas',
  'strategy.schedule': 'Fechas elegidas por el motor',
  'schedule.item': '{crop}: siembra {sow} → cosecha/secado {end} ({months} meses)',
  'source.power': 'NASA POWER (MERRA-2): temperatura, lluvia corregida y humedad de suelo diarias.',
  'source.gibs': 'NASA HLS (Sentinel-2 y Landsat armonizados, 30 m) vía GIBS y catálogo CMR, más MODIS NDVI y SMAP L4 como contexto regional. Son imágenes: no entran al cálculo.',
  'source.fao': 'FAO-56: ecuación de Hargreaves para ET₀ y coeficientes de cultivo de referencia.',
};

const en: Dict = {
  'slope.flat': 'Flat (<1%)',
  'slope.gentle': 'Gentle (1–4%)',
  'slope.steep': 'Steep (>4%)',
  'dim.waterSecurity': 'Water security',
  'dim.waterUse': 'Lower water demand',
  'dim.climateRisk': 'Low climate risk',
  'dim.soil': 'Soil contribution',
  'dim.erosion': 'Erosion protection',
  'dim.pests': 'Pest/disease break',
  'dim.income': 'Market (generic index)',
  'chart.frost': 'Years with frost in month (0–1)',
  'strategy.current': 'Reference management',
  'strategy.alt': 'Alternative to explore {n}',
  'strategy.evidence': 'Evidence (NASA POWER + assumptions)',
  'strategy.benefits': 'Potential benefits vs. reference',
  'strategy.tradeoffs': 'Trade-offs',
  'timeline.bare': 'No crop scheduled',
  'gaps.title': 'General limitations',
  'sources.title': 'Data used',

  'template.soy_maize_fallow': 'Soybean → Maize (winter fallow)',
  'template.soy_mono': 'Continuous soybean',
  'template.maize_wheat_soy2': 'Maize → Wheat / double-crop soybean',
  'template.cotton_maize': 'Cotton → Maize',
  'template.wheat_soy2_cont': 'Continuous wheat / double-crop soybean',
  'template.drought_sorghum_chickpea': 'Sorghum → Chickpea → Soybean (drought-adapted)',
  'template.diversified_sunflower_vetch': 'Sunflower → Vetch → Maize (diversified)',
  'template.cotton_wheat_soy2': 'Cotton → Wheat / double-crop soybean',
  'template.pasture_alfalfa': 'Pasture phase: 2-year alfalfa',
  'template.sorghum_soy': 'Sorghum → Soybean',
  'template.current_plus_covers': 'Your rotation + cover crops',

  'rationale.soy_maize_fallow': 'Baseline: two summer crops, field empty in winter.',
  'rationale.soy_mono': 'Baseline: the same crop every year.',
  'rationale.maize_wheat_soy2': 'Intensifies: three harvests in two years and more grass residue.',
  'rationale.cotton_maize': 'Baseline rotation of cotton regions.',
  'rationale.wheat_soy2_cont': 'Yearly double crop: maximum field use, high water demand.',
  'rationale.drought_sorghum_chickpea': 'Swaps maize for sorghum (more heat/drought tolerant, deep roots) and adds winter chickpea (low-water legume).',
  'rationale.diversified_sunflower_vetch': 'Adds sunflower (deep roots, new family) and a winter vetch that fixes nitrogen before maize.',
  'rationale.cotton_wheat_soy2': 'Cotton with wheat/double-crop soybean: three families and winter cover.',
  'rationale.pasture_alfalfa': 'Two years of alfalfa rebuild organic matter, structure and nitrogen; needs livestock or hay sales.',
  'rationale.sorghum_soy': 'Minimal change: sorghum instead of maize, more residue and heat tolerance.',
  'rationale.current_plus_covers': 'Minimal change: keeps your crops and covers long fallows.',
  'rationale.coversAdded': 'Cover crops added in fallow windows: {crops}.',

  'evidence.water': '{crop}: estimated demand ≈ {demand} mm vs. approximate supply ≈ {supply} mm (75% of rain + assumed soil reserve + irrigation) → {deficit}% deficit.',
  'evidence.frost': '{crop}: the most exposed month of its cycle had frost in {prob}% of years (weighted monthly maximum).',
  'evidence.heat': '{crop}: ≈ {days} days ≥35 °C per cycle on average.',
  'evidence.bare': '{months} months with no crop scheduled over 2 years; ≈ {rain} mm of rain fall in those months on average. Says nothing about residue.',

  'benefit.waterSecurity': 'Better water supply for crops (+{delta} pts).',
  'benefit.waterUse': 'Lower estimated water demand (+{delta} pts).',
  'benefit.climateRisk': 'Lower frost/heat/drought exposure (+{delta} pts).',
  'benefit.soil': 'Higher potential soil contribution: N, residue, roots, diversity (+{delta} pts).',
  'benefit.erosion': 'Better erosion protection (+{delta} pts).',
  'benefit.pests': 'Better pest and disease cycle break (+{delta} pts).',
  'benefit.income': 'Higher generic market index (+{delta} pts).',
  'benefit.bareMonths': '{months} fewer months with no crop scheduled.',
  'tradeoff.waterSecurity': 'Less water available per crop (−{delta} pts).',
  'tradeoff.waterUse': 'Higher estimated water demand (−{delta} pts).',
  'tradeoff.climateRisk': 'More climate exposure (−{delta} pts).',
  'tradeoff.soil': 'Lower potential soil contribution (−{delta} pts).',
  'tradeoff.erosion': 'Less erosion protection (−{delta} pts).',
  'tradeoff.pests': 'Weaker pest break (−{delta} pts).',
  'tradeoff.income': 'Lower generic market index (−{delta} pts).',

  'risk.deficit': '{crop}: expected {deficit}% water deficit under rainfed conditions; review sowing date or density.',
  'risk.deficitIrrigated': '{crop}: even with irrigation, expected {deficit}% deficit.',
  'risk.frost': '{crop}: the most exposed month of its cycle had frost in {prob}% of years; review sowing date.',
  'risk.heat': '{crop}: frequent heat waves during the cycle (risk at flowering).',
  'risk.coverWater': '{crop}: may use water the next crop needs; terminate early in dry years.',
  'risk.alfalfaMarket': 'Alfalfa needs an outlet (own livestock or hay sales) and an establishment investment.',
  'risk.doubleCropTiming': 'Double-crop soybean depends on a timely wheat harvest; delays cut yield.',
  'risk.chickpea': 'Chickpea is disease-prone in wet winters and has a more volatile market.',
  'risk.aridCovers': 'Semi-arid climate: cover crops must be terminated early to avoid drying the profile.',

  'gap.coverTermination': 'The best cover-crop termination date depends on each year’s soil water.',
  'gap.livestock': 'Meat/milk production and hay value are not modelled.',
  'gap.marketGeneric': 'The market index is generic per crop; no local prices or costs.',
  'gap.resolution': 'NASA POWER has ~50 km resolution: it describes the area, not your field. Validate with local stations.',
  'gap.et0Method': 'ET₀ via Hargreaves (temperature only): overestimates in humid climates, underestimates with wind.',
  'gap.soilData': 'No soil map yet (SSURGO, national surveys): texture and available water are generic assumptions.',
  'gap.cropParams': 'Crop parameters (Kc, tolerances, dates) are reference values and must be tuned by region and variety.',

  'unsuitable.frost': '{crop}: the most exposed month of its cycle had frost in {prob}% of years, even at the best date (rule threshold: 50%).',
  'unsuitable.water': '{crop}: approximate {deficit}% rainfed water deficit (rule threshold: 75%).',
  'strategy.unsuitable': 'Exceeds a rule limit',
  'strategy.schedule': 'Dates chosen by the engine',
  'schedule.item': '{crop}: sow {sow} → harvest/terminate {end} ({months} months)',
  'source.power': 'NASA POWER (MERRA-2): daily temperature, corrected rainfall and soil wetness.',
  'source.gibs': 'NASA HLS (harmonised Sentinel-2 and Landsat, 30 m) via GIBS and the CMR catalogue, plus MODIS NDVI and SMAP L4 as regional context. Imagery only: not used in calculations.',
  'source.fao': 'FAO-56: Hargreaves equation for ET₀ and reference crop coefficients.',
};

const DICTS: Record<Lang, Dict> = { es, en };

/** Registers additional (UI) strings so a single `t` serves engine and interface text. */
export function extendDict(lang: Lang, extra: Dict): void {
  Object.assign(DICTS[lang], extra);
}

export const MONTHS: Record<Lang, string[]> = {
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

export function t(lang: Lang, key: string, params: Record<string, string | number> = {}): string {
  const template = DICTS[lang][key] ?? DICTS.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = params[k];
    if (v === undefined) return `{${k}}`;
    if (k === 'crop') return cropName(lang, String(v));
    if (k === 'crops') return String(v).split(',').map((id) => cropName(lang, id)).join(', ');
    return String(v);
  });
}

export function msg(lang: Lang, m: Msg): string {
  return t(lang, m.key, m.params ?? {});
}

export function cropName(lang: Lang, id: string): string {
  const crop = (CROPS as Record<string, (typeof CROPS)[CropId] | undefined>)[id];
  return crop ? crop.name[lang] : id;
}
