import { supabase } from '../lib/supabaseClient'

export async function submitReview(tripId, reviewerId, revieweeId, rating, comment) {
  const { error } = await supabase
    .from('reviews')
    .insert({ trip_id: tripId, reviewer_id: reviewerId, reviewee_id: revieweeId, rating, comment })
  if (error) {
    if (error.code === '23505') throw new Error('Ya dejaste una reseña para esta persona en este viaje')
    throw error
  }
}

export async function getReviewsForUser(userId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviewer_id(full_name, avatar_url)')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getReviewsForTrip(tripId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('trip_id', tripId)
  if (error) throw error
  return data
}

export async function getAverageRating(userId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', userId)
  if (error) throw error
  if (!data.length) return { average: null, count: 0 }
  const average = data.reduce((sum, r) => sum + r.rating, 0) / data.length
  return { average, count: data.length }
}

export async function submitAppFeedback(userId, message) {
  const { error } = await supabase
    .from('app_feedback')
    .insert({ user_id: userId, message })
  if (error) throw error
}
