import { forwardRef, useEffect, useRef, useState, useCallback } from 'react'

interface DialogOverlayProps {
  open: boolean
  onClose: () => void
  ariaLabelledBy: string
  ariaDescribedBy?: string
  children: React.ReactNode
}

const DialogOverlay = forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ open, onClose, ariaLabelledBy, ariaDescribedBy, children }, ref) => {
    const dialogRef = useRef<HTMLDivElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)
    const [closing, setClosing] = useState(false)

    const handleClose = useCallback(() => {
      setClosing(true)
      setTimeout(() => {
        setClosing(false)
        onClose()
      }, 200)
    }, [onClose])

    useEffect(() => {
      if (!open) return
      closeRef.current?.focus()

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          handleClose()
        }
        if (e.key === 'Tab') {
          const dialog = dialogRef.current
          if (!dialog) return
          const focusable = dialog.querySelectorAll<HTMLElement>(
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
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }, [open, handleClose])

    if (!open && !closing) return null

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(31, 41, 55, 0.56)',
            animation: closing ? 'backdrop-in 200ms reverse forwards' : 'backdrop-in 200ms forwards',
          }}
        />
        <div
          ref={(node) => {
            (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          style={{
            position: 'relative',
            width: 'calc(100% - 32px)',
            maxWidth: 420,
            background: 'var(--cream)',
            borderRadius: 20,
            boxShadow: 'var(--shadow-overlay)',
            overflow: 'hidden',
            animation: closing
              ? 'milestone-card-in 200ms var(--ease-in-out) reverse forwards'
              : 'milestone-card-in 280ms var(--ease-out) forwards',
          }}
        >
          <button
            ref={closeRef}
            onClick={handleClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 2,
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-soft)',
            }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {children}
        </div>
      </div>
    )
  }
)

DialogOverlay.displayName = 'DialogOverlay'
export default DialogOverlay
