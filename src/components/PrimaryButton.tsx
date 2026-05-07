import { forwardRef } from 'react'

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ children, style, ...props }, ref) => (
    <button
      ref={ref}
      {...props}
      style={{
        width: '100%',
        height: 56,
        background: 'var(--teal-deep)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        fontSize: 16,
        lineHeight: '22px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'transform 120ms var(--ease-out)',
        ...style,
      }}
      onPointerDown={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'
      }}
      onPointerUp={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = ''
      }}
      onPointerLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = ''
      }}
    >
      {children}
    </button>
  )
)

PrimaryButton.displayName = 'PrimaryButton'
export default PrimaryButton
