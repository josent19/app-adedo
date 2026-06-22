import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { submitAppFeedback } from '../hooks/useReviews'
import toast from 'react-hot-toast'

export default function Feedback() {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    try {
      await submitAppFeedback(user?.id ?? null, message.trim())
      setSent(true)
      setMessage('')
    } catch (err) {
      toast.error(err.message || 'Error al enviar la sugerencia')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Sugerencias</h1>
      <p className="text-slate-500 text-sm mb-6">
        ¿Algo que te gustaría que mejoremos? Contanos.
      </p>

      {sent ? (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-2xl p-6 text-center">
          ¡Gracias por tu sugerencia!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            required
            maxLength={1000}
            placeholder="Contanos qué se te ocurre..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {sending ? 'Enviando...' : 'Enviar sugerencia'}
          </button>
        </form>
      )}
    </div>
  )
}
