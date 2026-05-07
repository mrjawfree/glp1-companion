import { forwardRef, useEffect, useRef, useCallback, useState } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  ariaLabelledBy: string
  children: React.ReactNode
}

const Sheet = forwardRef<HTMLDivElement, SheetProps>(
  ({ open, onClose, ariaLabelledBy, children }, ref) => {
    const sheetRef = useRef<HTMLDivElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)
    const [closing, setClosing] = useState(false)
    const dragStart = useRef<number | null>(null)
    const dragY = useRef(0)
    const lastTime = useRef(0)
    const velocity = useRef(0)

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
          const sheet = sheetRef.current
          if (!sheet) return
          const focusable = sheet.querySelectorAll<HTMLElement>(
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

    const onPointerDown = (e: React.PointerEvent) => {
      dragStart.current = e.clientY
      lastTime.current = Date.now()
      velocity.current = 0
    }

    const onPointerMove = (e: React.PointerEvent) => {
      if (dragStart.current === null) return
      const dy = e.clientY - dragStart.current
      if (dy < 0) return
      dragY.current = dy
      const now = Date.now()
      const dt = now - lastTime.current
      if (dt > 0) velocity.current = dy / dt
      lastTime.current = now
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${dy}px)`
      }
    }

    const onPointerUp = () => {
      if (dragStart.current === null) return
      dragStart.current = null
      if (dragY.current > 80 || velocity.current > 0.5) {
        handleClose()
      }
      if (sheetRef.current) {
        sheetRef.current.style.transform = ''
      }
      dragY.current = 0
    }

    if (!open && !closing) return null

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
        <div
          aria-hidden="true"
          onClick={handleClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(31, 41, 55, 0.48)',
            animation: closing ? 'backdrop-in 200ms reverse forwards' : 'backdrop-in 240ms forwards',
          }}
        />
        <div
          ref={(node) => {
            (sheetRef as React.MutableRefObject<HTMLDivElement | null>).current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: 480,
            margin: '0 auto',
            background: 'var(--cream)',
            borderRadius: '16px 16px 0 0',
            minHeight: '56vh',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-overlay)',
            animation: closing
              ? 'sheet-out 200ms var(--ease-in-out) forwards'
              : 'sheet-in 240ms var(--ease-out) forwards',
            touchAction: 'none',
          }}
        >
          <div aria-hidden="true" style={{
            width: 32, height: 4, borderRadius: 999,
            background: 'var(--border)', margin: '8px auto 0',
          }} />

          <button
            ref={closeRef}
            onClick={handleClose}
            aria-label="Close weekly summary"
            style={{
              position: 'absolute', top: 8, right: 8,
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

          <div style={{ padding: '20px 16px 24px' }}>
            {children}
          </div>
        </div>
      </div>
    )
  }
)

Sheet.displayName = 'Sheet'
export default Sheet
