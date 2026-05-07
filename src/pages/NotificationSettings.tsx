import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { useNotificationSettings } from '../hooks/useNotificationSettings'
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPE_META,
  CRITICAL_KEYS,
  type NotificationKey,
  type NotificationCategory,
  type NotificationPreference,
} from '../types/notifications'
import Sheet from '../components/Sheet'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
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

function PermissionBanner({
  state,
  onEnable,
}: {
  state: 'default' | 'granted' | 'denied'
  onEnable: () => void
}) {
  if (state === 'granted') return null

  if (state === 'denied') {
    return (
      <div className="bg-slate-100 rounded-2xl p-4 mb-4">
        <p className="text-body-sm font-semibold text-slate-700 mb-1">Notifications are blocked</p>
        <p className="text-body-sm text-slate-500">
          To turn these on, you'll need to update your browser settings.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center justify-between">
      <p className="text-body-sm text-amber-700">Reminders are off.</p>
      <button
        onClick={onEnable}
        className="text-body-sm font-semibold text-amber-700 underline"
      >
        Turn on
      </button>
    </div>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-neutral-500 px-4 pb-2">{title}</p>
      <div className="rounded-2xl bg-white divide-y divide-neutral-100">{children}</div>
    </div>
  )
}

function NotificationToggleRow({
  label,
  summary,
  enabled,
  onToggle,
  onEdit,
  disabled,
  critical,
}: {
  notificationKey?: NotificationKey
  label: string
  summary: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
  onEdit?: () => void
  disabled?: boolean
  critical?: boolean
}) {
  const showWarning = critical && !enabled

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-body-md font-medium text-slate-900">{label}</p>
        <p className={`text-body-sm ${showWarning ? 'text-amber-600' : 'text-neutral-500'}`}>
          {!enabled && showWarning ? 'Off · We recommend keeping this on' : summary}
        </p>
      </div>
      {onEdit && enabled && (
        <button
          onClick={onEdit}
          className="text-body-sm text-slate-500 hover:text-slate-700"
          aria-label={`Edit ${label}`}
        >
          Edit
        </button>
      )}
      <Toggle
        checked={enabled}
        onChange={onToggle}
        disabled={disabled}
        label={label}
      />
    </div>
  )
}

function QuietHoursControl({
  enabled,
  from,
  to,
  allowMedical,
  onChange,
}: {
  enabled: boolean
  from: string
  to: string
  allowMedical: boolean
  onChange: (v: { enabled?: boolean; from?: string; to?: string; allowMedical?: boolean }) => void
}) {
  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-neutral-500 px-4 pb-2">Quiet hours</p>
      <div className="rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-body-md font-medium text-slate-900">Don't disturb me</span>
          <Toggle
            checked={enabled}
            onChange={(v) => onChange({ enabled: v })}
            label="Quiet hours"
          />
        </div>
        {enabled && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <label className="text-body-sm text-slate-500">From</label>
              <input
                type="time"
                value={from}
                onChange={(e) => onChange({ from: e.target.value })}
                className="border border-slate-200 rounded-md px-3 py-2 text-body-sm bg-white"
              />
              <label className="text-body-sm text-slate-500">To</label>
              <input
                type="time"
                value={to}
                onChange={(e) => onChange({ to: e.target.value })}
                className="border border-slate-200 rounded-md px-3 py-2 text-body-sm bg-white"
              />
            </div>
            <label className="flex items-center gap-2 text-body-sm text-slate-700">
              <input
                type="checkbox"
                checked={allowMedical}
                onChange={(e) => onChange({ allowMedical: e.target.checked })}
                className="rounded"
              />
              Allow medication reminders during quiet hours
            </label>
          </>
        )}
      </div>
    </div>
  )
}

