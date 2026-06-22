import { Link, useLocation } from 'react-router-dom'

export default function ConfirmEmail() {
  const location = useLocation()
  const email = location.state?.email

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <span className="text-4xl">📧</span>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Revisá tu correo</h1>
      <p className="mt-3 text-slate-500 text-sm">
        Te enviamos un link de confirmación{email ? <> a <strong>{email}</strong></> : ''}. Abrilo para activar tu cuenta y después volvé a iniciar sesión.
      </p>
      <Link to="/login" className="inline-block mt-6 bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-3 rounded-xl transition-colors">
        Ir a iniciar sesión
      </Link>
    </div>
  )
}
