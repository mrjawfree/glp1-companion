import { useNavigate } from 'react-router-dom'
import OnboardingShell from '../../components/OnboardingShell'
import { Goal, GOALS } from '../../types'
import { useOnboarding } from '../../hooks/useOnboarding'

export default function Goals() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()

  const toggleGoal = (goal: Goal) => {
    const current = data.goals
    if (current.includes(goal)) {
      update({ goals: current.filter((g) => g !== goal) })
    } else if (current.length < 2) {
      update({ goals: [...current, goal] })
    }
  }

  const backPath = data.medication === 'other' ? '/onboarding/drug' : '/onboarding/schedule'

  return (
    <OnboardingShell step={3} totalSteps={5} onBack={() => navigate(backPath)}>
      <h1 className="text-display-lg text-slate-900 mb-2">What matters most right now?</h1>
      <p className="text-body-lg text-slate-500 mb-6">
        Pick up to two. You can change this any time.
      </p>
      <div className="flex flex-wrap gap-3 mb-8">
        {GOALS.map((goal) => {
          const selected = data.goals.includes(goal.value)
          return (
            <button
              key={goal.value}
              onClick={() => toggleGoal(goal.value)}
              className={`px-5 py-3 rounded-pill text-body-md transition-all ${
                selected
                  ? 'bg-slate-700 text-white shadow-elevation-1'
                  : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              {goal.label}
            </button>
          )
        })}
      </div>
      <div className="mt-auto">
        <button
          onClick={() => navigate('/onboarding/profile')}
          className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors"
        >
          Continue
        </button>
      </div>
    </OnboardingShell>
  )
}
