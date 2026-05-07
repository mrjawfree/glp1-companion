export const NOTIFICATION_KEYS = [
  'dose_reminder',
  'dose_prep',
  'dose_missed',
  'refill_reminder',
  'injection_site',
  'side_effect_checkin',
  'hydration_nudge',
  'protein_reminder',
  'meal_log',
  'weight_checkin',
  'weekly_summary',
  'milestone',
  'comeback',
] as const

export type NotificationKey = (typeof NOTIFICATION_KEYS)[number]

export type NotificationCategory = 'medication' | 'wellness' | 'logging' | 'progress'

export const NOTIFICATION_CATEGORIES: Record<NotificationCategory, { label: string; keys: NotificationKey[] }> = {
  medication: {
    label: 'Medication',
    keys: ['dose_reminder', 'dose_prep', 'dose_missed', 'refill_reminder'],
  },
  wellness: {
    label: 'Wellness',
    keys: ['side_effect_checkin', 'hydration_nudge', 'protein_reminder'],
  },
  logging: {
    label: 'Logging',
    keys: ['meal_log', 'weight_checkin'],
  },
  progress: {
    label: 'Progress',
    keys: ['weekly_summary', 'milestone', 'comeback'],
  },
}

export const CRITICAL_KEYS: NotificationKey[] = ['dose_reminder', 'refill_reminder', 'dose_missed']

export interface NotificationPreference {
  enabled: boolean
  schedule?: {
    weekday?: 0 | 1 | 2 | 3 | 4 | 5 | 6
    time?: string
    interval_hours?: number
    window_start?: string
    window_end?: string
    threshold_days?: number
  }
}

export interface NotificationSettings {
  permission_state: 'default' | 'granted' | 'denied'
  quiet_hours: {
    enabled: boolean
    from: string
    to: string
    allow_medical_override: boolean
  }
  preferences: Record<NotificationKey, NotificationPreference>
  deferred_until?: string | null
  last_delivered_at?: string | null
  updated_at: string
}

export interface NotificationPayload {
  key: NotificationKey
  category: NotificationCategory
  title: string
  body: string
  icon: string
  badge: string
  tag: string
  data: {
    deeplink: string
    notificationId: string
    contextId?: string
  }
  actions?: Array<{
    action: string
    title: string
  }>
  silent?: boolean
  requireInteraction?: boolean
}

export const NOTIFICATION_TYPE_META: Record<
  NotificationKey,
  {
    label: string
    description: string
    category: NotificationCategory
    editable: boolean
    defaultEnabled: boolean
    conditionalSummary?: string
  }
> = {
  dose_reminder: {
    label: 'Weekly Dose Reminder',
    description: 'Reminds you to take your scheduled injection',
    category: 'medication',
    editable: true,
    defaultEnabled: true,
  },
  dose_prep: {
    label: 'Day-Before Heads-Up',
    description: '24h advance notice to prep your pen',
    category: 'medication',
    editable: false,
    defaultEnabled: true,
  },
  dose_missed: {
    label: 'Missed Dose Check-In',
    description: 'Follow-up if no dose logged after scheduled time',
    category: 'medication',
    editable: false,
    defaultEnabled: true,
    conditionalSummary: '4h after scheduled time',
  },
  refill_reminder: {
    label: 'Prescription Refill',
    description: 'Heads-up when supply is running low',
    category: 'medication',
    editable: true,
    defaultEnabled: true,
    conditionalSummary: 'When ~7 days of supply left',
  },
  injection_site: {
    label: 'Site Rotation Tip',
    description: 'Delivered inline at dose time',
    category: 'medication',
    editable: false,
    defaultEnabled: true,
  },
  side_effect_checkin: {
    label: 'Day-After Check-In',
    description: 'Quick check-in after your dose',
    category: 'wellness',
    editable: true,
    defaultEnabled: true,
  },
  hydration_nudge: {
    label: 'Hydration Nudges',
    description: 'Gentle water reminders throughout the day',
    category: 'wellness',
    editable: true,
    defaultEnabled: true,
  },
  protein_reminder: {
    label: 'Protein Goal Check',
    description: 'Afternoon nudge if behind on protein',
    category: 'wellness',
    editable: true,
    defaultEnabled: false,
    conditionalSummary: '4:00 PM if behind',
  },
  meal_log: {
    label: 'Meal Log Reminders',
    description: 'Prompts to log meals at your set windows',
    category: 'logging',
    editable: true,
    defaultEnabled: true,
  },
  weight_checkin: {
    label: 'Weekly Weigh-In',
    description: 'Reminder to log your weight',
    category: 'logging',
    editable: true,
    defaultEnabled: true,
  },
  weekly_summary: {
    label: 'Weekly Recap',
    description: 'Sunday evening summary of your week',
    category: 'progress',
    editable: false,
    defaultEnabled: true,
  },
  milestone: {
    label: 'Milestones',
    description: 'Celebrate when you hit goals',
    category: 'progress',
    editable: false,
    defaultEnabled: true,
  },
  comeback: {
    label: '"We Miss You" Nudges',
    description: 'Gentle re-engagement after inactivity',
    category: 'progress',
    editable: false,
    defaultEnabled: false,
  },
}

export const DEFAULT_PREFERENCES: Record<NotificationKey, NotificationPreference> = {
  dose_reminder: { enabled: true, schedule: { weekday: 0, time: '09:00' } },
  dose_prep: { enabled: true },
  dose_missed: { enabled: true },
  refill_reminder: { enabled: true, schedule: { threshold_days: 7 } },
  injection_site: { enabled: true },
  side_effect_checkin: { enabled: true, schedule: { time: '11:00' } },
  hydration_nudge: { enabled: true, schedule: { interval_hours: 3, window_start: '10:00', window_end: '19:00' } },
  protein_reminder: { enabled: false, schedule: { time: '16:00' } },
  meal_log: { enabled: true },
  weight_checkin: { enabled: true, schedule: { weekday: 6, time: '08:00' } },
  weekly_summary: { enabled: true },
  milestone: { enabled: true },
  comeback: { enabled: false },
}
