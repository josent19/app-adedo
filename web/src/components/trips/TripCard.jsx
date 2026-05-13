import { Link } from 'react-router-dom'
import Avatar from '../ui/Avatar'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export default function TripCard({ trip }) {
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-brand-200 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="truncate">{trip.origin}</span>
            <span className="text-slate-400 text-base">→</span>
            <span className="truncate">{trip.destination}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{formatDate(trip.departure_at)}</p>
          {trip.description && (
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{trip.description}</p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-brand-600">${trip.price_per_seat}</p>
          <p className="text-xs text-slate-400 mt-0.5">por asiento</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Avatar name={trip.profiles?.full_name || 'Usuario'} size="xs" />
          <span className="text-sm text-slate-600">{trip.profiles?.full_name || 'Conductor'}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-slate-500">
          <span>🪑</span>
          <span>{trip.available_seats} lugar{trip.available_seats !== 1 ? 'es' : ''}</span>
        </div>
      </div>
    </Link>
  )
}
