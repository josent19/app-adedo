export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-slate-400">
        Desarrollado por{' '}
        <a
          href="https://astech.com.ar/"
          target="_blank"
          rel="noreferrer"
          className="text-brand-600 hover:underline"
        >
          ASTech
        </a>
        {' '}· A Dedo v0.2.0
      </div>
    </footer>
  )
}
