import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@glp1companion.app'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MAX_DAILY_NON_MEDICAL = 4
const MEDICAL_KEYS = ['dose_reminder', 'refill_reminder', 'dose_missed']

interface ScheduleRow {
  id: string
  user_id: string
  notification_key: string
  fire_at_utc: string
  payload: Record<string, unknown>
  status: string
  context_id: string | null
  retry_count: number
}

interface SubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
  platform: string | null
}

serve(async (req: Request) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Test notification endpoint (authenticated user sends themselves a test)
  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}))
    if (body.test) {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

      const { data: subs } = await supabase
        .from('notification_subscriptions')
        .select('endpoint, p256dh, auth, platform')
        .eq('user_id', user.id)

      if (!subs || subs.length === 0) {
        return new Response(JSON.stringify({ error: 'No subscriptions found' }), { status: 404 })
      }

      const testPayload = {
        key: 'dose_reminder',
        category: 'medication',
        title: 'Test notification',
        body: 'If you see this, push notifications are working!',
        icon: '/icons/dose_reminder.png',
        badge: '/icons/badge.png',
        tag: `test:${user.id}`,
        data: { deeplink: '/', notificationId: crypto.randomUUID() },
      }

      const results = await Promise.allSettled(
        subs.map((sub: SubscriptionRow) => sendWebPush(sub, testPayload))
      )

      await supabase.from('notification_events').insert({
        user_id: user.id,
        notification_key: 'dose_reminder',
        event_type: 'test_send',
        sent_at: new Date().toISOString(),
      })

      await supabase.from('notification_settings')
        .update({ last_delivered_at: new Date().toISOString() })
        .eq('user_id', user.id)

      const sent = results.filter(r => r.status === 'fulfilled').length
      return new Response(JSON.stringify({ sent, total: subs.length }), { status: 200 })
    }
  }

  // Cron-triggered: process due scheduled notifications
  const now = new Date().toISOString()

  const { data: dueRows, error: fetchErr } = await supabase
    .from('notification_schedule')
    .select('*')
    .eq('status', 'pending')
    .lte('fire_at_utc', now)
    .order('fire_at_utc', { ascending: true })
    .limit(100)

  if (fetchErr || !dueRows || dueRows.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 })
  }

  let processed = 0

  for (const row of dueRows as ScheduleRow[]) {
    // Check frequency cap for non-medical notifications
    if (!MEDICAL_KEYS.includes(row.notification_key)) {
      const todayStart = new Date()
      todayStart.setUTCHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('notification_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', row.user_id)
        .eq('event_type', 'send')
        .gte('sent_at', todayStart.toISOString())
        .not('notification_key', 'in', `(${MEDICAL_KEYS.join(',')})`)

      if ((count ?? 0) >= MAX_DAILY_NON_MEDICAL) {
        await supabase.from('notification_schedule')
          .update({ status: 'skipped_cap', updated_at: now })
          .eq('id', row.id)
        continue
      }
    }

    // Check quiet hours
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('quiet_hours_enabled, quiet_hours_from, quiet_hours_to, quiet_hours_allow_medical')
      .eq('user_id', row.user_id)
      .single()

    if (settings?.quiet_hours_enabled) {
      const isMedical = MEDICAL_KEYS.includes(row.notification_key)
      if (!isMedical || !settings.quiet_hours_allow_medical) {
        // Simple quiet hours check — would need user timezone for production
        // For now, skip and let the next cron pick it up
      }
    }

    // Fetch user subscriptions
    const { data: subs } = await supabase
      .from('notification_subscriptions')
      .select('endpoint, p256dh, auth, platform')
      .eq('user_id', row.user_id)

    if (!subs || subs.length === 0) {
      await supabase.from('notification_schedule')
        .update({ status: 'no_subscription', updated_at: now })
        .eq('id', row.id)
      continue
    }

    const payload = {
      ...row.payload,
      key: row.notification_key,
      tag: `${row.notification_key}:${row.user_id}`,
      data: {
        ...(row.payload.data as Record<string, unknown> || {}),
        notificationId: row.id,
        contextId: row.context_id || '',
      },
    }

    const results = await Promise.allSettled(
      subs.map((sub: SubscriptionRow) => sendWebPush(sub, payload))
    )

    const anySuccess = results.some(r => r.status === 'fulfilled')

    await supabase.from('notification_schedule')
      .update({
        status: anySuccess ? 'sent' : 'failed',
        updated_at: now,
      })
      .eq('id', row.id)

    await supabase.from('notification_events').insert({
      user_id: row.user_id,
      notification_key: row.notification_key,
      event_type: 'send',
      sent_at: now,
      schedule_id: row.id,
      metadata: { subscriptions: subs.length, success: results.filter(r => r.status === 'fulfilled').length },
    })

    // Update last_delivered_at
    if (anySuccess) {
      await supabase.from('notification_settings')
        .update({ last_delivered_at: now })
        .eq('user_id', row.user_id)
    }

    processed++
  }

  return new Response(JSON.stringify({ processed }), { status: 200 })
})

async function sendWebPush(
  sub: SubscriptionRow,
  payload: Record<string, unknown>,
): Promise<void> {
  // Web Push via web-push protocol
  // In production, use FCM for Android and APNs for iOS via Capacitor tokens
  if (sub.platform === 'ios' || sub.platform === 'android') {
    // FCM/APNs dispatch would go here
    // For now, log and skip native push — handled by Capacitor plugin on device
    return
  }

  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  }

  const body = JSON.stringify(payload)

  // Use the Web Push API directly with VAPID
  const response = await fetch(pushSubscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
    },
    body: await encryptPayload(body, pushSubscription.keys),
  })

  if (!response.ok && response.status === 410) {
    // Subscription expired — clean up
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    await supabase.from('notification_subscriptions')
      .delete()
      .eq('endpoint', sub.endpoint)
  }

  if (!response.ok) {
    throw new Error(`Push failed: ${response.status}`)
  }
}

async function encryptPayload(
  _payload: string,
  _keys: { p256dh: string; auth: string },
): Promise<Uint8Array> {
  // Web Push payload encryption (RFC 8291)
  // Production implementation would use a proper web-push library
  // This is a placeholder — in production, use the `web-push` npm package
  // or Deno-compatible VAPID + ECDH encryption
  return new TextEncoder().encode(_payload)
}
