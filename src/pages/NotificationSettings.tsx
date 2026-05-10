import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { supabase } from '../lib/supabase'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

interface NotificationSettingsData {
  permission_state: string
  quiet_hours_enabled: boolean
  quiet_hours_from: string
  quiet_hours_to: string
  quiet_hours_allow_medical: boolean
  dose_reminder_enabled: boolean
  dose_reminder_weekday: number
  dose_reminder_time: string
  dose_prep_enabled: boolean
  dose_missed_enabled: boolean
  refill_reminder_enabled: boolean
  refill_threshold_days: number
  side_effect_checkin_enabled: boolean
  hydration_nudge_enabled: boolean
  hydration_interval_hours: number
  hydration_window_start: string
  hydration_window_end: string
  protein_reminder_enabled: boolean
  meal_log_enabled: boolean
  meal_log_breakfast_time: string
  meal_log_lunch_time: string
  meal_log_dinner_time: string
  weight_checkin_enabled: boolean
  weight_checkin_weekday: number
  weight_checkin_time: string
  weekly_summary_enabled: boolean
  milestone_enabled: boolean
  comeback_enabled: boolean
  last_delivered_at: string | null
}

const DEFAULTS: NotificationSettingsData = {
  permission_state: 'default',
  quiet_hours_enabled: false,
  quiet_hours_from: '21:30',
  quiet_hours_to: '07:00',
  quiet_hours_allow_medical: true,
  dose_reminder_enabled: true,
  dose_reminder_weekday: 0,
  dose_reminder_time: '09:00',
  dose_prep_enabled: true,
  dose_missed_enabled: true,
  refill_reminder_enabled: true,
  refill_threshold_days: 7,
  side_effect_checkin_enabled: true,
  hydration_nudge_enabled: true,
  hydration_interval_hours: 3,
  hydration_window_start: '10:00',
  hydration_window_end: '19:00',
  protein_reminder_enabled: false,
  meal_log_enabled: true,
  meal_log_breakfast_time: '09:00',
  meal_log_lunch_time: '13:30',
  meal_log_dinner_time: '19:30',
  weight_checkin_enabled: true,
  weight_checkin_weekday: 6,
  weight_checkin_time: '08:00',
  weekly_summary_enabled: true,
  milestone_enabled: true,
  comeback_enabled: false,
  last_delivered_at: null,
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${
        checked ? 'bg-green-600' : 'bg-slate-200'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-elevation-1 transition-transform ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-sm font-medium text-neutral-500 px-4 pb-2">{title}</p>
      <div className="rounded-2xl bg-white divide-y divide-neutral-100 shadow-elevation-1">
        {children}
      </div>
    </div>
  )
}

function NotifRow({
  label,
  summary,
  enabled,
  onToggle,
  onEdit,
  critical,
  disabled,
}: {
  label: string
  summary: string
  enabled: boolean
  onToggle: () => void
  onEdit?: () => void
  critical?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex-1 mr-3">
        <p className="text-body-md font-medium text-slate-900">{label}</p>
        <p className={`text-body-sm ${!enabled && critical ? 'text-amber-500' : 'text-slate-400'}`}>
          {!enabled && critical ? 'Off · We recommend keeping this on' : summary}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {onEdit && enabled && (
          <button
            onClick={onEdit}
            className="text-body-sm text-slate-400 hover:text-slate-600"
            aria-label={`Edit ${label}`}
          >
            Edit
          </button>
        )}
        <Toggle checked={enabled} onChange={onToggle} disabled={disabled} label={label} />
      </div>
    </div>
  )
}

type EditTarget =
  | 'dose_reminder'
  | 'hydration_nudge'
  | 'meal_log'
  | 'refill_reminder'
  | 'weight_checkin'
  | 'side_effect_checkin'
  | null

