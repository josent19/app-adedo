const styles = {
  active:    'bg-green-100 text-green-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  completed: 'bg-slate-100 text-slate-600',
}

const labels = {
  active:    'Activo',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
}

export default function Badge({ status, className = '' }) {
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${styles[status] || 'bg-slate-100 text-slate-600'} ${className}`}>
      {labels[status] || status}
    </span>
  )
}
