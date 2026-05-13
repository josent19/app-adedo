import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getProfile, updateProfile } from '../hooks/useProfile'
import Avatar from '../components/ui/Avatar'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user } = useAuth()
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getProfile(user.id)
      .then(p => setForm({ full_name: p.full_name || '', phone: p.phone || '' }))
      .catch(() => toast.error('Error al cargar el perfil'))
      .finally(() => setLoading(false))
  }, [user.id])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
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
    </div>
  )
}
