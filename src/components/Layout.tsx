import { Link, Outlet, useLocation } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()

  const linkClass = (path: string) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      location.pathname === path
        ? 'bg-brand-500 text-white'
        : 'text-white/70 hover:text-white hover:bg-white/10'
    }`

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">
            🎬 AI Video Studio
          </Link>
          <nav className="flex gap-2">
            <Link to="/" className={linkClass('/')}>
              Projets
            </Link>
            <Link to="/settings" className={linkClass('/settings')}>
              Réglages
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
