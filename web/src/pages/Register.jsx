import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { onlyLetters, onlyDigits, onlyAlphanumeric, onlyPhoneChars } from '../lib/inputFilters'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  firstName: '', lastName: '', documentType: 'dni', documentNumber: '',
  phone: '', email: '', address: '', postalCode: '', birthDate: '',
  password: '', confirm: '',
}

const inputClass = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
const labelClass = 'block text-sm font-medium text-slate-700 mb-1'

function isAdult(birthDateStr) {
  const today = new Date()
  const birth = new Date(birthDateStr)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age >= 18
}

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target

    if (name === 'firstName' || name === 'lastName' || name === 'fullName') {
      setForm(f => ({ ...f, [name]: onlyLetters(value) }))
      return
    }
    if (name === 'documentNumber') {
      const filtered = form.documentType === 'dni' ? onlyDigits(value) : onlyAlphanumeric(value)
      setForm(f => ({ ...f, documentNumber: filtered }))
      return
    }
    if (name === 'documentType') {
      setForm(f => ({
        ...f,
        documentType: value,
        documentNumber: value === 'dni' ? onlyDigits(f.documentNumber) : onlyAlphanumeric(f.documentNumber),
      }))
      return
    }
    if (name === 'phone') {
      setForm(f => ({ ...f, phone: onlyPhoneChars(value) }))
      return
    }
    if (name === 'postalCode') {
      setForm(f => ({ ...f, postalCode: onlyAlphanumeric(value) }))
      return
    }

    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2) {
      toast.error('Nombre y apellido deben tener al menos 2 letras')
      return
    }
    const minDocLength = form.documentType === 'dni' ? 7 : 5
    if (form.documentNumber.trim().length < minDocLength) {
      toast.error(`Número de documento inválido (mínimo ${minDocLength} caracteres)`)
      return
    }
    if (form.phone.replace(/[^0-9]/g, '').length < 8) {
      toast.error('Ingresá un teléfono válido (mínimo 8 dígitos)')
      return
    }
    if (form.postalCode.trim().length < 3) {
      toast.error('Código postal inválido')
      return
    }
    if (form.password !== form.confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (!form.birthDate || !isAdult(form.birthDate)) {
      toast.error('Tenés que ser mayor de 18 años para registrarte')
      return
    }
    setLoading(true)
    try {
      const data = await signUp(form.email, form.password, {
        firstName: form.firstName,
        lastName: form.lastName,
        documentType: form.documentType,
        documentNumber: form.documentNumber,
        phone: form.phone,
        address: form.address,
        postalCode: form.postalCode,
        birthDate: form.birthDate,
      })
      if (data?.session) {
        toast.success('¡Cuenta creada! Ya podés usar la app.')
        navigate('/')
      } else {
        navigate('/confirm-email', { state: { email: form.email } })
      }
    } catch (err) {
      toast.error(err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-4xl">🚗</span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Crear cuenta</h1>
          <p className="mt-1 text-slate-500 text-sm">Gratis y sin tarjeta de crédito</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre</label>
              <input name="firstName" type="text" required value={form.firstName} onChange={handleChange}
                placeholder="Juan" maxLength={50} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Apellido</label>
              <input name="lastName" type="text" required value={form.lastName} onChange={handleChange}
                placeholder="Pérez" maxLength={50} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo de documento</label>
              <select name="documentType" required value={form.documentType} onChange={handleChange} className={inputClass}>
                <option value="dni">DNI</option>
                <option value="pasaporte">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Número de documento</label>
              <input name="documentNumber" type="text" required value={form.documentNumber} onChange={handleChange}
                inputMode={form.documentType === 'dni' ? 'numeric' : 'text'}
                placeholder={form.documentType === 'dni' ? '30123456' : 'AB123456'}
                maxLength={form.documentType === 'dni' ? 9 : 15} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange}
              placeholder="vos@ejemplo.com" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Teléfono</label>
              <input name="phone" type="tel" required value={form.phone} onChange={handleChange}
                inputMode="tel" placeholder="+54 9 ..." maxLength={20} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fecha de nacimiento</label>
              <input name="birthDate" type="date" required value={form.birthDate} onChange={handleChange}
                className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Dirección</label>
              <input name="address" type="text" required value={form.address} onChange={handleChange}
                placeholder="Calle 123" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Código postal</label>
              <input name="postalCode" type="text" required value={form.postalCode} onChange={handleChange}
                placeholder="1900" maxLength={10} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contraseña</label>
              <input name="password" type="password" required value={form.password} onChange={handleChange}
                placeholder="Mínimo 6 caracteres" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Confirmar contraseña</label>
              <input name="confirm" type="password" required value={form.confirm} onChange={handleChange}
                placeholder="••••••••" className={inputClass} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  )
}
