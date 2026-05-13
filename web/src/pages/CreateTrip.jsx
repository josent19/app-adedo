import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createTrip, updateTrip, getTripById } from '../hooks/useTrips'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  origin: '', destination: '', departure_at: '', total_seats: 3,
  available_seats: 3, price_per_seat: '', description: '',
}

export default function CreateTrip() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getTripById(id).then(trip => {
        const dt = new Date(trip.departure_at)
        const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        setForm({
          origin: trip.origin,
          destination: trip.destination,
          departure_at: local,
          total_seats: trip.total_seats,
          available_seats: trip.available_seats,
          price_per_seat: trip.price_per_seat,
          description: trip.description || '',
        })
      }).catch(() => toast.error('No se pudo cargar el viaje'))
    }
  }, [id, isEdit])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => {
      const updated = { ...f, [name]: value }
      if (name === 'total_seats' && !isEdit) updated.available_seats = value
      return updated
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        total_seats: Number(form.total_seats),
        available_seats: Number(form.available_seats),
        price_per_seat: Number(form.price_per_seat),
        driver_id: user.id,
      }
      if (isEdit) {
        await updateTrip(id, payload)
        toast.success('Viaje actualizado')
      } else {
        const trip = await createTrip(payload)
        toast.success('¡Viaje publicado!')
        navigate(`/trips/${trip.id}`)
        return
      }
      navigate('/my-trips')
    } catch (err) {
      toast.error(err.message || 'Error al guardar el viaje')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        {isEdit ? 'Editar viaje' : 'Publicar un viaje'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Origen</label>
            <input name="origin" type="text" required value={form.origin} onChange={handleChange}
              placeholder="Ej: Buenos Aires"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
            <input name="destination" type="text" required value={form.destination} onChange={handleChange}
              placeholder="Ej: Mar del Plata"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y hora de salida</label>
          <input name="departure_at" type="datetime-local" required value={form.departure_at} onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lugares disponibles</label>
            <input name="total_seats" type="number" min="1" max="8" required value={form.total_seats} onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Precio por asiento ($)</label>
            <input name="price_per_seat" type="number" min="0" required value={form.price_per_seat} onChange={handleChange}
              placeholder="Ej: 5000"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
          <textarea name="description" rows={3} value={form.description} onChange={handleChange}
            placeholder="Paradas en el camino, condiciones del viaje, etc."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors">
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Publicar viaje'}
        </button>
      </form>
    </div>
  )
}
