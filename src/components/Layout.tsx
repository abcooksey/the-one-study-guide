import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isSession = location.pathname === '/session';

  return (
    <div className="min-h-screen flex flex-col">
      {!isSession && (
        <header className="bg-forest-700 text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full border-2 border-brass-400 flex items-center justify-center aspect-square">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-brass-300 aspect-square" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-serif font-bold tracking-wide truncate">
                    The One Study Guide
                  </h1>
                  <p className="text-xs text-forest-200 hidden sm:block">
                    Lord of the Rings Film Trivia
                  </p>
                </div>
              </Link>

              <nav className="flex items-center space-x-1 sm:space-x-4">
                <NavLink to="/" current={location.pathname === '/'}>
                  Home
                </NavLink>
                <NavLink
                  to="/library"
                  current={location.pathname.startsWith('/library')}
                >
                  Library
                </NavLink>
                <NavLink
                  to="/add"
                  current={location.pathname === '/add'}
                >
                  Add Card
                </NavLink>
              </nav>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">
        {children}
      </main>

      {!isSession && (
        <footer className="bg-charcoal-900 text-parchment-300 py-6 mt-auto">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm">
            <p>
              A personal trivia application for Peter Jackson's Lord of the Rings trilogy
            </p>
            <p className="mt-1 text-parchment-400 text-xs">
              Not affiliated with Middle-earth Enterprises or Warner Bros.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

interface NavLinkProps {
  to: string;
  current: boolean;
  children: ReactNode;
}

function NavLink({ to, current, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        current
          ? 'bg-forest-600 text-white'
          : 'text-forest-100 hover:bg-forest-600 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}
