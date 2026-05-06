import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
}

type Recommendation = 'yes' | 'maybe' | 'no' | null

export default function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [likeMost, setLikeMost] = useState('')
  const [couldBeBetter, setCouldBeBetter] = useState('')
  const [recommend, setRecommend] = useState<Recommendation>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase.from('beta_feedback').insert({
      user_id: user?.id ?? null,
      rating,
      like_most: likeMost.trim() || null,
      could_be_better: couldBeBetter.trim() || null,
      would_recommend: recommend,
    })

    if (insertError) {
      setError('Failed to submit feedback. Please try again.')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  const handleClose = () => {
    setRating(0)
    setHoveredStar(0)
    setLikeMost('')
    setCouldBeBetter('')
    setRecommend(null)
    setSubmitted(false)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={handleClose}>
      <div
        className="bg-white rounded-t-lg sm:rounded-lg shadow-elevation-3 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
      >
        {submitted ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 13L9 17L19 7" stroke="#4A7C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-title-md text-slate-900 mb-2">Thank you!</h2>
            <p className="text-body-md text-slate-500 mb-6">
              Your feedback helps us build a better experience for everyone on their GLP-1 journey.
            </p>
            <button
              onClick={handleClose}
              className="w-full py-4 bg-slate-700 text-white rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 id="feedback-title" className="text-title-md text-slate-900">Send Feedback</h2>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="mb-5">
              <p className="text-label text-slate-500 uppercase mb-3">Overall rating</p>
              <div className="flex gap-2" role="radiogroup" aria-label="Rating">
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
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                        fill={(hoveredStar || rating) >= star ? '#C68B3C' : 'none'}
                        stroke={(hoveredStar || rating) >= star ? '#C68B3C' : '#C2CCD9'}
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ))}
              </div>
              {rating === 0 && error === null && (
                <p className="text-body-sm text-slate-400 mt-1">Tap a star to rate your experience</p>
              )}
            </div>

            <div className="mb-5">
              <label htmlFor="feedback-like" className="text-label text-slate-500 uppercase mb-2 block">
                What do you like most?
              </label>
              <textarea
                id="feedback-like"
                value={likeMost}
                onChange={e => setLikeMost(e.target.value)}
                placeholder="Optional"
                rows={2}
                className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-md bg-white focus:border-slate-700 focus:outline-none resize-none"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="feedback-better" className="text-label text-slate-500 uppercase mb-2 block">
                What could be better?
              </label>
              <textarea
                id="feedback-better"
                value={couldBeBetter}
                onChange={e => setCouldBeBetter(e.target.value)}
                placeholder="Optional"
                rows={2}
                className="w-full border-2 border-slate-200 rounded-md px-4 py-3 text-body-md bg-white focus:border-slate-700 focus:outline-none resize-none"
              />
            </div>

            <div className="mb-6">
              <p className="text-label text-slate-500 uppercase mb-3">Would you recommend this app?</p>
              <div className="flex gap-2">
                {([['yes', 'Yes'], ['maybe', 'Maybe'], ['no', 'No']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRecommend(recommend === value ? null : value)}
                    className={`flex-1 py-3 rounded-md text-body-md font-medium transition-colors ${
                      recommend === value
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-md p-3 mb-4">
                <p className="text-body-sm text-rose-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="w-full py-4 bg-slate-700 text-white rounded-md text-label uppercase tracking-wider disabled:opacity-40 hover:bg-slate-900 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
