import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyTrips, cancelTrip } from '../hooks/useTrips'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export default function MyTrips() {
  const { user } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  function load() {
    getMyTrips(user.id).then(setTrips).catch(() => toast.error('Error al cargar tus viajes')).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [user.id])

  async function handleCancel(tripId) {
    if (!confirm('¿Cancelar este viaje? Los pasajeros serán notificados.')) return
    try {
      await cancelTrip(tripId)
      toast.success('Viaje cancelado')
      load()
    } catch {
      toast.error('Error al cancelar')
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mis viajes publicados</h1>
        <Link to="/trips/new" className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Nuevo viaje
        </Link>
      </div>

      {trips.length === 0 && (
        <EmptyState icon="🚗" title="Aún no publicaste viajes" description="Cuando publiques un viaje aparecerá acá." />
      )}

      <div className="space-y-4">
        {trips.map(trip => (
          <div key={trip.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <span>{trip.origin}</span><span className="text-slate-400">→</span><span>{trip.destination}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{formatDate(trip.departure_at)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge status={trip.status} />
                  <span className="text-sm text-slate-500">🪑 {trip.available_seats}/{trip.total_seats} lugares</span>
                  <span className="text-sm font-semibold text-brand-600">${trip.price_per_seat}</span>
                </div>
              </div>
              {trip.status === 'active' && (
                <div className="flex gap-2">
                  <Link to={`/trips/${trip.id}/edit`} className="text-sm text-slate-500 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                    Editar
                  </Link>
                  <button onClick={() => handleCancel(trip.id)} className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg transition-colors">
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Passengers */}
            {trip.bookings?.filter(b => b.status === 'confirmed').length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Pasajeros</p>
                <div className="flex flex-wrap gap-3">
                  {trip.bookings.filter(b => b.status === 'confirmed').map(b => (
                    <div key={b.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <Avatar name={b.profiles?.full_name || '?'} size="xs" />
                      <span>{b.profiles?.full_name || 'Pasajero'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
