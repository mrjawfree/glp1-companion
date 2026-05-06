import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../../hooks/useOnboarding'

export default function Welcome() {
  const navigate = useNavigate()
  const { reset } = useOnboarding()

  const handleSkip = () => {
    reset()
    localStorage.setItem('glp1_onboarding_skipped', 'true')
    localStorage.removeItem('glp1_onboarding_route')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-warm-white flex flex-col animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-48 h-48 mb-8 rounded-full bg-gradient-to-br from-slate-200 via-slate-100 to-green-100 flex items-center justify-center">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path d="M40 10C28 10 20 22 20 34C20 52 40 70 40 70C40 70 60 52 60 34C60 22 52 10 40 10Z" fill="#7FA98E" opacity="0.6"/>
            <path d="M35 20C27 24 22 34 25 44C28 54 38 58 38 58" stroke="#4A7C5C" strokeWidth="2" strokeLinecap="round"/>
            <path d="M38 58C38 58 36 48 40 38C44 28 54 24 54 24" stroke="#4A7C5C" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-display-lg text-slate-900 mb-3">
          Steady support for your GLP-1 journey.
        </h1>
        <p className="text-body-lg text-slate-500 mb-8 max-w-sm">
          Track doses, plan meals that work with your medication, and notice how you feel.
        </p>
        <button
          onClick={() => navigate('/onboarding/medication')}
          className="w-full max-w-sm bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors"
        >
          Get started
        </button>
        <button
          onClick={handleSkip}
          className="mt-4 text-slate-400 text-body-md hover:underline"
        >
          Skip for now
        </button>
        <button
          onClick={() => navigate('/login')}
          className="mt-2 text-info text-body-md hover:underline"
        >
          I already have an account
        </button>
      </div>
      <p className="text-body-sm text-slate-400 text-center px-4 pb-6">
        Not a substitute for medical advice. Always follow your prescriber.
      </p>
    </div>
  )
}
