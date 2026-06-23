-- ============================================================
-- A DEDO — Script de setup para Supabase SQL Editor
-- Ejecutar completo de una sola vez
-- ============================================================

-- 1. TABLA: profiles (espejo de auth.users)
-- Este proyecto de Supabase ya tenía una tabla profiles de una versión anterior
-- de la app (con usuarios reales registrados) -- NO se borra, solo se le agrega
-- la columna que falta.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  avatar_url  text,
  phone       text,
  created_at  timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;

-- Trigger: crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2-4. TABLAS: trips / bookings / messages
-- La versión anterior de la app tenía estas tablas con una estructura
-- distinta e incompatible (ej. origin_address/origin_city en vez de origin).
-- Están vacías (sin datos reales), así que se recrean desde cero.
drop table if exists public.messages cascade;
drop table if exists public.bookings cascade;
drop table if exists public.trips cascade;

create table public.trips (
  id               uuid primary key default gen_random_uuid(),
  driver_id        uuid not null references public.profiles(id) on delete cascade,
  origin           text not null,
  destination      text not null,
  departure_at     timestamptz not null,
  total_seats      smallint not null check (total_seats > 0),
  available_seats  smallint not null check (available_seats >= 0),
  price_per_seat   numeric(8, 2) not null check (price_per_seat >= 0),
  description      text,
  status           text not null default 'active' check (status in ('active', 'cancelled', 'completed')),
  created_at       timestamptz not null default now()
);

-- 3. TABLA: bookings
create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  passenger_id  uuid not null references public.profiles(id) on delete cascade,
  seats_booked  smallint not null default 1 check (seats_booked > 0),
  status        text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at    timestamptz not null default now(),
  unique (trip_id, passenger_id)
);

-- 4. TABLA: messages
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- 5. FUNCIÓN: book_seat (atómica — evita race condition en cupos)
create or replace function public.book_seat(p_trip_id uuid, p_passenger_id uuid)
returns void language plpgsql security definer as $$
begin
  -- Verificar que hay cupos disponibles
  if (select available_seats from public.trips where id = p_trip_id) <= 0 then
    raise exception 'No hay cupos disponibles en este viaje';
  end if;

  -- Insertar reserva
  insert into public.bookings (trip_id, passenger_id)
  values (p_trip_id, p_passenger_id);

  -- Decrementar cupo atómicamente
  update public.trips
  set available_seats = available_seats - 1
  where id = p_trip_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.trips    enable row level security;
alter table public.bookings enable row level security;
alter table public.messages enable row level security;

-- PROFILES
drop policy if exists "Cualquiera puede ver perfiles" on public.profiles;
create policy "Cualquiera puede ver perfiles"
  on public.profiles for select using (true);

drop policy if exists "Usuario puede actualizar su propio perfil" on public.profiles;
create policy "Usuario puede actualizar su propio perfil"
  on public.profiles for update using (auth.uid() = id);

-- TRIPS
create policy "Cualquiera puede ver viajes activos"
  on public.trips for select using (status = 'active' or driver_id = auth.uid());

create policy "Usuario autenticado puede crear viaje"
  on public.trips for insert with check (auth.uid() = driver_id);

create policy "Conductor puede editar su viaje"
  on public.trips for update using (auth.uid() = driver_id);

create policy "Conductor puede cancelar su viaje"
  on public.trips for delete using (auth.uid() = driver_id);

-- BOOKINGS
create policy "Pasajero ve sus reservas; conductor ve reservas de sus viajes"
  on public.bookings for select using (
    auth.uid() = passenger_id or
    auth.uid() = (select driver_id from public.trips where id = trip_id)
  );

create policy "Usuario autenticado puede reservar"
  on public.bookings for insert with check (auth.uid() = passenger_id);

create policy "Pasajero puede cancelar su reserva"
  on public.bookings for update using (auth.uid() = passenger_id);

