import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfile, updateProfile } from '../hooks/useProfile'
import { getReviewsForUser, getAverageRating } from '../hooks/useReviews'
import { onlyLetters, onlyPhoneChars } from '../lib/inputFilters'
import Avatar from '../components/ui/Avatar'
import toast from 'react-hot-toast'

function Stars({ rating }) {
  return (
    <span className="text-amber-400">
      {'★'.repeat(rating)}
      <span className="text-slate-200">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reviews, setReviews] = useState([])
  const [ratingInfo, setRatingInfo] = useState({ average: null, count: 0 })

  useEffect(() => {
    getProfile(user.id)
      .then(p => setForm({ full_name: p.full_name || '', phone: p.phone || '' }))
      .catch(() => toast.error('Error al cargar el perfil'))
      .finally(() => setLoading(false))

    Promise.all([getReviewsForUser(user.id), getAverageRating(user.id)])
      .then(([r, avg]) => { setReviews(r); setRatingInfo(avg) })
      .catch(() => {})
  }, [user.id])

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'full_name') {
      setForm(f => ({ ...f, full_name: onlyLetters(value) }))
      return
    }
    if (name === 'phone') {
      setForm(f => ({ ...f, phone: onlyPhoneChars(value) }))
      return
    }
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.full_name.trim().length < 2) {
      toast.error('Ingresá un nombre válido')
      return
    }
    if (form.phone && form.phone.replace(/[^0-9]/g, '').length < 8) {
      toast.error('Ingresá un teléfono válido (mínimo 8 dígitos)')
      return
    }
    setSaving(true)
    try {
      await updateProfile(user.id, form)
      toast.success('Perfil actualizado')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="max-w-md mx-auto px-4 py-10 animate-pulse">
      <div className="h-20 w-20 bg-slate-200 rounded-full mx-auto mb-6" />
      <div className="space-y-4">
        <div className="h-10 bg-slate-200 rounded-lg" />
        <div className="h-10 bg-slate-200 rounded-lg" />
      </div>
    </div>
  )

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <Avatar name={form.full_name || user.email} size="lg" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Mi perfil</h1>
        <p className="text-slate-500 text-sm mt-1">{user.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
          <input
            name="full_name"
            type="text"
            required
            value={form.full_name}
            onChange={handleChange}
            maxLength={80}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (visible para compañeros de viaje)</label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            inputMode="tel"
            maxLength={20}
            placeholder="+54 9 11 1234-5678"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Mis reseñas</h2>
          {ratingInfo.count > 0 && (
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <Stars rating={Math.round(ratingInfo.average)} />
              <span>({ratingInfo.count})</span>
            </div>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no recibiste reseñas.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 text-sm">{r.reviewer?.full_name || 'Usuario'}</span>
                  <Stars rating={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-sm text-slate-400 mt-8">
        <Link to="/feedback" className="text-brand-600 hover:underline">¿Tenés una sugerencia para mejorar la app?</Link>
      </p>
    </div>
  )
}
