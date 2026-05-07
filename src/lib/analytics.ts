type EventName =
  | 'progress_view'
  | 'weekly_summary_open'
  | 'weekly_summary_close'
  | 'milestone_unlock_view'
  | 'milestone_share'
  | 'mood_selected'

type EventProperties = Record<string, string | number | boolean | null>

export function trackEvent(name: EventName, properties?: EventProperties) {
  if (import.meta.env.DEV) {
    console.debug('[analytics]', name, properties)
  }
  if (typeof window !== 'undefined' && 'plausible' in window) {
    ;(window as { plausible: (name: string, opts?: { props: EventProperties }) => void }).plausible(
      name,
      properties ? { props: properties } : undefined,
    )
  }
}
