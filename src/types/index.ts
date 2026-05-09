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
export type TrackingPreference = 'weight' | 'doses' | 'meals' | 'side_effects'
export type FirstActionChoice = 'log_injection' | 'meal_plan'

export type InjectionSiteZone =
  | 'left_abdomen' | 'right_abdomen'
  | 'left_thigh' | 'right_thigh'
  | 'left_upper_arm' | 'right_upper_arm'

export type SkipReason = 'side_effects' | 'prescriber_direction' | 'travel_schedule' | 'supply_issue' | 'other'

export type DaysDeltaState = 'upcoming' | 'tomorrow' | 'today' | 'overdue' | 'severe-overdue' | 'empty'

export interface DoseLogEntry {
  id: string
  user_id: string
  medication: Medication
  dose_amount: string
  logged_at: string
  injection_site: InjectionSiteZone | null
  side_effects: string[] | null
  notes: string | null
  is_skip: boolean
  skip_reason: SkipReason | null
  synced_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export const INJECTION_SITE_ZONES: { value: InjectionSiteZone; label: string }[] = [
  { value: 'left_upper_arm', label: 'Left upper arm' },
  { value: 'right_upper_arm', label: 'Right upper arm' },
  { value: 'left_abdomen', label: 'Left abdomen' },
  { value: 'right_abdomen', label: 'Right abdomen' },
  { value: 'left_thigh', label: 'Left thigh' },
  { value: 'right_thigh', label: 'Right thigh' },
]

export const SITE_ROTATION_ORDER: InjectionSiteZone[] = [
  'right_abdomen', 'left_abdomen', 'right_thigh', 'left_thigh', 'right_upper_arm', 'left_upper_arm',
]

export const SKIP_REASONS: { value: SkipReason; label: string }[] = [
  { value: 'side_effects', label: 'Side effects' },
  { value: 'prescriber_direction', label: 'Prescriber direction' },
  { value: 'travel_schedule', label: 'Travel / schedule' },
  { value: 'supply_issue', label: 'Supply issue' },
  { value: 'other', label: 'Other' },
]

export const DOSE_AMOUNTS: Partial<Record<Medication, string[]>> = {
  ozempic: ['0.25', '0.5', '1', '1.5', '2'],
  wegovy: ['0.25', '0.5', '1', '1.7', '2.4'],
  mounjaro: ['2.5', '5', '7.5', '10', '12.5', '15'],
  zepbound: ['2.5', '5', '7.5', '10', '12.5', '15'],
  saxenda: ['0.6', '1.2', '1.8', '2.4', '3'],
  rybelsus: ['3', '7', '14'],
}

export interface OnboardingData {
  displayName: string
  medication: Medication | null
  medicationOther: string | null
  injectionDays: number[]
  doseAmount: number | null
  doseUnit: DoseUnit
  currentWeight: number | null
  goalWeight: number | null
  weightUnit: WeightUnit
  trackingPreferences: TrackingPreference[]
  firstAction: FirstActionChoice | null
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

export const TRACKING_OPTIONS: { value: TrackingPreference; label: string; description: string }[] = [
  { value: 'weight', label: 'Weight', description: 'Track your weight over time' },
  { value: 'doses', label: 'Doses', description: 'Log injections and dose changes' },
  { value: 'meals', label: 'Meals', description: 'Plan and log what you eat' },
  { value: 'side_effects', label: 'Side effects', description: 'Note how you feel day to day' },
]
