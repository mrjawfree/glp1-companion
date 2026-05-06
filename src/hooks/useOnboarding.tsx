import { createContext, useContext, useState, useEffect } from 'react'
import { OnboardingData } from '../types'

const STORAGE_KEY = 'glp1_onboarding'

const defaultData: OnboardingData = {
  displayName: '',
  medication: null,
  medicationOther: null,
  injectionDays: [],
  doseAmount: null,
  doseUnit: 'mg',
  currentWeight: null,
  goalWeight: null,
  weightUnit: 'lb',
  trackingPreferences: [],
  firstAction: null,
}

interface OnboardingContextType {
  data: OnboardingData
  update: (partial: Partial<OnboardingData>) => void
  reset: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const update = (partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }))
  }

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY)
    setData(defaultData)
  }

  return (
    <OnboardingContext.Provider value={{ data, update, reset }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider')
  return context
}