-- MESSAGES
create policy "Participantes del viaje pueden ver mensajes"
  on public.messages for select using (
    auth.uid() = sender_id or
    auth.uid() = (select driver_id from public.trips where id = trip_id) or
    auth.uid() in (select passenger_id from public.bookings where trip_id = messages.trip_id and status = 'confirmed')
  );

create policy "Participantes pueden enviar mensajes"
  on public.messages for insert with check (
    auth.uid() = sender_id and (
      auth.uid() = (select driver_id from public.trips where id = trip_id) or
      auth.uid() in (select passenger_id from public.bookings where trip_id = messages.trip_id and status = 'confirmed')
    )
  );

-- ============================================================
-- REALTIME (para el chat en vivo)
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;

-- ============================================================
-- VERIFICACIÓN DE IDENTIDAD, ADMIN, RESEÑAS Y FEEDBACK
-- Aditivo: este proyecto ya tiene 3 usuarios reales en profiles,
-- no se borra ni se modifica nada existente, solo se agrega.
-- ============================================================

-- 1. PROFILES: columnas nuevas
alter table public.profiles add column if not exists first_name       text not null default '';
alter table public.profiles add column if not exists last_name        text not null default '';
alter table public.profiles add column if not exists document_type   text;
alter table public.profiles add column if not exists document_number text;
alter table public.profiles add column if not exists address         text;
alter table public.profiles add column if not exists postal_code     text;
alter table public.profiles add column if not exists birth_date      date;
alter table public.profiles add column if not exists role            text not null default 'user';
alter table public.profiles add column if not exists passenger_status text not null default 'unverified';
alter table public.profiles add column if not exists driver_status    text not null default 'unverified';

