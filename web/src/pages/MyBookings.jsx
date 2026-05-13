import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyBookings, cancelBooking } from '../hooks/useBookings'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export default function MyBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  function load() {
    getMyBookings(user.id).then(setBookings).catch(() => toast.error('Error al cargar tus reservas')).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [user.id])

  async function handleCancel(bookingId) {
    if (!confirm('¿Cancelar esta reserva?')) return
    try {
      await cancelBooking(bookingId)
      toast.success('Reserva cancelada')
      load()
    } catch {
      toast.error('Error al cancelar')
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      {[1, 2].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Mis reservas</h1>

      {bookings.length === 0 && (
        <EmptyState icon="🎫" title="Aún no tenés reservas" description="Buscá un viaje y reservá tu lugar." action={{ label: 'Buscar viajes', href: '/search' }} />
      )}

      <div className="space-y-4">
        {bookings.map(booking => (
          <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <Link to={`/trips/${booking.trips?.id}`} className="flex items-center gap-2 font-semibold text-slate-900 hover:text-brand-600 transition-colors">
                  <span>{booking.trips?.origin}</span><span className="text-slate-400">→</span><span>{booking.trips?.destination}</span>
                </Link>
                <p className="text-sm text-slate-500 mt-1">{booking.trips?.departure_at ? formatDate(booking.trips.departure_at) : ''}</p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge status={booking.status} />
                  <span className="text-sm font-semibold text-brand-600">${booking.trips?.price_per_seat} / asiento</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {booking.trips?.profiles && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Avatar name={booking.trips.profiles.full_name || 'Conductor'} size="xs" />
                    <span>{booking.trips.profiles.full_name}</span>
                  </div>
                )}
                {booking.status === 'confirmed' && booking.trips?.status === 'active' && (
                  <button onClick={() => handleCancel(booking.id)} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                    Cancelar reserva
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