function EditSheet({
  target,
  settings,
  onChange,
  onClose,
}: {
  target: EditTarget
  settings: NotificationSettingsData
  onChange: (patch: Partial<NotificationSettingsData>) => void
  onClose: () => void
}) {
  if (!target) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full max-w-lg p-5 pb-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

        {target === 'dose_reminder' && (
          <>
            <h3 className="text-title-md text-slate-900 mb-4">Dose Reminder</h3>
            <div className="space-y-4">
              <div>
                <label className="text-label text-slate-500 uppercase mb-2 block">Day</label>
                <div className="flex gap-1.5">
                  {WEEKDAYS.map((day, i) => (
                    <button
                      key={day}
                      onClick={() => onChange({ dose_reminder_weekday: i })}
                      className={`flex-1 py-2 rounded-md text-body-sm transition-colors ${
                        settings.dose_reminder_weekday === i
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="dose-time" className="text-label text-slate-500 uppercase mb-2 block">Time</label>
                <input
                  id="dose-time"
                  type="time"
                  value={settings.dose_reminder_time}
                  onChange={(e) => onChange({ dose_reminder_time: e.target.value })}
                  className="border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
                />
              </div>
            </div>
          </>
        )}

        {target === 'hydration_nudge' && (
          <>
            <h3 className="text-title-md text-slate-900 mb-4">Hydration Nudges</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="hydration-interval" className="text-label text-slate-500 uppercase mb-2 block">
                  Interval (hours)
                </label>
                <input
                  id="hydration-interval"
                  type="range"
                  min={1}
                  max={6}
                  value={settings.hydration_interval_hours}
                  onChange={(e) => onChange({ hydration_interval_hours: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-body-sm text-slate-500 mt-1">Every {settings.hydration_interval_hours}h</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label htmlFor="hydration-start" className="text-label text-slate-500 uppercase mb-2 block">Start</label>
                  <input
                    id="hydration-start"
                    type="time"
                    value={settings.hydration_window_start}
                    onChange={(e) => onChange({ hydration_window_start: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="hydration-end" className="text-label text-slate-500 uppercase mb-2 block">End</label>
                  <input
                    id="hydration-end"
                    type="time"
                    value={settings.hydration_window_end}
                    onChange={(e) => onChange({ hydration_window_end: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {target === 'meal_log' && (
          <>
            <h3 className="text-title-md text-slate-900 mb-4">Meal Log Reminders</h3>
            <div className="space-y-4">
              {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => {
                const key = `meal_log_${meal}_time` as keyof NotificationSettingsData
                return (
                  <div key={meal} className="flex items-center justify-between">
                    <label htmlFor={`meal-${meal}`} className="text-body-md text-slate-700 capitalize">
                      {meal}
                    </label>
                    <input
                      id={`meal-${meal}`}
                      type="time"
                      value={settings[key] as string}
                      onChange={(e) => onChange({ [key]: e.target.value })}
                      className="border-2 border-slate-200 rounded-md px-3 py-2 text-body-md bg-white focus:border-slate-700 focus:outline-none"
                    />
                  </div>
                )
              })}
            </div>
          </>
        )}

        {target === 'refill_reminder' && (
          <>
            <h3 className="text-title-md text-slate-900 mb-4">Refill Reminder</h3>
            <div>
              <label htmlFor="refill-days" className="text-label text-slate-500 uppercase mb-2 block">
                Alert when supply drops below (days)
              </label>
              <input
                id="refill-days"
                type="range"
                min={3}
                max={14}
                value={settings.refill_threshold_days}
                onChange={(e) => onChange({ refill_threshold_days: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-body-sm text-slate-500 mt-1">~{settings.refill_threshold_days} days</p>
            </div>
          </>
        )}

        {target === 'weight_checkin' && (
          <>
            <h3 className="text-title-md text-slate-900 mb-4">Weekly Weigh-In</h3>
            <div className="space-y-4">
              <div>
                <label className="text-label text-slate-500 uppercase mb-2 block">Day</label>
                <div className="flex gap-1.5">
                  {WEEKDAYS.map((day, i) => (
                    <button
                      key={day}
                      onClick={() => onChange({ weight_checkin_weekday: i })}
                      className={`flex-1 py-2 rounded-md text-body-sm transition-colors ${
                        settings.weight_checkin_weekday === i
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="weight-time" className="text-label text-slate-500 uppercase mb-2 block">Time</label>
                <input
                  id="weight-time"
                  type="time"
                  value={settings.weight_checkin_time}
                  onChange={(e) => onChange({ weight_checkin_time: e.target.value })}
                  className="border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
                />
              </div>
            </div>
          </>
        )}

        {target === 'side_effect_checkin' && (
          <>
            <h3 className="text-title-md text-slate-900 mb-4">Day-After Check-In</h3>
            <p className="text-body-md text-slate-500">
              Sent 24h after each dose at 11:00 AM local time. Timing adjusts automatically based on your dose schedule.
            </p>
          </>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-md text-label font-medium hover:bg-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NotificationSettings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const push = usePushNotifications(user?.id)
  const [settings, setSettings] = useState<NotificationSettingsData>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editTarget, setEditTarget] = useState<EditTarget>(null)
  const [testSending, setTestSending] = useState(false)

  const permDenied = push.permissionState === 'denied'
  const permDefault = push.permissionState === 'prompt' || push.permissionState === 'unsupported'
  const noSubscription = !push.subscription

  useEffect(() => {
    if (!user) return
    supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setSettings({ ...DEFAULTS, ...data })
        }
        setLoading(false)
      })
  }, [user])

  const saveSettings = useCallback(
    async (patch: Partial<NotificationSettingsData>) => {
      if (!user) return
      const updated = { ...settings, ...patch, updated_at: new Date().toISOString() }
      setSettings(updated)
      setSaving(true)

      const { updated_at: _u, last_delivered_at: _l, ...payload } = updated as any
      await supabase.from('notification_settings').upsert(
        { ...payload, user_id: user.id, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      setSaving(false)
    },
    [user, settings]
  )

  const toggleField = (key: keyof NotificationSettingsData) => {
    const newVal = !settings[key]
    saveSettings({ [key]: newVal })
  }

  const handleEnableNotifications = async () => {
    const success = await push.subscribe()
    if (success) {
      saveSettings({ permission_state: 'granted' })
    }
  }

  const handleTestSend = async () => {
    if (!push.subscription) return
    setTestSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'test' }),
        })
      }
    } finally {
      setTestSending(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-32" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="h-60 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-5 pb-8">
      <button
        onClick={() => navigate('/settings')}
        className="flex items-center gap-2 text-slate-500 mb-6"
        aria-label="Back to settings"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </button>

      <h1 className="text-title-lg text-slate-900 mb-1">Notifications</h1>
      <p className="text-body-md text-slate-500 mb-5">Choose which reminders you'd like to receive.</p>

      {permDenied && (
        <div className="bg-slate-100 rounded-2xl p-4 mb-5">
          <p className="text-body-md font-medium text-slate-700 mb-1">Notifications are blocked</p>
          <p className="text-body-sm text-slate-500 mb-2">
            To turn these on, you'll need to update your browser settings.
          </p>
          <button className="text-body-sm text-info font-medium">Show me how →</button>
        </div>
      )}

      {permDefault && !permDenied && (
        <button
          onClick={handleEnableNotifications}
          disabled={push.loading}
          className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-left"
        >
          <p className="text-body-md font-medium text-amber-700">Reminders are off</p>
          <p className="text-body-sm text-amber-600">Tap to turn on dose reminders, meal logs, and more.</p>
        </button>
      )}

      <SettingsSection title="Quiet hours">
        <div className="px-4 py-3.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-body-md font-medium text-slate-900">Don't disturb me</span>
            <Toggle
              checked={settings.quiet_hours_enabled}
              onChange={() => toggleField('quiet_hours_enabled')}
              label="Quiet hours"
            />
          </div>
          {settings.quiet_hours_enabled && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label htmlFor="qh-from" className="text-label text-slate-500 uppercase mb-1 block">From</label>
                  <input
                    id="qh-from"
                    type="time"
                    value={settings.quiet_hours_from}
                    onChange={(e) => saveSettings({ quiet_hours_from: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-md px-3 py-2 text-body-md bg-white focus:border-slate-700 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="qh-to" className="text-label text-slate-500 uppercase mb-1 block">To</label>
                  <input
                    id="qh-to"
                    type="time"
                    value={settings.quiet_hours_to}
                    onChange={(e) => saveSettings({ quiet_hours_to: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-md px-3 py-2 text-body-md bg-white focus:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.quiet_hours_allow_medical}
                  onChange={() => toggleField('quiet_hours_allow_medical')}
                  className="mt-1 rounded border-slate-300"
                />
                <span className="text-body-sm text-slate-600">
                  Allow medication reminders during quiet hours
                </span>
              </label>
            </div>
          )}
        </div>
      </SettingsSection>

      <SettingsSection title="Medication">
        <NotifRow
          label="Weekly dose reminder"
          summary={`${WEEKDAYS[settings.dose_reminder_weekday]}s · ${settings.dose_reminder_time}`}
          enabled={settings.dose_reminder_enabled}
          onToggle={() => toggleField('dose_reminder_enabled')}
          onEdit={() => setEditTarget('dose_reminder')}
          critical
          disabled={noSubscription}
        />
        <NotifRow
          label="Day-before heads-up"
          summary={`${WEEKDAYS[(settings.dose_reminder_weekday + 6) % 7]} · ${settings.dose_reminder_time}`}
          enabled={settings.dose_prep_enabled}
          onToggle={() => toggleField('dose_prep_enabled')}
          disabled={noSubscription}
        />
        <NotifRow
          label="Missed dose check-in"
          summary="4h after scheduled time"
          enabled={settings.dose_missed_enabled}
          onToggle={() => toggleField('dose_missed_enabled')}
          critical
          disabled={noSubscription}
        />
        <NotifRow
          label="Refill reminder"
          summary={`When ~${settings.refill_threshold_days} days of supply left`}
          enabled={settings.refill_reminder_enabled}
          onToggle={() => toggleField('refill_reminder_enabled')}
          onEdit={() => setEditTarget('refill_reminder')}
          critical
          disabled={noSubscription}
        />
      </SettingsSection>

      <SettingsSection title="Wellness">
        <NotifRow
          label="Day-after check-in"
          summary={`${WEEKDAYS[(settings.dose_reminder_weekday + 1) % 7]} · 11:00 AM`}
          enabled={settings.side_effect_checkin_enabled}
          onToggle={() => toggleField('side_effect_checkin_enabled')}
          onEdit={() => setEditTarget('side_effect_checkin')}
          disabled={noSubscription}
        />
        <NotifRow
          label="Hydration nudges"
          summary={`Every ${settings.hydration_interval_hours}h between ${settings.hydration_window_start}–${settings.hydration_window_end}`}
          enabled={settings.hydration_nudge_enabled}
          onToggle={() => toggleField('hydration_nudge_enabled')}
          onEdit={() => setEditTarget('hydration_nudge')}
          disabled={noSubscription}
        />
        <NotifRow
          label="Protein goal check"
          summary="4:00 PM if behind"
          enabled={settings.protein_reminder_enabled}
          onToggle={() => toggleField('protein_reminder_enabled')}
          disabled={noSubscription}
        />
      </SettingsSection>

      <SettingsSection title="Logging">
        <NotifRow
          label="Meal log reminders"
          summary="Breakfast, lunch, dinner"
          enabled={settings.meal_log_enabled}
          onToggle={() => toggleField('meal_log_enabled')}
          onEdit={() => setEditTarget('meal_log')}
          disabled={noSubscription}
        />
        <NotifRow
          label="Weekly weigh-in"
          summary={`${WEEKDAYS[settings.weight_checkin_weekday]} · ${settings.weight_checkin_time}`}
          enabled={settings.weight_checkin_enabled}
          onToggle={() => toggleField('weight_checkin_enabled')}
          onEdit={() => setEditTarget('weight_checkin')}
          disabled={noSubscription}
        />
      </SettingsSection>

      <SettingsSection title="Progress">
        <NotifRow
          label="Weekly recap"
          summary="Sun · 6:00 PM"
          enabled={settings.weekly_summary_enabled}
          onToggle={() => toggleField('weekly_summary_enabled')}
          disabled={noSubscription}
        />
        <NotifRow
          label="Milestones"
          summary="When you hit a goal"
          enabled={settings.milestone_enabled}
          onToggle={() => toggleField('milestone_enabled')}
          disabled={noSubscription}
        />
        <NotifRow
          label='"We miss you" nudges'
          summary="After 5+ days of inactivity"
          enabled={settings.comeback_enabled}
          onToggle={() => toggleField('comeback_enabled')}
          disabled={noSubscription}
        />
      </SettingsSection>

      <div className="mt-2 space-y-3">
        <button
          onClick={handleTestSend}
          disabled={noSubscription || testSending}
          className="w-full text-center text-info text-body-md py-2 disabled:opacity-40"
        >
          {testSending ? 'Sending...' : 'Send a test notification'}
        </button>

        {settings.last_delivered_at && (
          <p className="text-body-sm text-slate-400 text-center">
            Last delivered: {new Date(settings.last_delivered_at).toLocaleString()}
          </p>
        )}
      </div>

      {saving && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-body-sm px-4 py-2 rounded-full shadow-elevation-2">
          Saving...
        </div>
      )}

      <EditSheet
        target={editTarget}
        settings={settings}
        onChange={(patch) => {
          setSettings((prev) => ({ ...prev, ...patch }))
        }}
        onClose={() => {
          saveSettings(settings)
          setEditTarget(null)
        }}
      />
    </div>
  )
}
