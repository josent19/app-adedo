import { supabase } from '../lib/supabaseClient'

export async function searchTrips({ origin, destination, date }) {
  let query = supabase
    .from('trips')
    .select('*, profiles(id, full_name, avatar_url)')
    .eq('status', 'active')
    .gt('available_seats', 0)
    .order('departure_at', { ascending: true })

  if (origin) query = query.ilike('origin', `%${origin}%`)
  if (destination) query = query.ilike('destination', `%${destination}%`)
  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    query = query.gte('departure_at', start.toISOString()).lte('departure_at', end.toISOString())
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getTripById(id) {
  const { data, error } = await supabase
    .from('trips')
    .select('*, profiles(id, full_name, avatar_url, phone)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getMyTrips(driverId) {
  const { data, error } = await supabase
    .from('trips')
    .select('*, bookings(id, status, seats_booked, profiles(id, full_name, avatar_url))')
    .eq('driver_id', driverId)
    .order('departure_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createTrip(tripData) {
  const { data, error } = await supabase.from('trips').insert(tripData).select().single()
  if (error) throw error
  return data
}

export async function updateTrip(id, updates) {
  const { data, error } = await supabase.from('trips').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function cancelTrip(id) {
  const { error } = await supabase.from('trips').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw error
}
