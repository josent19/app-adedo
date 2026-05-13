import { Link } from 'react-router-dom'

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-semibold text-slate-900 text-lg mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-xs mx-auto">{description}</p>
      {action && (
        <Link to={action.href} className="inline-block mt-6 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
          {action.label}
        </Link>
      )}
    </div>
  )
}
