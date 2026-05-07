import { useNavigate } from 'react-router-dom'

export default function Success() {
  const navigate = useNavigate()

  const handleGoToDashboard = () => {
    localStorage.removeItem('glp1_onboarding_route')
    navigate('/', { replace: true })
  }

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
      <h1 className="text-display-lg text-slate-900 mb-3">You're all set!</h1>
      <p className="text-body-lg text-slate-500 mb-4 max-w-sm">
        Your profile is saved and your dashboard is ready.
      </p>
      <div className="w-full max-w-sm bg-white border-2 border-slate-200 rounded-md p-4 mb-8 text-left">
        <h2 className="text-label text-slate-500 uppercase mb-3">What to expect next</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-body-sm text-green-600 font-semibold">1</span>
            </div>
            <span className="text-body-md text-slate-700">Log doses and meals to build your history</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-body-sm text-green-600 font-semibold">2</span>
            </div>
            <span className="text-body-md text-slate-700">Check Progress to see trends over time</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-body-sm text-green-600 font-semibold">3</span>
            </div>
            <span className="text-body-md text-slate-700">Adjust your settings any time as your treatment changes</span>
          </li>
        </ul>
      </div>
      <button
        onClick={handleGoToDashboard}
        className="w-full max-w-sm bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors"
      >
        Go to dashboard
      </button>
    </div>
  )
}
