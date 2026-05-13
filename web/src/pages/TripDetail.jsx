import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTripById } from '../hooks/useTrips'
import { bookSeat, getMyBookingForTrip } from '../hooks/useBookings'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import toast from 'react-hot-toast'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function TripDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [myBooking, setMyBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    Promise.all([
      getTripById(id),
      user ? getMyBookingForTrip(id, user.id) : Promise.resolve(null),
    ])
      .then(([tripData, bookingData]) => {
        setTrip(tripData)
        setMyBooking(bookingData)
      })
      .catch(() => toast.error('No se pudo cargar el viaje'))
      .finally(() => setLoading(false))
  }, [id, user])

  // Cargar y suscribir mensajes
  useEffect(() => {
    if (!trip) return
    const isParticipant = user && (
      user.id === trip.driver_id ||
      (myBooking && myBooking.status === 'confirmed')
    )
    if (!isParticipant) return

    supabase.from('messages').select('*, profiles(full_name, avatar_url)').eq('trip_id', id).order('created_at').then(({ data }) => setMessages(data || []))

    const channel = supabase.channel(`trip-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `trip_id=eq.${id}` }, payload => {
        supabase.from('messages').select('*, profiles(full_name, avatar_url)').eq('id', payload.new.id).single().then(({ data }) => {
          if (data) setMessages(prev => [...prev, data])
        })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [trip, user, myBooking, id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleBook() {
    if (!user) { navigate('/login'); return }
    setBooking(true)
    try {
      await bookSeat(id, user.id)
      toast.success('¡Reserva confirmada!')
      const [updatedTrip, updatedBooking] = await Promise.all([getTripById(id), getMyBookingForTrip(id, user.id)])
      setTrip(updatedTrip)
      setMyBooking(updatedBooking)
    } catch (err) {
      toast.error(err.message || 'Error al reservar')
    } finally {
      setBooking(false)
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!newMsg.trim()) return
    setSendingMsg(true)
    const { error } = await supabase.from('messages').insert({ trip_id: id, sender_id: user.id, body: newMsg.trim() })
    if (error) toast.error('No se pudo enviar el mensaje')
    else setNewMsg('')
    setSendingMsg(false)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-2/3" />
        <div className="h-4 bg-slate-100 rounded w-1/3" />
        <div className="h-40 bg-white rounded-2xl border border-slate-200" />
      </div>
    )
  }

  if (!trip) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-center text-slate-500">Viaje no encontrado.</div>
  }

  const isDriver = user?.id === trip.driver_id
  const isParticipant = user && (isDriver || (myBooking?.status === 'confirmed'))
  const canBook = user && !isDriver && !myBooking && trip.available_seats > 0 && trip.status === 'active'
  const alreadyBooked = myBooking?.status === 'confirmed'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <span>{trip.origin}</span>
          <span className="text-slate-400">→</span>
          <span>{trip.destination}</span>
        </div>
        <p className="text-slate-500 mt-1">{formatDate(trip.departure_at)}</p>
        <Badge status={trip.status} className="mt-2" />
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={trip.profiles?.full_name || 'Conductor'} />
            <div>
              <p className="font-medium text-slate-900">{trip.profiles?.full_name || 'Conductor'}</p>
              {isParticipant && trip.profiles?.phone && (
                <p className="text-sm text-slate-500">{trip.profiles.phone}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-600">${trip.price_per_seat}</p>
            <p className="text-xs text-slate-400">por persona</p>
          </div>
        </div>

        <div className="flex gap-6 pt-2 border-t border-slate-100 text-sm text-slate-600">
          <span>🪑 {trip.available_seats} de {trip.total_seats} lugares</span>
        </div>

        {trip.description && (
          <p className="text-sm text-slate-600 pt-2 border-t border-slate-100">{trip.description}</p>
        )}

        {/* Booking action */}
        {canBook && (
          <button
            onClick={handleBook}
            disabled={booking}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {booking ? 'Reservando...' : 'Reservar lugar'}
          </button>
        )}
        {alreadyBooked && (
          <div className="w-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium py-3 rounded-xl text-center">
            ✓ Ya tenés tu lugar reservado
          </div>
        )}
        {!user && trip.status === 'active' && (
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Ingresá para reservar
          </button>
        )}
        {trip.available_seats === 0 && !alreadyBooked && (
          <div className="w-full bg-slate-50 border border-slate-200 text-slate-500 text-sm font-medium py-3 rounded-xl text-center">
            No quedan lugares disponibles
          </div>
        )}
      </div>

      {/* Chat (solo para participantes) */}
      {isParticipant && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Chat del viaje</h2>
          </div>
          <div className="h-64 overflow-y-auto px-5 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-slate-400 text-center mt-8">Aún no hay mensajes. ¡Arrancá la conversación!</p>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.sender_id === user.id ? 'flex-row-reverse' : ''}`}>
                <Avatar name={msg.profiles?.full_name || '?'} size="xs" />
                <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${msg.sender_id === user.id ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-800'}`}>
                  {msg.body}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="px-4 py-3 border-t border-slate-100 flex gap-2">
            <input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="Escribí un mensaje..."
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={sendingMsg || !newMsg.trim()}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
