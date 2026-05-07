import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNutritionGoals } from '../hooks/useNutritionGoals'
import { useDailyTotals, useWeeklyTotals } from '../hooks/useDailyTotals'
import { useWaterLog } from '../hooks/useWaterLog'
import DailyNutritionSummaryCard from '../components/DailyNutritionSummaryCard'
import WeeklyMacroTrendChart from '../components/WeeklyMacroTrendChart'

export default function Nutrition() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const { goals, loading: goalsLoading } = useNutritionGoals()
  const { totals, loading: totalsLoading, error, reload } = useDailyTotals(today)
  const { days } = useWeeklyTotals(today)
  const { logWater } = useWaterLog()
  const [waterPending, setWaterPending] = useState(false)

  async function handleAddWater() {
    setWaterPending(true)
    await logWater(250)
    await reload()
    setWaterPending(false)
  }

  const goalsSet = !!goals && !goals.skipped_at

  return (
    <div className="px-4 pt-5">
      <h1 className="text-title-lg text-slate-900 mb-5">Nutrition</h1>

      <DailyNutritionSummaryCard
        variant="expanded"
        loading={goalsLoading || totalsLoading}
        error={error}
        goalsSet={goalsSet}
        calories={{ value: totals?.calories ?? 0, goal: goals?.calorie_goal ?? 2000 }}
        protein={{ value: totals?.protein_g ?? 0, goal: goals?.protein_goal_g ?? 100 }}
        water={{ value: totals?.water_ml ?? 0, goal: goals?.water_goal_ml ?? 2000 }}
        onAddMeal={() => navigate('/food')}
        onAddWater={waterPending ? undefined : handleAddWater}
        onEditGoals={() => navigate('/settings/nutrition-goals')}
        onRetry={reload}
      />

      <div className="mt-5">
        <WeeklyMacroTrendChart
          days={days.map(d => ({ date: d.day, calories: d.calories, protein: d.protein_g }))}
          calorieGoal={goals?.calorie_goal ?? 2000}
          proteinGoal={goals?.protein_goal_g ?? 100}
        />
      </div>
    </div>
  )
}
