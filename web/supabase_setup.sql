-- ============================================================
-- A DEDO — Script de setup para Supabase SQL Editor
-- Ejecutar completo de una sola vez
-- ============================================================

-- 1. TABLA: profiles (espejo de auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  avatar_url  text,
  phone       text,
  created_at  timestamptz not null default now()
);

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

-- 2. TABLA: trips
create table if not exists public.trips (
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
create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  passenger_id  uuid not null references public.profiles(id) on delete cascade,
  seats_booked  smallint not null default 1 check (seats_booked > 0),
  status        text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at    timestamptz not null default now(),
  unique (trip_id, passenger_id)
);

-- 4. TABLA: messages
create table if not exists public.messages (
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
create policy "Cualquiera puede ver perfiles"
  on public.profiles for select using (true);

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
alter publication supabase_realtime add table public.messages;
