import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import OnboardingShell from '../../components/OnboardingShell'

export default function NotificationPrimer() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { subscribe, supported, loading } = usePushNotifications(user?.id)
  const [denied, setDenied] = useState(false)
  const [granted, setGranted] = useState(false)

  const handleEnable = async () => {
    if (!supported) {
      if ('Notification' in window) {
        const result = await Notification.requestPermission()
        if (result === 'denied') {
          setDenied(true)
          return
        }
      }
      navigate('/onboarding/first-meal')
      return
    }

    const success = await subscribe()
    if (!success) {
      setDenied(true)
      return
    }
    setGranted(true)
    setTimeout(() => navigate('/onboarding/first-meal'), 1800)
  }

  return (
    <OnboardingShell
      step={2}
      totalSteps={4}
      onBack={() => navigate('/onboarding/profile-setup')}
      onSkip={() => navigate('/onboarding/first-meal')}
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M18 4C12.48 4 8 8.48 8 14V22L5 25V27H31V25L28 22V14C28 8.48 23.52 4 18 4Z" stroke="#4A7C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 27V28C14 30.21 15.79 32 18 32C20.21 32 22 30.21 22 28V27" stroke="#4A7C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="28" cy="8" r="5" fill="#4A7C5C" opacity="0.3"/>
          </svg>
        </div>

        <h1 className="text-display-lg text-slate-900 mb-3">Stay on track, gently.</h1>
        <p className="text-body-lg text-slate-500 mb-6 max-w-sm">
          Soft reminders help you stay consistent with your dose, meals, and progress check-ins. You're in charge — we'll just be here when it helps.
        </p>

        <div className="w-full max-w-sm text-left space-y-3 mb-6">
          {[
            { icon: '💉', text: 'Weekly dose reminders' },
            { icon: '🩺', text: 'Gentle check-ins after your dose' },
            { icon: '💊', text: 'Refill heads-ups before you run out' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-lg" aria-hidden="true">{item.icon}</span>
              <span className="text-body-md text-slate-700">{item.text}</span>
            </div>
          ))}
        </div>

        <p className="text-body-sm text-slate-400 max-w-sm">
          You can change what you get and when, any time in Settings.
        </p>

        {granted && (
          <div className="w-full max-w-sm bg-green-50 border border-green-200 rounded-md p-3 mt-4" role="status">
            <p className="text-body-sm text-green-700">
              You're all set — we'll keep things light and helpful.
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/settings/notifications') }}
              className="text-body-sm text-green-700 font-medium underline mt-1"
            >
              View what you'll get →
            </button>
          </div>
        )}

        {denied && (
          <div className="w-full max-w-sm bg-amber-50 border border-amber-200 rounded-md p-3 mt-4" role="alert">
            <p className="text-body-sm text-amber-700 font-medium mb-1">Missing your dose-day reminders?</p>
            <p className="text-body-sm text-amber-600">
              Open Settings → Notifications → GLP-1 Companion, then toggle Allow Notifications on.
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto space-y-3">
        {granted ? (
          <button
            onClick={() => navigate('/onboarding/first-meal')}
            className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors"
          >
            Continue
          </button>
        ) : denied ? (
          <button
            onClick={() => navigate('/onboarding/first-meal')}
            className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors"
          >
            Continue without notifications
          </button>
        ) : (
          <>
            <button
              onClick={handleEnable}
              disabled={loading}
              className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors disabled:opacity-40"
            >
              {loading ? 'Setting up...' : 'Turn on reminders'}
            </button>
            <button
              onClick={() => navigate('/onboarding/first-meal')}
              className="w-full text-center text-slate-400 text-body-md py-2"
            >
              Not now
            </button>
          </>
        )}
      </div>
    </OnboardingShell>
  )
}
