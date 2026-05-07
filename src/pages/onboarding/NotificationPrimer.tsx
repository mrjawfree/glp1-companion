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
    navigate('/onboarding/first-meal')
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
          </svg>
        </div>
        <h1 className="text-display-lg text-slate-900 mb-3">Stay on track with reminders</h1>
        <p className="text-body-lg text-slate-500 mb-4 max-w-sm">
          We'll send a gentle nudge on injection days and when it's time to log meals. You can change this any time in Settings.
        </p>
        {denied && (
          <div className="w-full max-w-sm bg-amber-100 border border-amber-500 rounded-md p-3 mb-4" role="alert">
            <p className="text-body-sm text-amber-500">
              Notifications were blocked by your browser. You can enable them later in your device settings, then turn them on in the app's Settings page.
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto space-y-3">
        {denied ? (
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
              {loading ? 'Setting up...' : 'Enable notifications'}
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
