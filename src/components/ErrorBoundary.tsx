import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultFallback onReset={this.reset} />
    }
    return this.props.children
  }
}

function DefaultFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-warm-white px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4A7C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 className="text-title-lg text-slate-900 mb-2">Something went wrong</h1>
      <p className="text-body-md text-slate-500 mb-6 max-w-xs">
        An unexpected error occurred. Try reloading and if the problem persists, reach out to support.
      </p>
      <button
        onClick={onReset}
        className="px-6 py-3 bg-green-600 text-white font-medium rounded-pill shadow-elevation-1 active:scale-95 transition-transform"
      >
        Try Again
      </button>
    </div>
  )
}

export function RouteErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-8 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A7C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="text-title-md text-slate-900 mb-2">This page hit a snag</h2>
      <p className="text-body-md text-slate-500 mb-5 max-w-xs">
        Something went wrong loading this section. Your other pages should still work fine.
      </p>
      <button
        onClick={onReset}
        className="px-5 py-2.5 bg-green-600 text-white text-body-md font-medium rounded-pill shadow-elevation-1 active:scale-95 transition-transform"
      >
        Try Again
      </button>
    </div>
  )
}
