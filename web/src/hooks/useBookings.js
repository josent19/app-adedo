import { supabase } from '../lib/supabaseClient'

export async function bookSeat(tripId, passengerId) {
  const { error } = await supabase.rpc('book_seat', {
    p_trip_id: tripId,
    p_passenger_id: passengerId,
  })
  if (error) throw error
}

export async function getMyBookingForTrip(tripId, userId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('trip_id', tripId)
    .eq('passenger_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getMyBookings(userId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, trips(id, origin, destination, departure_at, price_per_seat, status, profiles(full_name, avatar_url))')
    .eq('passenger_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getConfirmedBookingsForTrip(tripId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, profiles(id, full_name, avatar_url)')
    .eq('trip_id', tripId)
    .eq('status', 'confirmed')
  if (error) throw error
  return data
}

export async function cancelBooking(bookingId) {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
  if (error) throw error
}
