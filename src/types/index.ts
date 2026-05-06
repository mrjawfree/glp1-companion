export type Medication = 'ozempic' | 'wegovy' | 'mounjaro' | 'zepbound' | 'saxenda' | 'rybelsus' | 'other'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type FoodSource = 'manual' | 'usda_api' | 'barcode_scan'
export type SubscriptionTier = 'free' | 'pro'
export type SubscriptionPlan = 'monthly_9' | 'monthly_19'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing'
export type DoseCadence = 'weekly' | 'daily'
export type DoseUnit = 'mg' | 'mL' | 'units'
export type WeightUnit = 'lb' | 'kg'
export type Goal = 'weight_loss' | 'blood_sugar' | 'reduce_side_effects' | 'sustainable_habits' | 'more_energy' | 'exploring'

export interface OnboardingData {
  medication: Medication | null
  medicationOther: string | null
  injectionDays: number[]
  doseAmount: number | null
  doseUnit: DoseUnit
  currentWeight: number | null
  goalWeight: number | null
  weightUnit: WeightUnit
}

export const MEDICATION_INFO: Record<Medication, { brand: string; generic: string; cadence: DoseCadence }> = {
  ozempic: { brand: 'Ozempic', generic: 'semaglutide', cadence: 'weekly' },
  wegovy: { brand: 'Wegovy', generic: 'semaglutide', cadence: 'weekly' },
  mounjaro: { brand: 'Mounjaro', generic: 'tirzepatide', cadence: 'weekly' },
  zepbound: { brand: 'Zepbound', generic: 'tirzepatide', cadence: 'weekly' },
  saxenda: { brand: 'Saxenda', generic: 'liraglutide', cadence: 'daily' },
  rybelsus: { brand: 'Rybelsus', generic: 'semaglutide (oral)', cadence: 'daily' },
  other: { brand: 'Other / not sure', generic: '', cadence: 'weekly' },
}

export const GOALS: { value: Goal; label: string }[] = [
  { value: 'weight_loss', label: 'Steady weight loss' },
  { value: 'blood_sugar', label: 'Better blood sugar' },
  { value: 'reduce_side_effects', label: 'Reduce side effects' },
  { value: 'sustainable_habits', label: 'Build sustainable habits' },
  { value: 'more_energy', label: 'More energy' },
  { value: 'exploring', label: 'Just exploring' },
]
