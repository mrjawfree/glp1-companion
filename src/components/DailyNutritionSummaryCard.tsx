import NutritionRing from './NutritionRing'

interface MacroValue {
  value: number
  goal: number
}

interface DailyNutritionSummaryCardProps {
  calories: MacroValue
  protein: MacroValue
  water: MacroValue
  variant: 'compact' | 'expanded'
  loading?: boolean
  error?: string | null
  goalsSet?: boolean
  onAddMeal?: () => void
  onAddWater?: () => void
  onEditGoals?: () => void
  onRetry?: () => void
}

function SkeletonRing({ size }: { size: number }) {
  return (
    <div className="flex flex-col items-center gap-2 animate-pulse" style={{ minWidth: size }}>
      <div className="rounded-full bg-slate-200" style={{ width: size, height: size }} />
      <div className="h-3 w-16 bg-slate-200 rounded" />
      <div className="h-3 w-20 bg-slate-200 rounded" />
    </div>
  )
}

export default function DailyNutritionSummaryCard({
  calories,
  protein,
  water,
  variant,
  loading,
  error,
  goalsSet = true,
  onAddMeal,
  onAddWater,
  onEditGoals,
  onRetry,
}: DailyNutritionSummaryCardProps) {
  const ringSize = variant === 'compact' ? 'md' as const : 'lg' as const
  const skeletonDiameter = variant === 'compact' ? 120 : 160

  return (
    <div className="bg-white rounded-lg shadow-elevation-1 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-body-lg font-semibold text-slate-900">
          {variant === 'compact' ? "Today's nutrition" : 'Daily nutrition'}
        </p>
        {goalsSet && onEditGoals && (
          <button onClick={onEditGoals} className="text-body-sm text-info font-medium">
            Edit goals →
          </button>
        )}
      </div>

      {error && (
        <button onClick={onRetry} className="w-full py-6 text-center">
          <p className="text-body-sm text-rose-500">Couldn't load today's totals. Tap to retry.</p>
        </button>
      )}

      {!error && loading && (
        <div className="flex justify-around">
          <SkeletonRing size={skeletonDiameter} />
          <SkeletonRing size={skeletonDiameter} />
          <SkeletonRing size={skeletonDiameter} />
        </div>
      )}

      {!error && !loading && !goalsSet && (
        <div className="relative">
          <div className="flex justify-around opacity-40">
            <NutritionRing label="Calories" value={0} goal={2000} unit="kcal" size={ringSize} />
            <NutritionRing label="Protein" value={0} goal={100} unit="g" size={ringSize} />
            <NutritionRing label="Water" value={0} goal={2000} unit="ml" size={ringSize} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={onEditGoals}
              className="bg-green-600 text-white px-5 py-3 rounded-pill text-body-md font-semibold shadow-elevation-2 hover:bg-green-400 transition-colors"
            >
              Set your goals →
            </button>
          </div>
        </div>
      )}

      {!error && !loading && goalsSet && (
        <>
          <div className="flex justify-around">
            <NutritionRing label="Calories" value={calories.value} goal={calories.goal} unit="kcal" size={ringSize} />
            <NutritionRing label="Protein" value={protein.value} goal={protein.goal} unit="g" size={ringSize} />
            <NutritionRing label="Water" value={water.value} goal={water.goal} unit="ml" size={ringSize} />
          </div>
          <div className="flex gap-3 mt-5">
            {onAddMeal && (
              <button
                onClick={onAddMeal}
                className="flex-1 py-3 rounded-md bg-slate-100 text-body-md text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                + Log meal
              </button>
            )}
            {onAddWater && (
              <button
                onClick={onAddWater}
                className="flex-1 py-3 rounded-md bg-slate-100 text-body-md text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                + 250ml water
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
