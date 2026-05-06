interface OnboardingShellProps {
  step: number
  totalSteps: number
  onBack?: () => void
  onSkip?: () => void
  children: React.ReactNode
}

export default function OnboardingShell({ step, totalSteps, onBack, onSkip, children }: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-warm-white flex flex-col">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        {onBack ? (
          <button onClick={onBack} className="text-slate-500 text-body-md flex items-center gap-1" aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back
          </button>
        ) : <div className="w-12" />}
        <span className="text-body-sm text-slate-400">{step} of {totalSteps}</span>
        {onSkip ? (
          <button onClick={onSkip} className="text-slate-400 text-body-md">Skip</button>
        ) : <div className="w-12" />}
      </div>
      <div className="flex justify-center gap-2 px-4 pb-5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${step} of ${totalSteps}`}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-1 rounded-pill flex-1 transition-colors duration-220 ${
              i < step ? 'bg-green-600' : i === step ? 'bg-slate-700' : 'bg-slate-200'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
      <div key={step} className="flex-1 px-4 pb-8 flex flex-col animate-onboarding-in">
        {children}
      </div>
    </div>
  )
}
