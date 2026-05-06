import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../../hooks/useOnboarding'

export default function Success() {
  const navigate = useNavigate()
  const { reset } = useOnboarding()
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const handleGoToDashboard = useCallback(() => {
    clearTimeout(timerRef.current)
    localStorage.removeItem('glp1_onboarding_route')
    reset()
    navigate('/', { replace: true })
  }, [navigate, reset])

  useEffect(() => {
    timerRef.current = setTimeout(handleGoToDashboard, 1800)
    return () => clearTimeout(timerRef.current)
  }, [handleGoToDashboard])

  return (
    <div className="min-h-screen bg-warm-white flex flex-col items-center justify-center px-4 text-center">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-8 animate-scale-in">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path
            d="M12 24L20 32L36 16"
            stroke="#4A7C5C"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="text-display-lg text-slate-900 mb-3">You're all set</h1>
      <p className="text-body-lg text-slate-500 mb-8">Your dashboard is ready.</p>
      <button
        onClick={handleGoToDashboard}
        className="w-full max-w-sm bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors"
      >
        Go to dashboard
      </button>
    </div>
  )
}
