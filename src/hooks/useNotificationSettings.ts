import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type {
  NotificationKey,
  NotificationSettings,
  NotificationPreference,
} from '../types/notifications'
import { DEFAULT_PREFERENCES } from '../types/notifications'

const EMPTY_SETTINGS: NotificationSettings = {
  permission_state: 'default',
  quiet_hours: {
    enabled: false,
    from: '21:30',
    to: '07:00',
    allow_medical_override: true,
  },
  preferences: { ...DEFAULT_PREFERENCES },
  deferred_until: null,
  last_delivered_at: null,
  updated_at: new Date().toISOString(),
}

export function useNotificationSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<NotificationSettings>(EMPTY_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (data) {
      setSettings({
        permission_state: data.permission_state ?? 'default',
        quiet_hours: {
          enabled: data.quiet_hours_enabled ?? false,
          from: data.quiet_hours_from ?? '21:30',
          to: data.quiet_hours_to ?? '07:00',
          allow_medical_override: data.quiet_hours_allow_medical ?? true,
        },
        preferences: {
          ...DEFAULT_PREFERENCES,
          ...(data.preferences as Record<NotificationKey, NotificationPreference>),
        },
        deferred_until: data.deferred_until,
        last_delivered_at: data.last_delivered_at,
        updated_at: data.updated_at,
      })
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(
    async (patch: Partial<NotificationSettings>) => {
      if (!userId) return
      setSaving(true)
      const merged = { ...settings, ...patch }
      setSettings(merged)

      const row = {
        user_id: userId,
        permission_state: merged.permission_state,
        quiet_hours_enabled: merged.quiet_hours.enabled,
        quiet_hours_from: merged.quiet_hours.from,
        quiet_hours_to: merged.quiet_hours.to,
        quiet_hours_allow_medical: merged.quiet_hours.allow_medical_override,
        preferences: merged.preferences,
        deferred_until: merged.deferred_until ?? null,
        last_delivered_at: merged.last_delivered_at ?? null,
        updated_at: new Date().toISOString(),
      }

      await supabase.from('notification_settings').upsert(row, { onConflict: 'user_id' })
      setSaving(false)
    },
    [userId, settings]
  )

  const togglePreference = useCallback(
    async (key: NotificationKey, enabled: boolean) => {
      const updated = {
        ...settings.preferences,
        [key]: { ...settings.preferences[key], enabled },
      }
      await save({ preferences: updated })
    },
    [settings, save]
  )

  const updatePreferenceSchedule = useCallback(
    async (key: NotificationKey, schedule: NotificationPreference['schedule']) => {
      const updated = {
        ...settings.preferences,
        [key]: { ...settings.preferences[key], schedule },
      }
      await save({ preferences: updated })
    },
    [settings, save]
  )

  return { settings, loading, saving, save, togglePreference, updatePreferenceSchedule, reload: load }
}
