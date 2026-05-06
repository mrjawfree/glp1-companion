import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import InjectionDayBanner from './InjectionDayBanner'

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? '#2C3E55' : '#8995A8'
  switch (name) {
    case 'home':
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke={color} strokeWidth="1.5" fill={active ? color : 'none'} strokeLinejoin="round"/></svg>
    case 'meals':
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/><path d="M8 9C8 9 10 13 12 13C14 13 16 9 16 9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>
    case 'progress':
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><polyline points="4,18 8,12 12,14 16,8 20,10" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'profile':
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5"/><path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>
    default:
      return null
  }
}

export default function Layout() {
  const [fabOpen, setFabOpen] = useState(false)
  const navigate = useNavigate()

  const fabActions = [
    { label: 'Log food', path: '/food' },
    { label: 'Log dose', path: '/doses' },
    { label: 'Log weight', path: '/progress' },
    { label: 'Log feeling', path: '/doses?checkin=true' },
  ]

  return (
    <div className="min-h-screen bg-warm-white">
      <InjectionDayBanner />
      <div className="max-w-lg mx-auto pb-20">
        <Outlet />
      </div>

      {fabOpen && (
        <div className="fixed inset-0 bg-slate-900/20 z-40" onClick={() => setFabOpen(false)} aria-hidden="true" />
      )}

      {fabOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3 items-end">
          {fabActions.map((action) => (
            <button
              key={action.label}
              onClick={() => { setFabOpen(false); navigate(action.path) }}
              className="flex items-center gap-3 bg-white shadow-elevation-2 rounded-pill px-4 py-3 text-body-md text-slate-700 hover:shadow-elevation-3 transition-shadow"
            >
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30" aria-label="Main navigation">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 relative">
          <NavLink to="/" end className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>
            {({ isActive }) => <><TabIcon name="home" active={isActive} /><span className="text-[11px] font-medium">Home</span></>}
          </NavLink>
          <NavLink to="/meals" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>
            {({ isActive }) => <><TabIcon name="meals" active={isActive} /><span className="text-[11px] font-medium">Meals</span></>}
          </NavLink>

          <button
            onClick={() => setFabOpen(!fabOpen)}
            aria-label={fabOpen ? 'Close quick actions menu' : 'Open quick actions menu'}
            aria-expanded={fabOpen}
            className="w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center -mt-6 shadow-elevation-2 hover:bg-slate-900 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <NavLink to="/progress" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>
            {({ isActive }) => <><TabIcon name="progress" active={isActive} /><span className="text-[11px] font-medium">Progress</span></>}
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>
            {({ isActive }) => <><TabIcon name="profile" active={isActive} /><span className="text-[11px] font-medium">Profile</span></>}
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
