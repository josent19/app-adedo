import { useState, useEffect } from 'react'
import {
  adminListPendingRequests,
  adminGetUserDocuments,
  adminSetPassengerStatus,
  adminSetDriverStatus,
} from '../../hooks/useVerification'
import Badge from '../../components/ui/Badge'
import toast from 'react-hot-toast'

const DOC_LABELS = {
  dni_front: 'Documento - frente',
  dni_back: 'Documento - dorso',
  selfie: 'Selfie',
  license: 'Licencia',
  insurance: 'Seguro',
}

export default function AdminVerifications() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [openUserId, setOpenUserId] = useState(null)
  const [docs, setDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [actingId, setActingId] = useState(null)

  async function refresh() {
    setLoading(true)
    try {
      const data = await adminListPendingRequests()
      setRequests(data)
    } catch (err) {
      toast.error(err.message || 'Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  async function toggleDocs(userId) {
    if (openUserId === userId) {
      setOpenUserId(null)
      return
    }
    setOpenUserId(userId)
    setDocsLoading(true)
    try {
      const data = await adminGetUserDocuments(userId)
      setDocs(data)
    } catch (err) {
      toast.error(err.message || 'Error al cargar documentos')
    } finally {
      setDocsLoading(false)
    }
  }

  async function handleDecision(userId, tier, decision) {
    setActingId(`${userId}-${tier}`)
    try {
      if (tier === 'passenger') await adminSetPassengerStatus(userId, decision)
      else await adminSetDriverStatus(userId, decision)
      toast.success(decision === 'verified' ? 'Verificación aprobada' : 'Verificación rechazada')
      await refresh()
    } catch (err) {
      toast.error(err.message || 'Error al guardar la decisión')
    } finally {
      setActingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Verificaciones pendientes</h1>

      {requests.length === 0 ? (
        <p className="text-slate-500 text-sm">No hay solicitudes pendientes.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{r.first_name} {r.last_name}</p>
                  <p className="text-sm text-slate-500">Doc: {r.document_number}</p>
                </div>
                <button
                  onClick={() => toggleDocs(r.id)}
                  className="text-sm text-brand-600 font-medium hover:underline"
                >
                  {openUserId === r.id ? 'Ocultar documentos' : 'Ver documentos'}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                {r.passenger_status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Pasajero</span>
                    <Badge status="pending" />
                    <button
                      disabled={actingId === `${r.id}-passenger`}
                      onClick={() => handleDecision(r.id, 'passenger', 'verified')}
                      className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg"
                    >
                      Aprobar
                    </button>
                    <button
                      disabled={actingId === `${r.id}-passenger`}
                      onClick={() => handleDecision(r.id, 'passenger', 'rejected')}
                      className="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
                {r.driver_status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Conductor</span>
                    <Badge status="pending" />
                    <button
                      disabled={actingId === `${r.id}-driver`}
                      onClick={() => handleDecision(r.id, 'driver', 'verified')}
                      className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg"
                    >
                      Aprobar
                    </button>
                    <button
                      disabled={actingId === `${r.id}-driver`}
                      onClick={() => handleDecision(r.id, 'driver', 'rejected')}
                      className="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>

              {openUserId === r.id && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  {docsLoading ? (
                    <p className="text-sm text-slate-500">Cargando documentos...</p>
                  ) : docs.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin documentos.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {docs.map((d) => (
                        <a key={d.doc_type} href={d.signedUrl} target="_blank" rel="noreferrer" className="block">
                          <img src={d.signedUrl} alt={d.doc_type} className="w-full h-28 object-cover rounded-lg border border-slate-200" />
                          <p className="text-xs text-slate-500 mt-1 text-center">{DOC_LABELS[d.doc_type] || d.doc_type}</p>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
