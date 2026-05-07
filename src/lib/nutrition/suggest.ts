export interface SuggestInput {
  weightKg: number | null
  heightCm: number | null
  age: number | null
  sex: 'male' | 'female' | null
  doseTier: number | null
  activityFactor?: number
}

export interface SuggestOutput {
  calories: number | null
  proteinG: number | null
  waterMl: number | null
}

const DOSE_REDUCTION: Record<number, number> = {
  1: 0.10,
  2: 0.20,
  3: 0.30,
  4: 0.30,
}

function mifflinStJeor(weightKg: number, heightCm: number, age: number, sex: 'male' | 'female'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

export function suggestGoals(input: SuggestInput): SuggestOutput {
  const { weightKg, heightCm, age, sex, doseTier, activityFactor = 1.4 } = input

  let calories: number | null = null
  if (weightKg && heightCm && age && sex) {
    const bmr = mifflinStJeor(weightKg, heightCm, age, sex)
    const reduction = doseTier ? (DOSE_REDUCTION[doseTier] ?? 0) : 0
    calories = roundTo(bmr * activityFactor * (1 - reduction), 100)
    calories = Math.max(800, Math.min(4000, calories))
  }

  const proteinG = weightKg ? roundTo(weightKg * 1.6, 5) : null

  const waterMl = weightKg ? Math.max(2000, roundTo(weightKg * 33, 250)) : null

  return { calories, proteinG, waterMl }
}
