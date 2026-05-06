import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { supabase } from '../lib/supabase'
import { SettingsSkeleton } from '../components/Skeleton'

interface UserProfile {
  display_name: string
  medication: string
  subscription_tier: string
}

interface UserSettings {
  medication_name: string | null
  medication_dose: string | null
  injection_day: string | null
  notification_enabled: boolean
  goal_weight_lbs: number | null
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

export default function Settings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const push = usePushNotifications(user?.id)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifSettings, setShowNotifSettings] = useState(false)
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual')
  const [saving, setSaving] = useState(false)

  const [medName, setMedName] = useState('')
  const [medDose, setMedDose] = useState('')
  const [injDay, setInjDay] = useState('')
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [goalWeight, setGoalWeight] = useState('')

  const [reminderTime, setReminderTime] = useState('08:00')
  const [weeklyCheckin, setWeeklyCheckin] = useState(true)

  useEffect(() => {
    if (user) {
      const profileP = supabase.from('users').select('display_name, medication, subscription_tier').eq('id', user.id).single().then(({ data }) => {
        if (data) setProfile(data)
      })
      const settingsP = loadSettings()
      Promise.all([profileP, settingsP]).finally(() => setLoading(false))
    }
  }, [user])

  async function loadSettings() {
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user!.id)
      .single()
    if (data) {
      setSettings(data)
      setMedName(data.medication_name || '')
      setMedDose(data.medication_dose || '')
      setInjDay(data.injection_day || '')
      setNotifEnabled(data.notification_enabled)
      setGoalWeight(data.goal_weight_lbs ? String(data.goal_weight_lbs) : '')
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      user_id: user!.id,
      medication_name: medName || null,
      medication_dose: medDose || null,
      injection_day: injDay || null,
      notification_enabled: notifEnabled,
      goal_weight_lbs: goalWeight ? parseFloat(goalWeight) : null,
      updated_at: new Date().toISOString(),
    }
    if (settings) {
      await supabase.from('user_settings').update(payload).eq('user_id', user!.id)
    } else {
      await supabase.from('user_settings').insert(payload)
    }
    await loadSettings()
    setSaving(false)
    setShowSettings(false)
  }

  const handleToggleNotifications = async () => {
    if (push.subscription) {
      await push.unsubscribe()
      setNotifEnabled(false)
    } else {
      const success = await push.subscribe()
      if (success) setNotifEnabled(true)
    }
    await loadSettings()
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/onboarding')
  }

  if (loading) return <SettingsSkeleton />

  if (showUpgrade) {
    return (
      <div className="px-4 pt-5">
        <button onClick={() => setShowUpgrade(false)} className="flex items-center gap-2 text-slate-500 mb-6" aria-label="Back to profile">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>

        <h1 className="text-display-lg text-slate-900 mb-2">More from your GLP-1 Companion.</h1>
        <p className="text-body-lg text-slate-500 mb-6">Unlock deeper insights and unlimited features.</p>

        <div className="space-y-4 mb-6">
          {[
            { title: 'Unlimited meal plans', desc: 'Save as many weekly plans as you need' },
            { title: 'Provider-ready exports', desc: 'Share progress PDFs with your doctor' },
            { title: 'Photo food logging', desc: 'Snap a photo instead of searching' },
            { title: 'Side-effect insights', desc: 'See correlations between doses and how you feel' },
            { title: 'Custom macro goals', desc: 'Personalized protein, fiber, and calorie targets' },
          ].map(b => (
            <div key={b.title} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="#4A7C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <p className="text-body-md font-semibold text-slate-900">{b.title}</p>
                <p className="text-body-sm text-slate-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 bg-slate-100 rounded-md p-1 mb-6" role="radiogroup" aria-label="Billing period">
          <button onClick={() => setPlan('monthly')}
            role="radio" aria-checked={plan === 'monthly'}
            className={`flex-1 py-3 rounded-md text-center transition-colors ${
              plan === 'monthly' ? 'bg-white text-slate-700 shadow-elevation-1' : 'text-slate-400'
            }`}>
            <p className="text-body-md font-semibold">Monthly</p>
            <p className="text-body-sm text-slate-500">$9.99/mo</p>
          </button>
          <button onClick={() => setPlan('annual')}
            role="radio" aria-checked={plan === 'annual'}
            className={`flex-1 py-3 rounded-md text-center transition-colors relative ${
              plan === 'annual' ? 'bg-white text-slate-700 shadow-elevation-1' : 'text-slate-400'
            }`}>
            <p className="text-body-md font-semibold">Annual</p>
            <p className="text-body-sm text-slate-500">$59.99/yr</p>
            <span className="absolute -top-2 right-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-pill font-medium">Save 50%</span>
          </button>
        </div>

        <button className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors mb-3">
          Start 7-day free trial
        </button>
        <p className="text-body-sm text-slate-400 text-center mb-3">Cancel any time in Settings · No charge during trial</p>
        <button className="w-full text-center text-info text-body-sm">Restore purchase</button>

        <div className="mt-6 flex justify-center gap-4 text-body-sm text-slate-400">
          <button className="hover:underline">Terms of Service</button>
          <button className="hover:underline">Privacy Policy</button>
        </div>
      </div>
    )
  }

  if (showSettings) {
    return (
      <div className="px-4 pt-5">
        <button onClick={() => setShowSettings(false)} className="flex items-center gap-2 text-slate-500 mb-6" aria-label="Back to profile">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>

        <h1 className="text-title-lg text-slate-900 mb-5">Medication & Goals</h1>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div>
            <label htmlFor="settings-med-name" className="text-label text-slate-500 uppercase mb-2 block">Medication name</label>
            <input id="settings-med-name" type="text" value={medName} onChange={e => setMedName(e.target.value)}
              placeholder="e.g. Ozempic"
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
          </div>

          <div>
            <label htmlFor="settings-med-dose" className="text-label text-slate-500 uppercase mb-2 block">Current dose</label>
            <input id="settings-med-dose" type="text" value={medDose} onChange={e => setMedDose(e.target.value)}
              placeholder="e.g. 0.5 mg"
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
          </div>

          <div>
            <label id="injection-day-label" className="text-label text-slate-500 uppercase mb-2 block">Injection day</label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="injection-day-label">
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => setInjDay(injDay === day ? '' : day)}
                  role="radio" aria-checked={injDay === day} aria-label={day}
                  className={`px-3 py-2 rounded-md text-body-sm capitalize transition-colors ${
                    injDay === day ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="settings-goal-weight" className="text-label text-slate-500 uppercase mb-2 block">Goal weight (lbs)</label>
            <input id="settings-goal-weight" type="number" step="0.1" value={goalWeight} onChange={e => setGoalWeight(e.target.value)}
              placeholder="150"
              className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
          </div>

          <div className="flex items-center justify-between py-3">
            <span id="dose-reminders-label" className="text-body-md text-slate-700">Dose reminders</span>
            <button type="button" onClick={() => setNotifEnabled(!notifEnabled)}
              role="switch" aria-checked={notifEnabled} aria-labelledby="dose-reminders-label"
              className={`w-12 h-7 rounded-full transition-colors relative ${
                notifEnabled ? 'bg-green-600' : 'bg-slate-200'
              }`}>
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-elevation-1 transition-transform ${
                notifEnabled ? 'left-[22px]' : 'left-0.5'
              }`} aria-hidden="true" />
            </button>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider disabled:opacity-40 hover:bg-slate-900 transition-colors">
            {saving ? 'Saving...' : 'Save preferences'}
          </button>
        </form>
      </div>
    )
  }

  if (showNotifSettings) {
    return (
      <div className="px-4 pt-5">
        <button onClick={() => setShowNotifSettings(false)} className="flex items-center gap-2 text-slate-500 mb-6" aria-label="Back to profile">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>

        <h1 className="text-title-lg text-slate-900 mb-2">Notifications</h1>
        <p className="text-body-md text-slate-500 mb-6">Choose which reminders you'd like to receive.</p>

        <div className="space-y-4">
          <div className="bg-white rounded-md shadow-elevation-1 p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-body-md font-semibold text-slate-900">Push notifications</span>
              <button
                type="button"
                onClick={handleToggleNotifications}
                disabled={push.loading}
                role="switch"
                aria-checked={!!push.subscription}
                aria-label="Push notifications"
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  push.subscription ? 'bg-green-600' : 'bg-slate-200'
                } ${push.loading ? 'opacity-40' : ''}`}
              >
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-elevation-1 transition-transform ${
                  push.subscription ? 'left-[22px]' : 'left-0.5'
                }`} aria-hidden="true" />
              </button>
            </div>
            <p className="text-body-sm text-slate-400">
              {push.permissionState === 'denied'
                ? 'Blocked by browser — enable in browser settings'
                : push.subscription
                  ? 'Receiving push notifications on this device'
                  : 'Off — enable to get reminders'}
            </p>
          </div>

          <div className={`bg-white rounded-md shadow-elevation-1 p-5 ${!push.subscription ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-body-md font-semibold text-slate-900">Injection day reminder</p>
                <p className="text-body-sm text-slate-400">Get a nudge on your scheduled injection days</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifEnabled(!notifEnabled)}
                role="switch"
                aria-checked={notifEnabled}
                aria-label="Injection day reminder"
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  notifEnabled ? 'bg-green-600' : 'bg-slate-200'
                }`}
              >
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-elevation-1 transition-transform ${
                  notifEnabled ? 'left-[22px]' : 'left-0.5'
                }`} aria-hidden="true" />
              </button>
            </div>

            {notifEnabled && (
              <div>
                <label htmlFor="reminder-time" className="text-label text-slate-500 uppercase mb-2 block">Reminder time</label>
                <input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  className="border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className={`bg-white rounded-md shadow-elevation-1 p-5 ${!push.subscription ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-md font-semibold text-slate-900">Weekly progress check-in</p>
                <p className="text-body-sm text-slate-400">A weekly reminder to log your weight and how you feel</p>
              </div>
              <button
                type="button"
                onClick={() => setWeeklyCheckin(!weeklyCheckin)}
                role="switch"
                aria-checked={weeklyCheckin}
                aria-label="Weekly progress check-in"
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  weeklyCheckin ? 'bg-green-600' : 'bg-slate-200'
                }`}
              >
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-elevation-1 transition-transform ${
                  weeklyCheckin ? 'left-[22px]' : 'left-0.5'
                }`} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {push.permissionState === 'denied' && (
          <div className="mt-6 bg-rose-50 rounded-md p-4">
            <p className="text-body-sm text-rose-600">
              Notifications are blocked by your browser. To re-enable, open your browser's site settings and allow notifications for this site.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pt-5">
      <h1 className="text-title-lg text-slate-900 mb-5">Profile</h1>

      <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-title-lg font-semibold">
            {(profile?.display_name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-body-lg font-semibold text-slate-900">{profile?.display_name || 'User'}</p>
            <p className="text-body-sm text-slate-400">{user?.email}</p>
            {profile?.medication && (
              <p className="text-body-sm text-green-600 capitalize mt-1">{profile.medication}</p>
            )}
          </div>
        </div>
      </div>

      {!settings?.medication_name && !settings?.goal_weight_lbs ? (
        <div className="bg-white rounded-md shadow-elevation-1 p-6 mb-4 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.89 20.1 3 19 3Z" stroke="#4A7C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V16M8 12H16" stroke="#4A7C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-body-lg font-semibold text-slate-900 mb-1">Set up your medication & goals</p>
          <p className="text-body-sm text-slate-400 mb-4">Add your GLP-1 medication details and weight goal to get personalized tracking and reminders.</p>
          <button onClick={() => setShowSettings(true)}
            className="px-5 py-3 bg-slate-700 text-white text-label rounded-md hover:bg-slate-900 transition-colors">
            Configure now
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-md font-semibold text-slate-900">Medication & Goals</p>
              <p className="text-body-sm text-slate-400">
                {settings?.medication_name
                  ? `${settings.medication_name}${settings.medication_dose ? ` · ${settings.medication_dose}` : ''}`
                  : 'Not configured'}
              </p>
              {settings?.goal_weight_lbs && (
                <p className="text-body-sm text-green-600 mt-1">Goal: {settings.goal_weight_lbs} lbs</p>
              )}
            </div>
            <button onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-label rounded-md hover:bg-slate-200 transition-colors">
              Edit
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body-md font-semibold text-slate-900">Notifications</p>
            <p className="text-body-sm text-slate-400">
              {push.subscription ? 'Push notifications enabled' : 'Not configured'}
            </p>
          </div>
          <button onClick={() => setShowNotifSettings(true)}
            className="px-4 py-2 bg-slate-100 text-slate-700 text-label rounded-md hover:bg-slate-200 transition-colors">
            {push.subscription ? 'Manage' : 'Set up'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body-md font-semibold text-slate-900">Subscription</p>
            <p className="text-body-sm text-slate-400">
              {profile?.subscription_tier === 'pro' ? 'Pro plan' : 'Free tier'}
            </p>
          </div>
          {profile?.subscription_tier !== 'pro' && (
            <button onClick={() => setShowUpgrade(true)}
              className="px-4 py-2 bg-slate-700 text-white text-label rounded-md hover:bg-slate-900 transition-colors">
              Upgrade
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-4">
        <p className="text-body-md font-semibold text-slate-900 mb-3">Quick links</p>
        <div className="space-y-3">
          <button onClick={() => navigate('/onboarding/drug')} className="w-full text-left text-body-md text-info">
            Update medication
          </button>
          <button onClick={() => navigate('/onboarding/goals')} className="w-full text-left text-body-md text-info">
            Change goals
          </button>
        </div>
      </div>

      <button onClick={handleSignOut}
        className="w-full py-4 bg-white border-2 border-slate-200 text-rose-500 rounded-md text-label font-medium hover:border-rose-500 transition-colors">
        Sign out
      </button>

      <p className="text-body-sm text-slate-400 text-center mt-6">
        GLP-1 Companion v0.1 · Not medical advice
      </p>
    </div>
  )
}
