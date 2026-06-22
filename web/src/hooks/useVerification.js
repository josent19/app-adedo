import { supabase } from '../lib/supabaseClient'

export const TIER1_DOCS = ['dni_front', 'dni_back', 'selfie']
export const TIER2_DOCS = ['license', 'insurance']

export async function getMyDocuments(userId) {
  const { data, error } = await supabase
    .from('verification_documents')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function uploadDocument(userId, docType, file) {
  const ext = file.name.split('.').pop()
  const storagePath = `${userId}/${docType}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('verification-docs')
    .upload(storagePath, file, { upsert: true })
  if (uploadError) throw uploadError

  const { error: upsertError } = await supabase
    .from('verification_documents')
    .upsert(
      { user_id: userId, doc_type: docType, storage_path: storagePath, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,doc_type' }
    )
  if (upsertError) throw upsertError
}

export async function submitTier1(userId, files) {
  for (const docType of TIER1_DOCS) {
    if (files[docType]) await uploadDocument(userId, docType, files[docType])
  }
  const { error } = await supabase
    .from('profiles')
    .update({ passenger_status: 'pending' })
    .eq('id', userId)
  if (error) throw error
}

export async function submitTier2(userId, files) {
  for (const docType of TIER2_DOCS) {
    if (files[docType]) await uploadDocument(userId, docType, files[docType])
  }
  const { error } = await supabase
    .from('profiles')
    .update({ driver_status: 'pending' })
    .eq('id', userId)
  if (error) throw error
}

export async function adminListPendingRequests() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, document_number, passenger_status, driver_status')
    .or('passenger_status.eq.pending,driver_status.eq.pending')
  if (error) throw error
  return data
}

export async function adminGetUserDocuments(userId) {
  const docs = await getMyDocuments(userId)
  const withUrls = await Promise.all(
    docs.map(async (doc) => {
      const { data, error } = await supabase.storage
        .from('verification-docs')
        .createSignedUrl(doc.storage_path, 60 * 5)
      if (error) throw error
      return { ...doc, signedUrl: data.signedUrl }
    })
  )
  return withUrls
}

export async function adminSetPassengerStatus(userId, status) {
  const { error } = await supabase
    .from('profiles')
    .update({ passenger_status: status })
    .eq('id', userId)
  if (error) throw error
}

export async function adminSetDriverStatus(userId, status) {
  const { error } = await supabase
    .from('profiles')
    .update({ driver_status: status })
    .eq('id', userId)
  if (error) throw error
}
