export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} A Dedo — Compartí el viaje
      </div>
    </footer>
  )
}
