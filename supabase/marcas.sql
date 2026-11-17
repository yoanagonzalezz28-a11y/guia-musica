-- Banco de música: tabla de marcas para las cuentas con Google.
-- Se corre en el editor SQL de Supabase (SQL Editor → New query → pegar → Run). Se puede correr más de una vez.
-- Una fila por persona, con todas sus marcas en el mismo formato que el botón "Exportar".
-- El proyecto no expone tablas nuevas automáticamente: los permisos van explícitos, y cada persona
-- solo puede leer y escribir su propia fila (RLS). Los visitantes sin sesión (anon) no tienen acceso.

create table if not exists public.marcas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  datos jsonb not null,
  actualizado timestamptz not null default now(),
  -- Tope de unos 2 MB por persona (miles de marcas con notas entran de sobra).
  constraint marcas_tamano check (pg_column_size(datos) < 2000000),
  constraint marcas_formato check (jsonb_typeof(datos) = 'object' and datos ? 'version' and datos ? 'marcas')
);

comment on table public.marcas is 'Marcas personales del Banco de música (escuchado, puntaje, notas, épocas estudiadas). Una fila por cuenta.';

-- Reglas por fila: activadas siempre, aunque el proyecto ya las active solo.
alter table public.marcas enable row level security;

-- Permisos explícitos (el proyecto no expone tablas nuevas automáticamente):
-- nada para anónimos; para quien tiene sesión, usar el esquema y las cuatro operaciones sobre la tabla.
grant usage on schema public to authenticated;
revoke all on table public.marcas from anon, authenticated, public;
grant select, insert, update, delete on table public.marcas to authenticated;

-- Cada persona ve y cambia solo su fila. "(select auth.uid())" se evalúa una vez por consulta.
drop policy if exists "leer mis marcas" on public.marcas;
drop policy if exists "crear mis marcas" on public.marcas;
drop policy if exists "cambiar mis marcas" on public.marcas;
drop policy if exists "borrar mis marcas" on public.marcas;

create policy "leer mis marcas" on public.marcas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "crear mis marcas" on public.marcas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "cambiar mis marcas" on public.marcas
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "borrar mis marcas" on public.marcas
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Fecha del último cambio, puesta por la base (no por el navegador).
create or replace function public.marcas_actualizado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado := now();
  return new;
end;
$$;

drop trigger if exists marcas_actualizado on public.marcas;
create trigger marcas_actualizado
  before insert or update on public.marcas
  for each row execute function public.marcas_actualizado();

-- Que la API de datos vea la tabla nueva enseguida.
notify pgrst, 'reload schema';
