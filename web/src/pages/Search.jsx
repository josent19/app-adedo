import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchTrips } from '../hooks/useTrips'
import TripCard from '../components/trips/TripCard'
import EmptyState from '../components/ui/EmptyState'

export default function Search() {
  const [searchParams] = useSearchParams()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const date = searchParams.get('date') || ''

  useEffect(() => {
    setLoading(true)
    searchTrips({ origin: from, destination: to, date })
      .then(setTrips)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [from, to, date])

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {from && to ? `${from} → ${to}` : 'Todos los viajes disponibles'}
        </h1>
        {date && <p className="text-slate-500 text-sm mt-1">{new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>}
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          Error al cargar viajes: {error}
        </div>
      )}

      {!loading && !error && trips.length === 0 && (
        <EmptyState
          icon="🗺️"
          title="No hay viajes disponibles"
          description="No encontramos viajes para esa búsqueda. Probá con otras fechas o destinos."
        />
      )}

      {!loading && !error && trips.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">{trips.length} viaje{trips.length !== 1 ? 's' : ''} encontrado{trips.length !== 1 ? 's' : ''}</p>
          {trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
        </div>
      )}
    </div>
  )
}
