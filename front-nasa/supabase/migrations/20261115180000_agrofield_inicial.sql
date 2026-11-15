-- Esquema inicial de AgroField para Supabase/Postgres.
--
-- Adaptado del esquema de AgroCordS (mismas convenciones):
--   * cada fila lleva user_id → auth.users, aunque se pueda deducir por join,
--     para que las políticas de RLS filtren directo y simple;
--   * geometrías en GeoJSON (jsonb), sin PostGIS: ninguna consulta espacial todavía;
--   * snapshots inmutables (resultado de un análisis, plan de un pedido) en jsonb;
--   * fechas civiles como date, instantes reales como timestamptz.
--
-- Hoy la app guarda todo en localStorage. Con este esquema + el backend de
-- api/v1 cada usuario (ingreso por link al mail, Supabase Auth) ve lo suyo
-- desde cualquier dispositivo, y queda el historial de lo que hizo.
--
-- Aplicar: `supabase link && supabase db push`, o pegar este archivo entero en
-- el SQL Editor del proyecto. Es idempotente.

create extension if not exists pgcrypto;

create or replace function public.tocar_actualizado_en() returns trigger
language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end $$;

-- ── Perfiles ────────────────────────────────────────────────────────────────
-- Espejo de Profile (src/profile/profile.ts) sin el dron: los drones van en su tabla.
create table if not exists public.perfiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) between 1 and 120),
  establecimiento text not null default '' check (length(establecimiento) <= 160),
  idioma text not null default 'en' check (idioma in ('es', 'en')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
comment on table public.perfiles is 'Nombre y establecimiento del usuario. Espejo de Profile en src/profile/profile.ts.';

-- ── Drones propios ──────────────────────────────────────────────────────────
-- Espejo de OwnDrone. Un usuario puede cargar varios; "activo" marca el que usa
-- la app para planificar. Sin dron activo, los trabajos van a Vuelo Verde.
create table if not exists public.drones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  modelo text not null check (length(trim(modelo)) between 1 and 120),
  camara_mapeo text not null check (camara_mapeo in ('none', 'rgb', 'multispectral')),
  bateria_min numeric not null default 0 check (bateria_min >= 0 and bateria_min <= 120),
  pulveriza jsonb,   -- {tankL, swathM, speedKmh} o null
  siembra jsonb,     -- {hopperKg, swathM, speedKmh} o null
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
comment on column public.drones.pulveriza is 'null = no pulveriza. {tankL, swathM, speedKmh}: valores del equipo, editables.';
create index if not exists drones_user_id_idx on public.drones (user_id);
-- A lo sumo un dron activo por usuario.
create unique index if not exists drones_un_activo_por_usuario on public.drones (user_id) where activo;

-- ── Lotes ───────────────────────────────────────────────────────────────────
-- Como en AgroCordS, más lo que AgroField lee del lote: origen del límite,
-- relieve (SRTM o DSM de dron) y agua útil del suelo (SoilGrids o análisis).
create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) between 1 and 120),
  geometry jsonb not null,
  centroid_lat double precision not null check (centroid_lat between -90 and 90),
  centroid_lng double precision not null check (centroid_lng between -180 and 180),
  area_ha numeric not null check (area_ha > 0),
  origen text not null default 'dibujo' check (origen in ('dibujo', 'kml', 'shp', 'geojson', 'dxf', 'ejemplo')),
  pendiente_pct numeric,
  fuente_pendiente text check (fuente_pendiente in ('srtm', 'dsm', 'declarada')),
  agua_util_mm numeric,
  fuente_suelo text check (fuente_suelo in ('soilgrids', 'analisis', 'supuesto')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
comment on column public.lotes.geometry is 'GeoJSON Polygon (lon, lat) tal cual sale de Leaflet + Geoman o del archivo importado.';
create index if not exists lotes_user_id_idx on public.lotes (user_id);

-- ── Análisis (cada vez que el usuario ve "Tus opciones") ────────────────────
-- Snapshot inmutable: qué cargó (campaña, riego, prioridades) y qué le mostró la
-- app (rotación actual, mejor alternativa, puntajes). No se recalcula nunca.
create table if not exists public.analisis (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid references public.lotes (id) on delete cascade, -- null = solo un punto
  user_id uuid not null references auth.users (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  entrada jsonb not null,   -- rotación actual, riego, prioridades, años
  resultado jsonb not null, -- ids y puntajes de hoy y alternativas, fuente del clima
  creado_en timestamptz not null default now()
);
create index if not exists analisis_user_id_idx on public.analisis (user_id, creado_en desc);
create index if not exists analisis_lote_id_idx on public.analisis (lote_id);

-- ── Pedidos y planes de trabajo con dron ────────────────────────────────────
-- Lo que sale de "Trabajos con dron": hecho con el dron propio (plan) o pedido
-- a Vuelo Verde. El estado lo actualiza el usuario a medida que avanza.
create table if not exists public.pedidos_dron (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lote_id uuid references public.lotes (id) on delete set null,
  dron_id uuid references public.drones (id) on delete set null,
  trabajo text not null check (trabajo in ('map', 'vra', 'seed', 'spray', 'survey')),
  ejecutor text not null check (ejecutor in ('propio', 'vuelo_verde')),
  canal text not null check (canal in ('whatsapp', 'email', 'compartir', 'copiado')),
  estado text not null default 'enviado' check (estado in ('enviado', 'aceptado', 'hecho', 'cancelado')),
  plan jsonb not null default '{}',  -- números del plan (ha, litros, cargas, horas…)
  texto text not null check (length(texto) <= 8000), -- el mensaje tal cual se envió
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists pedidos_dron_user_id_idx on public.pedidos_dron (user_id, creado_en desc);

-- ── Historial ───────────────────────────────────────────────────────────────
-- Una línea por cosa que hizo el usuario. La escribe solo el backend (service
-- role); el cliente la lee. Solo agrega: no se edita ni se borra desde la app.
create table if not exists public.actividad (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  lote_id uuid references public.lotes (id) on delete set null,
  tipo text not null check (tipo in (
    'perfil.guardado', 'dron.creado', 'dron.actualizado', 'dron.borrado',
    'lote.creado', 'lote.actualizado', 'lote.borrado',
    'analisis.creado', 'pedido.creado', 'pedido.estado'
  )),
  detalle jsonb not null default '{}',
  creado_en timestamptz not null default now()
);
create index if not exists actividad_user_id_idx on public.actividad (user_id, creado_en desc);

-- ── updated_at ──────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['perfiles', 'drones', 'lotes', 'pedidos_dron'] loop
    if not exists (select 1 from pg_trigger where tgname = t || '_tocar_actualizado_en') then
      execute format('create trigger %I before update on public.%I for each row execute function public.tocar_actualizado_en()', t || '_tocar_actualizado_en', t);
    end if;
  end loop;
end $$;

-- ── Row Level Security ──────────────────────────────────────────────────────
-- El backend usa la service role y además filtra por user_id en cada consulta;
-- RLS queda como respaldo por si algo habla directo con Supabase (mismo criterio
-- que AgroCordS).
alter table public.perfiles enable row level security;
alter table public.drones enable row level security;
alter table public.lotes enable row level security;
alter table public.analisis enable row level security;
alter table public.pedidos_dron enable row level security;
alter table public.actividad enable row level security;

do $$
declare
  t text;
begin
  -- Dueño: ver, crear, actualizar y borrar lo suyo.
  foreach t in array array['perfiles', 'drones', 'lotes', 'pedidos_dron'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || ': el dueño ve lo suyo') then
      execute format('create policy %I on public.%I for select using (auth.uid() = user_id)', t || ': el dueño ve lo suyo', t);
      execute format('create policy %I on public.%I for insert with check (auth.uid() = user_id)', t || ': el dueño crea lo suyo', t);
      execute format('create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t || ': el dueño actualiza lo suyo', t);
      execute format('create policy %I on public.%I for delete using (auth.uid() = user_id)', t || ': el dueño borra lo suyo', t);
    end if;
  end loop;
  -- Análisis: snapshot inmutable (ver, crear, borrar; nunca actualizar).
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analisis' and policyname = 'analisis: el dueño ve lo suyo') then
    create policy "analisis: el dueño ve lo suyo" on public.analisis for select using (auth.uid() = user_id);
    create policy "analisis: el dueño crea lo suyo" on public.analisis for insert with check (auth.uid() = user_id);
    create policy "analisis: el dueño borra lo suyo" on public.analisis for delete using (auth.uid() = user_id);
  end if;
  -- Historial: solo lectura para el cliente.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'actividad' and policyname = 'actividad: el dueño ve lo suyo') then
    create policy "actividad: el dueño ve lo suyo" on public.actividad for select using (auth.uid() = user_id);
  end if;
end $$;
