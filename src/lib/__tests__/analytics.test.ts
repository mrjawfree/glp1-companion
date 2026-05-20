import { describe, it, expect, vi, beforeEach } from 'vitest'
import { trackEvent } from '../analytics'

describe('trackEvent', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    delete (window as unknown as Record<string, unknown>).plausible
  })

  it('does not log to console in non-dev mode', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    trackEvent('progress_view', { test: true })
    expect(spy).not.toHaveBeenCalled()
  })

  it('calls window.plausible when available', () => {
    const plausible = vi.fn()
    ;(window as unknown as Record<string, unknown>).plausible = plausible
    trackEvent('milestone_unlock_view', { variant: 'five_lb' })
    expect(plausible).toHaveBeenCalledWith('milestone_unlock_view', { props: { variant: 'five_lb' } })
  })

  it('does not throw when plausible is not present', () => {
    expect(() => trackEvent('weekly_summary_open')).not.toThrow()
  })
})
