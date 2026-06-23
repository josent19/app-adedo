# A Dedo

App de viajes compartidos (carpooling) — **no es un servicio de taxi**: conecta conductores que ya van a un destino con pasajeros que quieren ir al mismo lugar, dividiendo el costo del viaje. Pensada para Argentina.

🔗 Producción: [https://app-adedo.vercel.app](https://app-adedo.vercel.app)

## Tecnología

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router v6
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime)
- **Notificaciones**: react-hot-toast (UI), Resend (emails transaccionales)
- **Emails programados**: `pg_cron` + `pg_net` corriendo directo en Postgres (sin Edge Functions)
- **Deploy**: Vercel, conectado al repo de GitHub (`main` → producción automática)

No hay backend propio: toda la lógica de servidor vive en Supabase (RLS, funciones SQL, triggers, Storage). El frontend habla directo con Supabase vía `@supabase/supabase-js`.

## Funcionalidades

- **Viajes**: publicar, buscar, reservar y cancelar lugares; chat en vivo por viaje (Supabase Realtime).
- **Registro completo**: nombre, apellido, documento, teléfono, dirección, fecha de nacimiento (con validación de mayoría de edad en el cliente y en la base) y validaciones de formato en cada input (sin números en nombres, solo dígitos en teléfono, etc. — ver `src/lib/inputFilters.js`).
- **Verificación de identidad en dos niveles**:
  - *Pasajero* (obligatorio para reservar): DNI/pasaporte frente, dorso y selfie.
  - *Conductor* (obligatorio para publicar viajes): los mismos documentos + licencia de conducir + seguro del auto.
  - Documentos privados en Storage, revisados manualmente desde el panel admin.
- **Panel de administración** (`/admin/verifications`, solo `role = 'admin'`): aprobar o rechazar verificaciones pendientes con vista de los documentos subidos.
- **Reseñas mutuas**: conductor y pasajero se califican entre sí (1-5 estrellas + comentario) al completar un viaje; promedio visible en el perfil y en el detalle del viaje.
- **Canal de sugerencias** (`/feedback`).
- **Emails transaccionales** (vía Resend):
  - Confirmación de cuenta al registrarse (SMTP de Supabase Auth reenrutado por Resend).
  - Recordatorio de viaje 24hs antes de la salida (conductor + pasajeros confirmados).
  - Recordatorio para completar el alta a los 2 días de registrarse sin verificar.
  - "Te extrañamos, volvé" a los 30 días de inactividad (con cooldown de 30 días entre reenvíos).

## Estructura del proyecto

```
web/
├── src/
│   ├── components/
│   │   ├── layout/       # Navbar, Footer, ProtectedRoute, AdminRoute
│   │   ├── trips/        # TripCard
│   │   └── ui/           # Avatar, Badge, EmptyState
│   ├── context/          # AuthContext (sesión de Supabase)
│   ├── hooks/            # useTrips, useBookings, useProfile, useVerification, useReviews
│   ├── lib/               # supabaseClient, inputFilters
│   ├── pages/             # Home, Search, TripDetail, CreateTrip, MyTrips, MyBookings,
│   │                      # Profile, Login, Register, ConfirmEmail, Verify, Feedback
│   │   └── admin/         # AdminVerifications
│   ├── App.jsx            # Rutas
│   └── main.jsx
└── supabase_setup.sql      # Único script de infraestructura (ver abajo)
```

## Base de datos (`supabase_setup.sql`)

Un solo archivo SQL, pensado para correrse completo en el **SQL Editor de Supabase** y ser re-ejecutable sin romper nada (usa `create table if not exists`, `drop policy if exists`, bloques `do $$ ... exception when duplicate_object then null; end $$;`, etc.). Cubre:

- Tablas: `profiles`, `trips`, `bookings`, `messages`, `verification_documents`, `reviews`, `app_feedback`, `notifications_log`.
- Row Level Security en todas las tablas.
- Funciones: `book_seat` (reserva atómica), `handle_new_user` (trigger que crea el perfil al registrarse), `is_confirmed_passenger`, `send_via_resend`, `email_wrapper`, `notify_trip_reminders`, `notify_incomplete_registration`, `notify_inactive_users`.
- Extensiones: `pg_cron`, `pg_net`, `supabase_vault` (la API key de Resend vive cifrada en Vault, nunca en este repo).

Cualquier cambio de esquema nuevo se agrega al **final** de este mismo archivo (nunca se reescribe lo viejo), para que siga sirviendo como historial completo de la base.

## Variables de entorno

Crear `web/.env.local` (gitignored):

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

Estas son las únicas dos que necesita el **frontend**. La API key de Resend y la connection string de Postgres son solo para tareas de administración/infraestructura — nunca van en el código ni en variables `VITE_*` (esas quedan expuestas en el bundle del navegador).

## Desarrollo local

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción en dist/
```

## Pendiente / roadmap

- **Pagos**: hoy el precio del viaje se coordina directo entre conductor y pasajero (efectivo/transferencia), la app no cobra nada. Próximo paso evaluado: cobrar un cargo de servicio chico al pasajero al confirmar la reserva vía Mercado Pago Checkout, sin tocar el pago del viaje en sí.
- Actualizar la URL base de los emails (`app-adedo.vercel.app`) si se conecta un dominio propio.