do $$ begin
  alter table public.profiles add constraint profiles_document_type_check
    check (document_type is null or document_type in ('dni', 'pasaporte'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles add constraint profiles_role_check
    check (role in ('user', 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles add constraint profiles_passenger_status_check
    check (passenger_status in ('unverified', 'pending', 'verified', 'rejected'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles add constraint profiles_driver_status_check
    check (driver_status in ('unverified', 'pending', 'verified', 'rejected'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles add constraint profiles_birth_date_check
    check (birth_date is null or birth_date <= (current_date - interval '18 years'));
exception when duplicate_object then null; end $$;

-- 2. TABLA: verification_documents (un row por documento subido)
create table if not exists public.verification_documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  doc_type      text not null check (doc_type in (
                  'dni_front', 'dni_back', 'selfie', 'license', 'insurance'
                )),
  storage_path  text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, doc_type)
);

-- 3. TABLA: reviews (reseñas mutuas conductor <-> pasajero)
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (trip_id, reviewer_id, reviewee_id)
);

do $$ begin
  alter table public.reviews add constraint reviews_no_self_review
    check (reviewer_id <> reviewee_id);
exception when duplicate_object then null; end $$;

-- 4. TABLA: app_feedback (sugerencias sobre la app)
create table if not exists public.app_feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- 5. STORAGE: bucket privado para documentos de verificación
insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

-- ============================================================
-- RLS: tablas nuevas
-- ============================================================
alter table public.verification_documents enable row level security;
alter table public.reviews enable row level security;
alter table public.app_feedback enable row level security;

-- verification_documents
drop policy if exists "Usuario o admin ve documentos" on public.verification_documents;
create policy "Usuario o admin ve documentos"
  on public.verification_documents for select using (
    auth.uid() = user_id or
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

drop policy if exists "Usuario sube sus propios documentos" on public.verification_documents;
create policy "Usuario sube sus propios documentos"
  on public.verification_documents for insert with check (auth.uid() = user_id);

drop policy if exists "Usuario actualiza sus propios documentos" on public.verification_documents;
create policy "Usuario actualiza sus propios documentos"
  on public.verification_documents for update using (auth.uid() = user_id);

-- reviews
drop policy if exists "Cualquiera puede ver reseñas" on public.reviews;
create policy "Cualquiera puede ver reseñas"
  on public.reviews for select using (true);

drop policy if exists "Participante de un viaje completado puede reseñar" on public.reviews;
create policy "Participante de un viaje completado puede reseñar"
  on public.reviews for insert with check (
    auth.uid() = reviewer_id
    and (select status from public.trips where id = trip_id) = 'completed'
    and (
      (auth.uid() = (select driver_id from public.trips where id = trip_id)
        and reviewee_id in (select passenger_id from public.bookings where trip_id = reviews.trip_id and status = 'confirmed'))
      or
      (auth.uid() in (select passenger_id from public.bookings where trip_id = reviews.trip_id and status = 'confirmed')
        and reviewee_id = (select driver_id from public.trips where id = trip_id))
    )
  );

-- app_feedback
drop policy if exists "Usuario autenticado puede enviar feedback" on public.app_feedback;
create policy "Usuario autenticado puede enviar feedback"
  on public.app_feedback for insert with check (auth.uid() = user_id);

drop policy if exists "Admin puede ver todo el feedback" on public.app_feedback;
create policy "Admin puede ver todo el feedback"
  on public.app_feedback for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ============================================================
-- RLS: storage de documentos de verificación
-- ============================================================
drop policy if exists "Usuario sube sus propios docs de verificación" on storage.objects;
create policy "Usuario sube sus propios docs de verificación"
  on storage.objects for insert with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Usuario actualiza sus propios docs de verificación" on storage.objects;
create policy "Usuario actualiza sus propios docs de verificación"
  on storage.objects for update using (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Usuario o admin puede ver docs de verificación" on storage.objects;
create policy "Usuario o admin puede ver docs de verificación"
  on storage.objects for select using (
    bucket_id = 'verification-docs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (select role from public.profiles where id = auth.uid()) = 'admin'
    )
  );

-- ============================================================
-- TRIGGER: handle_new_user actualizado con todos los campos nuevos
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (
    id, full_name, first_name, last_name, document_type, document_number,
    phone, address, postal_code, birth_date
  )
  values (
    new.id,
    trim(coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' || coalesce(new.raw_user_meta_data->>'last_name', '')),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'document_type',
    new.raw_user_meta_data->>'document_number',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'postal_code',
    (new.raw_user_meta_data->>'birth_date')::date
  );
  return new;
end;
$$;

-- 12. RLS: permitir que un admin actualice el perfil de cualquier usuario
-- (la política original solo dejaba a cada usuario actualizar su propio perfil,
-- necesario para que el panel admin pueda aprobar/rechazar verificaciones ajenas)
drop policy if exists "Admin puede actualizar cualquier perfil" on public.profiles;
create policy "Admin puede actualizar cualquier perfil"
  on public.profiles for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- 13. RLS: un pasajero confirmado también puede ver el viaje aunque ya no esté "active"
-- (la política original solo permitía ver viajes activos o propios del conductor,
-- lo que le impedía a un pasajero ver el detalle de su viaje una vez completado,
-- necesario para poder dejar reseñas).
-- Se usa una función security definer porque la política de "bookings" ya consulta
-- "trips" (para saber si auth.uid() es el conductor) -- una subconsulta directa a
-- bookings desde la política de trips genera recursión infinita entre ambas políticas.
create or replace function public.is_confirmed_passenger(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bookings
    where trip_id = p_trip_id and passenger_id = p_user_id and status = 'confirmed'
  );
$$;

drop policy if exists "Cualquiera puede ver viajes activos" on public.trips;
create policy "Cualquiera puede ver viajes activos"
  on public.trips for select using (
    status = 'active'
    or driver_id = auth.uid()
    or public.is_confirmed_passenger(id, auth.uid())
  );

-- 14. Limpieza: existían dos versiones sobrecargadas de book_seat (una de una
-- versión anterior de la app, con columnas que ya no existen en bookings:
-- cash, coordinate_with_driver). Esto le impedía a PostgREST elegir cuál llamar
-- y rompía toda reserva de viaje. Se borra la versión obsoleta de 5 parámetros.
drop function if exists public.book_seat(uuid, uuid, smallint, boolean, boolean);

-- 15. EMAILS TRANSACCIONALES (Resend, vía pg_cron + pg_net, sin Edge Functions)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- La api key de Resend vive en Vault (cifrada), nunca en este archivo ni en el repo.
-- Se carga una sola vez con: select vault.create_secret('re_...', 'resend_api_key', '...');

create table if not exists public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete cascade,
  type text not null,
  sent_at timestamptz not null default now()
);

do $$ begin
  alter table public.notifications_log add constraint notifications_log_type_check
    check (type in ('trip_reminder', 'incomplete_registration', 'inactivity'));
exception when duplicate_object then null; end $$;

alter table public.notifications_log enable row level security;
-- Sin políticas: solo accesible por funciones security definer (corren como postgres),
-- nunca expuesto vía la API a anon/authenticated.

-- Plantilla visual compartida por los 3 emails (logo, tarjeta blanca, botón de marca, footer).
-- URL base de la app: reemplazar https://app-adedo.vercel.app cuando esté deployada (Vercel, dominio propio, etc.)
create or replace function public.email_wrapper(p_body_html text, p_cta_text text default null, p_cta_url text default null)
returns text
language plpgsql
as $$
declare
  v_cta text := '';
begin
  if p_cta_text is not null and p_cta_url is not null then
    v_cta := format(
      '<div style="text-align:center;margin-top:20px;"><a href="%s" style="display:inline-block;background:#00a651;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:12px;font-size:14px;">%s</a></div>',
      p_cta_url, p_cta_text
    );
  end if;

  return format(
    '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;">' ||
    '<div style="text-align:center;margin-bottom:24px;"><span style="font-size:28px;">🚗</span>' ||
    '<div style="font-size:20px;font-weight:700;color:#0f172a;">A Dedo</div></div>' ||
    '<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;color:#334155;font-size:14px;line-height:1.6;">%s%s</div>' ||
    '<div style="text-align:center;margin-top:24px;font-size:12px;color:#94a3b8;">Desarrollado por <a href="https://astech.com.ar/" style="color:#00a651;text-decoration:none;">ASTech</a> · A Dedo</div>' ||
    '</div>',
    p_body_html, v_cta
  );
end;
$$;

create or replace function public.send_via_resend(p_to text, p_subject text, p_html text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_api_key text;
begin
  select decrypted_secret into v_api_key from vault.decrypted_secrets where name = 'resend_api_key';

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_api_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', 'A Dedo <adedo@astech.com.ar>',
      'to', p_to,
      'subject', p_subject,
      'html', p_html
    )
  );
end;
$$;

-- Recordatorio de viaje: conductor + pasajeros confirmados, 24hs antes de departure_at
create or replace function public.notify_trip_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select t.id as trip_id, t.driver_id as user_id, t.origin, t.destination, t.departure_at, u.email
    from public.trips t
    join auth.users u on u.id = t.driver_id
    where t.status = 'active'
      and t.departure_at between now() and now() + interval '24 hours'
      and not exists (
        select 1 from public.notifications_log nl
        where nl.trip_id = t.id and nl.user_id = t.driver_id and nl.type = 'trip_reminder'
      )
  loop
    perform public.send_via_resend(
      r.email,
      'Tu viaje sale en menos de 24hs',
      public.email_wrapper(
        format('<p>Hola,</p><p>Tu viaje como conductor de <b>%s</b> a <b>%s</b> sale el %s.</p>',
          r.origin, r.destination, to_char(r.departure_at, 'DD/MM/YYYY HH24:MI')),
        'Ver viaje',
        format('https://app-adedo.vercel.app/trips/%s', r.trip_id)
      )
    );
    insert into public.notifications_log (user_id, trip_id, type) values (r.user_id, r.trip_id, 'trip_reminder');
  end loop;

  for r in
    select t.id as trip_id, b.passenger_id as user_id, t.origin, t.destination, t.departure_at, u.email
    from public.trips t
    join public.bookings b on b.trip_id = t.id and b.status = 'confirmed'
    join auth.users u on u.id = b.passenger_id
    where t.status = 'active'
      and t.departure_at between now() and now() + interval '24 hours'
      and not exists (
        select 1 from public.notifications_log nl
        where nl.trip_id = t.id and nl.user_id = b.passenger_id and nl.type = 'trip_reminder'
      )
  loop
    perform public.send_via_resend(
      r.email,
      'Tu viaje sale en menos de 24hs',
      public.email_wrapper(
        format('<p>Hola,</p><p>Tu viaje de <b>%s</b> a <b>%s</b> sale el %s.</p>',
          r.origin, r.destination, to_char(r.departure_at, 'DD/MM/YYYY HH24:MI')),
        'Ver viaje',
        format('https://app-adedo.vercel.app/trips/%s', r.trip_id)
      )
    );
    insert into public.notifications_log (user_id, trip_id, type) values (r.user_id, r.trip_id, 'trip_reminder');
  end loop;
end;
$$;

-- Recordatorio de alta incompleta: pasajero sin verificar, 2 días después de registrarse
create or replace function public.notify_incomplete_registration()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select p.id as user_id, p.first_name, u.email
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.passenger_status = 'unverified'
      and u.created_at between now() - interval '3 days' and now() - interval '2 days'
      and not exists (
        select 1 from public.notifications_log nl
        where nl.user_id = p.id and nl.type = 'incomplete_registration'
      )
  loop
    perform public.send_via_resend(
      r.email,
      'Te falta un paso para usar A Dedo',
      public.email_wrapper(
        format('<p>Hola %s,</p><p>Para poder reservar viajes necesitamos que verifiques tu identidad. Subí tus documentos y quedás listo.</p>',
          coalesce(r.first_name, '')),
        'Verificar mi cuenta',
        'https://app-adedo.vercel.app/verify/passenger'
      )
    );
    insert into public.notifications_log (user_id, type) values (r.user_id, 'incomplete_registration');
  end loop;
end;
$$;

-- "Te extrañamos": sin loguearse hace 30+ días, reenvío con cooldown de 30 días
create or replace function public.notify_inactive_users()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select p.id as user_id, p.first_name, u.email
    from public.profiles p
    join auth.users u on u.id = p.id
    where coalesce(u.last_sign_in_at, u.created_at) < now() - interval '30 days'
      and not exists (
        select 1 from public.notifications_log nl
        where nl.user_id = p.id and nl.type = 'inactivity' and nl.sent_at > now() - interval '30 days'
      )
  loop
    perform public.send_via_resend(
      r.email,
      'Te extrañamos en A Dedo',
      public.email_wrapper(
        format('<p>Hola %s,</p><p>Hace un tiempo que no te vemos por A Dedo. ¡Volvé a compartir viajes!</p>',
          coalesce(r.first_name, '')),
        'Volver a A Dedo',
        'https://app-adedo.vercel.app/'
      )
    );
    insert into public.notifications_log (user_id, type) values (r.user_id, 'inactivity');
  end loop;
end;
$$;

select cron.schedule('notify-trip-reminders', '*/15 * * * *', $$select public.notify_trip_reminders()$$);
select cron.schedule('notify-incomplete-registration', '0 10 * * *', $$select public.notify_incomplete_registration()$$);
select cron.schedule('notify-inactive-users', '0 11 * * *', $$select public.notify_inactive_users()$$);

-- Para promover un usuario a admin (ejecutar manualmente luego de que se registre):
-- update public.profiles set role = 'admin' where id = '<uuid-del-usuario>';
