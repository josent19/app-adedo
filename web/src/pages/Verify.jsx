import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfile } from '../hooks/useProfile'
import { getMyDocuments, submitTier1, submitTier2, TIER1_DOCS, TIER2_DOCS } from '../hooks/useVerification'
import Badge from '../components/ui/Badge'
import toast from 'react-hot-toast'

const DOC_LABELS = {
  dni_front: 'Documento - frente',
  dni_back: 'Documento - dorso',
  selfie: 'Selfie sosteniendo tu documento',
  license: 'Licencia / registro de conducir',
  insurance: 'Seguro del auto',
}

export default function Verify() {
  const { tier } = useParams() // 'passenger' | 'driver'
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [docs, setDocs] = useState({})
  const [files, setFiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const slots = tier === 'driver' ? [...TIER1_DOCS, ...TIER2_DOCS] : TIER1_DOCS
  const status = tier === 'driver' ? profile?.driver_status : profile?.passenger_status

  useEffect(() => {
    if (!user) return
    Promise.all([getProfile(user.id), getMyDocuments(user.id)])
      .then(([p, d]) => {
        setProfile(p)
        setDocs(Object.fromEntries(d.map(doc => [doc.doc_type, doc])))
      })
      .finally(() => setLoading(false))
  }, [user])

  function handleFileChange(docType) {
    return (e) => {
      const file = e.target.files[0]
      if (file) setFiles(f => ({ ...f, [docType]: file }))
    }
  }

  function isReadOnly(docType) {
    // Tier-1 docs already submitted (and not rejected) stay read-only while applying for tier 2
    if (!TIER1_DOCS.includes(docType)) return false
    return Boolean(docs[docType]) && profile?.passenger_status !== 'rejected'
  }

  const editableSlots = slots.filter(s => !isReadOnly(s))
  const allEditableFilled = editableSlots.every(s => files[s])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      if (tier === 'driver') {
        const tier1Files = {}
        const tier2Files = {}
        for (const s of editableSlots) {
          if (TIER1_DOCS.includes(s)) tier1Files[s] = files[s]
          else tier2Files[s] = files[s]
        }
        if (Object.keys(tier1Files).length) await submitTier1(user.id, tier1Files)
        await submitTier2(user.id, tier2Files)
      } else {
        await submitTier1(user.id, files)
      }
      toast.success('Documentos enviados, te avisaremos cuando los revisemos')
      const [p, d] = await Promise.all([getProfile(user.id), getMyDocuments(user.id)])
      setProfile(p)
      setDocs(Object.fromEntries(d.map(doc => [doc.doc_type, doc])))
      setFiles({})
    } catch (err) {
      toast.error(err.message || 'Error al subir los documentos')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const canSubmit = editableSlots.length > 0 && allEditableFilled && status !== 'pending'

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        {tier === 'driver' ? 'Verificación de conductor' : 'Verificá tu identidad'}
      </h1>
      <p className="text-slate-500 text-sm mb-4">
        {tier === 'driver'
          ? 'Para poder publicar viajes necesitamos validar tu documento, una selfie, tu licencia y el seguro del auto.'
          : 'Para poder reservar viajes necesitamos validar tu documento y una selfie.'}
      </p>
      <div className="mb-6">
        <Badge status={status} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        {slots.map((docType) => (
          <div key={docType}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{DOC_LABELS[docType]}</label>
            {isReadOnly(docType) ? (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span>✅</span><span>Ya enviado</span>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange(docType)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
              />
            )}
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
        >
          {submitting ? 'Enviando...' : 'Enviar para revisión'}
        </button>
        {status === 'pending' && (
          <p className="text-center text-sm text-slate-500">Tu verificación está en revisión, te avisaremos pronto.</p>
        )}
      </div>
    </div>
  )
}
