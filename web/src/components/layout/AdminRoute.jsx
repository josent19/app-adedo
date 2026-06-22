import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getProfile } from '../../hooks/useProfile'

export default function AdminRoute({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    getProfile(user.id).then(setProfile).finally(() => setLoading(false))
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
