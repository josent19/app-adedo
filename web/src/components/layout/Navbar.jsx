import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import Avatar from '../ui/Avatar'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/')
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-slate-600 hover:text-slate-900'}`

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🚗</span>
          <span className="font-bold text-xl text-slate-900">A Dedo</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/search" className={linkClass}>Buscar viaje</NavLink>
          {user && (
            <>
              <NavLink to="/trips/new" className={linkClass}>Ofrecer viaje</NavLink>
              <NavLink to="/my-trips" className={linkClass}>Mis viajes</NavLink>
              <NavLink to="/my-bookings" className={linkClass}>Mis reservas</NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile">
                <Avatar name={user.user_metadata?.full_name || user.email} size="sm" />
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Ingresar
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
