import { supabase } from './supabase'

export async function logNotificationEvent(
  userId: string,
  notificationKey: string,
  eventType: 'send' | 'delivered' | 'opened' | 'action' | 'dismissed',
  extra?: { actionTaken?: string; scheduleId?: string; metadata?: Record<string, unknown> },
) {
  const now = new Date().toISOString()

  await supabase.from('notification_events').insert({
    user_id: userId,
    notification_key: notificationKey,
    event_type: eventType,
    ...(eventType === 'send' ? { sent_at: now } : {}),
    ...(eventType === 'delivered' ? { delivered_at: now } : {}),
    ...(eventType === 'opened' || eventType === 'action' ? { opened_at: now } : {}),
    ...(extra?.actionTaken ? { action_taken: extra.actionTaken } : {}),
    ...(extra?.scheduleId ? { schedule_id: extra.scheduleId } : {}),
    ...(extra?.metadata ? { metadata: extra.metadata } : {}),
  })
}
