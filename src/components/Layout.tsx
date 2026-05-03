import { Outlet, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/doses', label: 'Doses', icon: '💉' },
  { to: '/meals', label: 'Meals', icon: '🍽️' },
  { to: '/food', label: 'Log', icon: '📝' },
  { to: '/progress', label: 'Progress', icon: '📊' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-primary-700">GLP-1 Companion</h1>
      </header>
      <main className="max-w-lg mx-auto p-4">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center text-xs ${isActive ? 'text-primary-600' : 'text-gray-500'}`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
