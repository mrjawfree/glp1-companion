import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
}

type Recommendation = 'yes' | 'maybe' | 'no'

const RATING_CAPTIONS = ['', 'Sorry to hear that', 'Could be better', 'It\'s okay', 'Really good!', 'Wonderful!']
const RECOMMEND_OPTIONS: { value: Recommendation; label: string }[] = [
  { value: 'yes', label: 'Yes, definitely' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no', label: 'Not right now' },
]
const MAX_CHARS = 500
const AUTO_DISMISS_MS = 4000
const APP_VERSION = '0.1.0'

export default function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [likedMost, setLikedMost] = useState('')
  const [couldImprove, setCouldImprove] = useState('')
  const [recommend, setRecommend] = useState<Recommendation | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const thankYouHeadingRef = useRef<HTMLHeadingElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canSubmit = rating > 0 || likedMost.trim() || couldImprove.trim() || recommend !== null

  const resetForm = useCallback(() => {
    setRating(0)
    setHoveredStar(0)
    setLikedMost('')
    setCouldImprove('')
    setRecommend(null)
    setSubmitted(false)
    setError(null)
  }, [])

  const handleClose = useCallback(() => {
    if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current)
    resetForm()
    onClose()
    triggerRef.current?.focus()
  }, [onClose, resetForm])

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement
      document.documentElement.classList.add('overflow-hidden')
      requestAnimationFrame(() => closeButtonRef.current?.focus())
    } else {
      document.documentElement.classList.remove('overflow-hidden')
    }
    return () => document.documentElement.classList.remove('overflow-hidden')
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, handleClose])

  useEffect(() => {
    if (submitted) {
      thankYouHeadingRef.current?.focus()
      autoDismissTimer.current = setTimeout(handleClose, AUTO_DISMISS_MS)
      return () => { if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current) }
    }
  }, [submitted, handleClose])

  if (!open) return null

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase.from('beta_feedback').insert({
      user_id: user?.id ?? null,
      rating: rating || null,
      liked_most: likedMost.trim() || null,
      could_improve: couldImprove.trim() || null,
      would_recommend: recommend ?? 'maybe',
      app_version: APP_VERSION,
    })

    if (insertError) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
      onClick={handleClose}
      aria-hidden="true"
    >
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-50 bg-warm-white rounded-t-lg shadow-elevation-3 max-h-[85vh] flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
      >
        <div className="pt-3 pb-1 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        <div className="flex items-center justify-between px-6 pb-2">
          <div />
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            aria-label="Close"
            className="h-10 w-10 rounded-full text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-green-600 flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6 flex flex-col items-center text-center" role="status" aria-live="polite">
            <div className="h-16 w-16 rounded-full bg-green-100 text-green-600 inline-flex items-center justify-center mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 ref={thankYouHeadingRef} tabIndex={-1} className="text-title-md text-slate-900 mb-2">Thank you</h2>
            <p className="text-body-md text-slate-500 max-w-[28ch] mb-6">
              Your feedback shapes what we build next. We read every note from beta testers.
            </p>
            <button
              onClick={handleClose}
              className="w-full h-12 rounded-md bg-green-600 text-white text-body-md font-medium shadow-elevation-1 hover:bg-[#3F6B4F] active:scale-[0.99] transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6 space-y-6">
              <h2 id="feedback-title" className="text-title-lg text-slate-900">
                How is GLP-1 Companion working for you?
              </h2>

              <div>
                <div className="flex items-center justify-between px-2 py-3" role="radiogroup" aria-label="Overall rating, 1 to 5 stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      role="radio"
                      aria-checked={rating === star}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      className="h-11 w-11 rounded-md text-slate-300 hover:text-amber-500 hover:bg-slate-100 transition-colors flex items-center justify-center"
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          fill={(hoveredStar || rating) >= star ? '#C68B3C' : 'none'}
                          stroke={(hoveredStar || rating) >= star ? '#C68B3C' : 'currentColor'}
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-body-sm text-slate-500 text-center">{RATING_CAPTIONS[rating]}</p>
                )}
              </div>

              <div className="h-px bg-slate-200 mx-2" />

              <div>
                <label htmlFor="feedback-like" className="text-label text-slate-500 uppercase tracking-wider mb-2 block">
                  What do you like?
                </label>
                <textarea
                  id="feedback-like"
                  value={likedMost}
                  onChange={e => { if (e.target.value.length <= MAX_CHARS) setLikedMost(e.target.value) }}
                  placeholder="e.g., the side-effect tracker is a lifesaver"
                  rows={3}
                  className="w-full min-h-[88px] rounded-md bg-white px-4 py-3 text-body-md text-slate-900 placeholder:text-slate-400 ring-1 ring-slate-200 focus:ring-2 focus:ring-green-600 resize-none outline-none"
                />
                <p className="text-body-sm text-slate-400 text-right mt-1">{likedMost.length}/{MAX_CHARS}</p>
              </div>

              <div>
                <label htmlFor="feedback-better" className="text-label text-slate-500 uppercase tracking-wider mb-2 block">
                  What could be better?
                </label>
                <textarea
                  id="feedback-better"
                  value={couldImprove}
                  onChange={e => { if (e.target.value.length <= MAX_CHARS) setCouldImprove(e.target.value) }}
                  placeholder="e.g., I'd love reminders the night before my dose"
                  rows={3}
                  className="w-full min-h-[88px] rounded-md bg-white px-4 py-3 text-body-md text-slate-900 placeholder:text-slate-400 ring-1 ring-slate-200 focus:ring-2 focus:ring-green-600 resize-none outline-none"
                />
                <p className="text-body-sm text-slate-400 text-right mt-1">{couldImprove.length}/{MAX_CHARS}</p>
              </div>

              <div>
                <p className="text-body-md font-medium text-slate-900 mb-3">Would you recommend GLP-1 Companion?</p>
                <div className="rounded-md bg-white ring-1 ring-slate-200 divide-y divide-slate-200 overflow-hidden">
                  {RECOMMEND_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 px-4 py-3.5 text-body-md text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors ${
                        recommend === opt.value ? 'bg-green-100' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="recommend"
                        value={opt.value}
                        checked={recommend === opt.value}
                        onChange={() => setRecommend(opt.value)}
                        className="sr-only"
                      />
                      <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        recommend === opt.value ? 'border-green-600' : 'border-slate-300'
                      }`}>
                        {recommend === opt.value && <span className="h-2 w-2 rounded-full bg-green-600" />}
                      </span>
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-warm-white/95 backdrop-blur border-t border-slate-200 px-6 pt-4 pb-4">
              {error && (
                <div className="bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30 rounded-sm px-3 py-2 text-body-sm mb-3">
                  {error}
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                aria-busy={submitting}
                className="w-full h-12 rounded-md bg-green-600 text-white text-body-md font-medium shadow-elevation-1 hover:bg-[#3F6B4F] active:scale-[0.99] disabled:bg-slate-300 disabled:text-slate-500 transition-all"
              >
                {submitting ? 'Sending…' : 'Submit Feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
