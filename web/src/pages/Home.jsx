import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ origin: '', destination: '', date: '' })

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (form.origin) params.set('from', form.origin)
    if (form.destination) params.set('to', form.destination)
    if (form.date) params.set('date', form.date)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-500 to-brand-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold mb-4">Compartí el viaje,<br />dividí el gasto</h1>
          <p className="text-brand-100 text-lg mb-10 max-w-xl mx-auto">
            Encontrá un lugar en el auto de alguien que ya va a donde vos querés ir.
          </p>

          {/* Search box */}
          <form
            onSubmit={handleSearch}
            className="bg-white rounded-2xl shadow-xl p-4 max-w-3xl mx-auto flex flex-col md:flex-row gap-3"
          >
            <input
              name="origin"
              type="text"
              value={form.origin}
              onChange={handleChange}
              placeholder="¿Desde dónde salís?"
              className="flex-1 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              name="destination"
              type="text"
              value={form.destination}
              onChange={handleChange}
              placeholder="¿A dónde vas?"
              className="flex-1 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-3 rounded-lg text-sm transition-colors whitespace-nowrap"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">¿Cómo funciona?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '🔍', title: 'Buscás tu viaje', desc: 'Ingresá origen, destino y fecha. Te mostramos los viajes disponibles.' },
            { icon: '🤝', title: 'Reservás un lugar', desc: 'Elegís el viaje que más te conviene y reservás tu asiento.' },
            { icon: '🚗', title: 'Viajás y dividís', desc: 'El conductor ya iba para ese lado. Vos pagás menos, él cubre gastos.' },
          ].map(step => (
            <div key={step.title} className="text-center p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="text-5xl mb-4">{step.icon}</div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Tenés auto y vas a algún lado?</h2>
          <p className="text-slate-400 mb-8">Ofrecé lugares en tu viaje y compartí los gastos de nafta y peajes.</p>
          <a
            href="/trips/new"
            className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-medium px-8 py-3 rounded-lg transition-colors"
          >
            Publicar un viaje
          </a>
        </div>
      </section>
    </div>
  )
}
