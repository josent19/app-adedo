const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

const colors = [
  'bg-orange-400', 'bg-sky-400', 'bg-violet-400',
  'bg-emerald-400', 'bg-rose-400', 'bg-amber-400',
]

function getColor(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + hash
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Avatar({ name, src, size = 'md' }) {
  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
  }
  return (
    <div className={`${sizes[size]} ${getColor(name)} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}>
      {getInitials(name)}
    </div>
  )
}