function getSummary(key: NotificationKey, pref: NotificationPreference): string {
  if (!pref.enabled) return 'Off'
  const meta = NOTIFICATION_TYPE_META[key]
  const sched = pref.schedule

  if (sched?.weekday !== undefined && sched?.time) {
    return `${WEEKDAY_LABELS[sched.weekday]}s · ${formatTime(sched.time)}`
  }
  if (sched?.interval_hours && sched?.window_start && sched?.window_end) {
    return `Every ${sched.interval_hours}h between ${sched.window_start}–${sched.window_end}`
  }
  if (sched?.threshold_days) {
    return `When ~${sched.threshold_days} days of supply left`
  }
  if (sched?.time) {
    const day = sched.weekday !== undefined ? `${WEEKDAY_LABELS[sched.weekday]} · ` : ''
    return `${day}${formatTime(sched.time)}`
  }
  if (meta.conditionalSummary) return meta.conditionalSummary
  return 'On'
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

function EditDoseReminderSheet({
  pref,
  onSave,
  onClose,
}: {
  pref: NotificationPreference
  onSave: (s: NotificationPreference['schedule']) => void
  onClose: () => void
}) {
  const [weekday, setWeekday] = useState(pref.schedule?.weekday ?? 0)
  const [time, setTime] = useState(pref.schedule?.time ?? '09:00')

  return (
    <Sheet onClose={onClose} title="Weekly Dose Reminder">
      <div className="space-y-4 p-4">
        <div>
          <p className="text-label text-slate-500 uppercase mb-2">Day</p>
          <div className="flex gap-2 flex-wrap">
            {WEEKDAY_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => setWeekday(i as 0 | 1 | 2 | 3 | 4 | 5 | 6)}
                className={`px-3 py-2 rounded-md text-body-sm ${
                  weekday === i ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-label text-slate-500 uppercase mb-2">Time</p>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-md text-label">
            Cancel
          </button>
          <button
            onClick={() => { onSave({ weekday, time }); onClose() }}
            className="flex-1 py-3 bg-slate-700 text-white rounded-md text-label"
          >
            Save
          </button>
        </div>
      </div>
    </Sheet>
  )
}

function EditHydrationSheet({
  pref,
  onSave,
  onClose,
}: {
  pref: NotificationPreference
  onSave: (s: NotificationPreference['schedule']) => void
  onClose: () => void
}) {
  const [interval, setInterval] = useState(pref.schedule?.interval_hours ?? 3)
  const [start, setStart] = useState(pref.schedule?.window_start ?? '10:00')
  const [end, setEnd] = useState(pref.schedule?.window_end ?? '19:00')

  return (
    <Sheet onClose={onClose} title="Hydration Nudges">
      <div className="space-y-4 p-4">
        <div>
          <p className="text-label text-slate-500 uppercase mb-2">Interval (hours)</p>
          <input
            type="range"
            min={1}
            max={6}
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-body-sm text-slate-500 text-center">Every {interval}h</p>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-label text-slate-500 uppercase mb-2">Start</p>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-md px-3 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
          </div>
          <div className="flex-1">
            <p className="text-label text-slate-500 uppercase mb-2">End</p>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-md px-3 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-md text-label">Cancel</button>
          <button onClick={() => { onSave({ interval_hours: interval, window_start: start, window_end: end }); onClose() }}
            className="flex-1 py-3 bg-slate-700 text-white rounded-md text-label">Save</button>
        </div>
      </div>
    </Sheet>
  )
}

function EditRefillSheet({
  pref,
  onSave,
  onClose,
}: {
  pref: NotificationPreference
  onSave: (s: NotificationPreference['schedule']) => void
  onClose: () => void
}) {
  const [days, setDays] = useState(pref.schedule?.threshold_days ?? 7)

  return (
    <Sheet onClose={onClose} title="Refill Reminder">
      <div className="space-y-4 p-4">
        <div>
          <p className="text-label text-slate-500 uppercase mb-2">Alert when supply drops below</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setDays(Math.max(3, days - 1))}
              className="w-10 h-10 rounded-md bg-slate-100 text-slate-700 text-lg font-bold">-</button>
            <span className="text-title-lg text-slate-900 w-16 text-center">{days} days</span>
            <button onClick={() => setDays(Math.min(14, days + 1))}
              className="w-10 h-10 rounded-md bg-slate-100 text-slate-700 text-lg font-bold">+</button>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-md text-label">Cancel</button>
          <button onClick={() => { onSave({ threshold_days: days }); onClose() }}
            className="flex-1 py-3 bg-slate-700 text-white rounded-md text-label">Save</button>
        </div>
      </div>
    </Sheet>
  )
}

function EditWeekdayTimeSheet({
  title,
  pref,
  onSave,
  onClose,
}: {
  title: string
  pref: NotificationPreference
  onSave: (s: NotificationPreference['schedule']) => void
  onClose: () => void
}) {
  const [weekday, setWeekday] = useState(pref.schedule?.weekday ?? 6)
  const [time, setTime] = useState(pref.schedule?.time ?? '08:00')

  return (
    <Sheet onClose={onClose} title={title}>
      <div className="space-y-4 p-4">
        <div>
          <p className="text-label text-slate-500 uppercase mb-2">Day</p>
          <div className="flex gap-2 flex-wrap">
            {WEEKDAY_LABELS.map((label, i) => (
              <button key={i} onClick={() => setWeekday(i as 0 | 1 | 2 | 3 | 4 | 5 | 6)}
                className={`px-3 py-2 rounded-md text-body-sm ${weekday === i ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-label text-slate-500 uppercase mb-2">Time</p>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
            className="border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-md text-label">Cancel</button>
          <button onClick={() => { onSave({ weekday, time }); onClose() }}
            className="flex-1 py-3 bg-slate-700 text-white rounded-md text-label">Save</button>
        </div>
      </div>
    </Sheet>
  )
}

function EditMealLogSheet({
  pref,
  onSave,
  onClose,
}: {
  pref: NotificationPreference
  onSave: (s: NotificationPreference['schedule']) => void
  onClose: () => void
}) {
  const [time, setTime] = useState(pref.schedule?.time ?? '09:00')

  return (
    <Sheet onClose={onClose} title="Meal Log Reminders">
      <div className="space-y-4 p-4">
        <p className="text-body-sm text-slate-500">Set your preferred meal reminder time.</p>
        <div>
          <p className="text-label text-slate-500 uppercase mb-2">Reminder time</p>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
            className="border-2 border-slate-200 rounded-md px-4 py-3 text-body-lg bg-white focus:border-slate-700 focus:outline-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-md text-label">Cancel</button>
          <button onClick={() => { onSave({ time }); onClose() }}
            className="flex-1 py-3 bg-slate-700 text-white rounded-md text-label">Save</button>
        </div>
      </div>
    </Sheet>
  )
}

const EDIT_SHEETS: Partial<Record<NotificationKey, string>> = {
  dose_reminder: 'dose_reminder',
  hydration_nudge: 'hydration_nudge',
  refill_reminder: 'refill_reminder',
  weight_checkin: 'weight_checkin',
  side_effect_checkin: 'side_effect_checkin',
  meal_log: 'meal_log',
}

export default function NotificationSettings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const push = usePushNotifications(user?.id)
  const ns = useNotificationSettings(user?.id)
  const [editingKey, setEditingKey] = useState<NotificationKey | null>(null)

  const permState = push.permissionState === 'denied'
    ? 'denied'
    : push.permissionState === 'granted'
      ? 'granted'
      : 'default'

  const handleEnable = async () => {
    const success = await push.subscribe()
    if (success) {
      await ns.save({ permission_state: 'granted' })
    }
  }

  const isDisabled = permState !== 'granted'

  const handleToggle = async (key: NotificationKey, enabled: boolean) => {
    await ns.togglePreference(key, enabled)
  }

  const handleEditSave = async (key: NotificationKey, schedule: NotificationPreference['schedule']) => {
    await ns.updatePreferenceSchedule(key, schedule)
  }

  if (ns.loading) {
    return (
      <div className="px-4 pt-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-32" />
          <div className="h-20 bg-slate-100 rounded-2xl" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-5 pb-8">
      <button
        onClick={() => navigate('/settings')}
        className="flex items-center gap-2 text-slate-500 mb-4"
        aria-label="Back to settings"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Notifications
      </button>

      <PermissionBanner state={permState} onEnable={handleEnable} />

      <QuietHoursControl
        enabled={ns.settings.quiet_hours.enabled}
        from={ns.settings.quiet_hours.from}
        to={ns.settings.quiet_hours.to}
        allowMedical={ns.settings.quiet_hours.allow_medical_override}
        onChange={(v) =>
          ns.save({
            quiet_hours: {
              ...ns.settings.quiet_hours,
              ...(v.enabled !== undefined ? { enabled: v.enabled } : {}),
              ...(v.from !== undefined ? { from: v.from } : {}),
              ...(v.to !== undefined ? { to: v.to } : {}),
              ...(v.allowMedical !== undefined ? { allow_medical_override: v.allowMedical } : {}),
            },
          })
        }
      />

      {(Object.keys(NOTIFICATION_CATEGORIES) as NotificationCategory[]).map((cat) => {
        const { label, keys } = NOTIFICATION_CATEGORIES[cat]
        const visibleKeys = keys.filter((k) => k !== 'injection_site')

        return (
          <SettingsSection key={cat} title={label}>
            {visibleKeys.map((key) => {
              const meta = NOTIFICATION_TYPE_META[key]
              const pref = ns.settings.preferences[key]
              return (
                <NotificationToggleRow
                  key={key}
                  notificationKey={key}
                  label={meta.label}
                  summary={getSummary(key, pref)}
                  enabled={pref.enabled}
                  onToggle={(v) => handleToggle(key, v)}
                  onEdit={meta.editable && EDIT_SHEETS[key] ? () => setEditingKey(key) : undefined}
                  disabled={isDisabled}
                  critical={CRITICAL_KEYS.includes(key)}
                />
              )
            })}
          </SettingsSection>
        )
      })}

      <div className="mt-4 text-center">
        <button
          onClick={async () => {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
            const { data: { session } } = await (await import('../lib/supabase')).supabase.auth.getSession()
            if (!session) return
            await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ test: true }),
            })
          }}
          className="text-body-sm text-slate-500 underline"
        >
          Send a test notification
        </button>
        {ns.settings.last_delivered_at && (
          <p className="text-body-sm text-slate-400 mt-2">
            Last delivered: {new Date(ns.settings.last_delivered_at).toLocaleString()}
          </p>
        )}
      </div>

      {editingKey === 'dose_reminder' && (
        <EditDoseReminderSheet
          pref={ns.settings.preferences.dose_reminder}
          onSave={(s) => handleEditSave('dose_reminder', s)}
          onClose={() => setEditingKey(null)}
        />
      )}
      {editingKey === 'hydration_nudge' && (
        <EditHydrationSheet
          pref={ns.settings.preferences.hydration_nudge}
          onSave={(s) => handleEditSave('hydration_nudge', s)}
          onClose={() => setEditingKey(null)}
        />
      )}
      {editingKey === 'refill_reminder' && (
        <EditRefillSheet
          pref={ns.settings.preferences.refill_reminder}
          onSave={(s) => handleEditSave('refill_reminder', s)}
          onClose={() => setEditingKey(null)}
        />
      )}
      {editingKey === 'weight_checkin' && (
        <EditWeekdayTimeSheet
          title="Weekly Weigh-In"
          pref={ns.settings.preferences.weight_checkin}
          onSave={(s) => handleEditSave('weight_checkin', s)}
          onClose={() => setEditingKey(null)}
        />
      )}
      {editingKey === 'side_effect_checkin' && (
        <EditWeekdayTimeSheet
          title="Day-After Check-In"
          pref={ns.settings.preferences.side_effect_checkin}
          onSave={(s) => handleEditSave('side_effect_checkin', s)}
          onClose={() => setEditingKey(null)}
        />
      )}
      {editingKey === 'meal_log' && (
        <EditMealLogSheet
          pref={ns.settings.preferences.meal_log}
          onSave={(s) => handleEditSave('meal_log', s)}
          onClose={() => setEditingKey(null)}
        />
      )}
    </div>
  )
}
