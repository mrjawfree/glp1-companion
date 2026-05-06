import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export default function InjectionDayBanner() {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!user) return
    const today = DAY_NAMES[new Date().getDay()]

    supabase
      .from('user_settings')
      .select('injection_day, injection_days, notification_enabled')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (!data || !data.notification_enabled) return
        const isInjectionDay =
          data.injection_day === today ||
          (data.injection_days ?? []).includes(new Date().getDay())
        setVisible(isInjectionDay)
      })
  }, [user])

  if (!visible || dismissed) return null

  return (
    <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2C6.13 2 3 5.13 3 9V14L1.5 15.5V17H18.5V15.5L17 14V9C17 5.13 13.87 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7.5 17V17.5C7.5 18.88 8.62 20 10 20C11.38 20 12.5 18.88 12.5 17.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-body-sm font-medium">Today is injection day — don't forget your dose!</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-white/80 hover:text-white ml-2"
        aria-label="Dismiss reminder"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
