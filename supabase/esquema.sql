-- =====================================================================
-- LUZZZEN CARDS · Base de datos
-- Pegar TODO en Supabase → SQL Editor → New query → Run.
-- Se puede correr más de una vez sin romper nada.
--
-- ⚠️ ANTES DE CORRER: cambiá el mail de la última sección (ADMIN)
--    por el mail con el que vas a entrar al panel.
-- =====================================================================


-- ===== Admins =====
-- Solo los mails de esta tabla pueden editar. Aunque alguien se cree un
-- usuario, si su mail no está acá no puede tocar nada.
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;

create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;


-- ===== Productos =====
-- El ID (LZ-000222, LZ-000223…) se asigna solo. Arranca en 222 porque
-- el último producto del sitio viejo es el LZ-000221.
create sequence if not exists public.productos_num start 222;

create table if not exists public.productos (
  id              text primary key default ('LZ-' || lpad(nextval('public.productos_num')::text, 6, '0')),
  categoria       text not null default 'cartas'
                  check (categoria in ('cartas', 'firmas-jerseys', 'accesorios')),
  nombre          text,            -- para accesorios, firmas y jerseys (en cartas se usa el jugador)
  jugador         text,
  equipo          text,
  seleccion       text,            -- selección / país
  coleccion       text,
  anio            text,            -- texto: "2014-2015" o "2013"
  precio          integer not null check (precio >= 0),
  precio_anterior integer check (precio_anterior is null or precio_anterior >= 0),  -- si es mayor al precio, está en oferta
  vendido         boolean not null default false,
  vendido_en      timestamptz,
  visible         boolean not null default true,
  foto_frente     text,
  foto_dorso      text,
  creado          timestamptz not null default now()
);

create index if not exists productos_creado_idx on public.productos (creado desc);

-- Al marcar vendido guarda la fecha (sirve para saber cuándo sacarlo)
create or replace function public.productos_vendido_en()
returns trigger language plpgsql as $$
begin
  if new.vendido and (tg_op = 'INSERT' or not old.vendido) then
    new.vendido_en := coalesce(new.vendido_en, now());
  elsif not new.vendido then
    new.vendido_en := null;
  end if;
  return new;
end $$;

drop trigger if exists productos_vendido_en on public.productos;
create trigger productos_vendido_en before insert or update on public.productos
  for each row execute function public.productos_vendido_en();

alter table public.productos enable row level security;

drop policy if exists "productos: publico ve los visibles" on public.productos;
create policy "productos: publico ve los visibles" on public.productos
  for select to anon, authenticated using (visible or public.es_admin());

drop policy if exists "productos: admin crea" on public.productos;
create policy "productos: admin crea" on public.productos
  for insert to authenticated with check (public.es_admin());

drop policy if exists "productos: admin edita" on public.productos;
create policy "productos: admin edita" on public.productos
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "productos: admin borra" on public.productos;
create policy "productos: admin borra" on public.productos
  for delete to authenticated using (public.es_admin());


-- ===== Códigos de descuento =====
-- Nadie de afuera puede leer esta tabla: la tienda solo puede preguntar
-- si un código puntual vale, con validar_codigo().
create table if not exists public.codigos (
  codigo  text primary key check (codigo = upper(codigo) and codigo <> ''),
  tipo    text not null default 'porcentaje' check (tipo in ('porcentaje', 'monto')),
  valor   integer not null check (valor > 0),
  activo  boolean not null default true,
  vence   timestamptz,
  minimo  integer check (minimo is null or minimo > 0),
  creado  timestamptz not null default now(),
  check (tipo <> 'porcentaje' or valor <= 100)
);
alter table public.codigos enable row level security;

drop policy if exists "codigos: solo admin" on public.codigos;
create policy "codigos: solo admin" on public.codigos
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

create or replace function public.validar_codigo(p_codigo text)
returns table (codigo text, tipo text, valor integer, minimo integer)
language sql stable security definer set search_path = public
as $$
  select c.codigo, c.tipo, c.valor, c.minimo
  from public.codigos c
  where c.codigo = upper(regexp_replace(coalesce(p_codigo, ''), '\s', '', 'g'))
    and c.activo
    and (c.vence is null or c.vence > now())
  limit 1;
$$;


-- ===== Permisos de la API =====
-- (Desmarcaste "Automatically expose new tables", así que se dan a mano.)
revoke all on public.admins, public.productos, public.codigos from anon, authenticated;

grant select on public.productos to anon, authenticated;
grant insert, update, delete on public.productos to authenticated;
grant usage, select on sequence public.productos_num to authenticated;
grant select, insert, update, delete on public.codigos to authenticated;

revoke all on function public.validar_codigo(text) from public;
grant execute on function public.validar_codigo(text) to anon, authenticated;
revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;


-- ===== Fotos (Storage) =====
-- Bucket público: cualquiera puede VER las fotos, solo el admin sube/borra.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png'];

-- (Borrar o reemplazar una foto también necesita poder "verla" por la API)
drop policy if exists "fotos: admin lista" on storage.objects;
create policy "fotos: admin lista" on storage.objects
  for select to authenticated using (bucket_id = 'fotos' and public.es_admin());

drop policy if exists "fotos: admin sube" on storage.objects;
create policy "fotos: admin sube" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos' and public.es_admin());

drop policy if exists "fotos: admin edita" on storage.objects;
create policy "fotos: admin edita" on storage.objects
  for update to authenticated using (bucket_id = 'fotos' and public.es_admin());

drop policy if exists "fotos: admin borra" on storage.objects;
create policy "fotos: admin borra" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos' and public.es_admin());


-- ===== ADMIN =====
-- ⚠️ Cambiá este mail por el tuyo (el mismo que vas a usar para entrar).
insert into public.admins (email) values ('TU-MAIL@gmail.com')
on conflict do nothing;
