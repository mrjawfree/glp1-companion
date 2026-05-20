import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { trackEvent } from '../lib/analytics'
import SparkChart from '../components/SparkChart'
import StatTile from '../components/StatTile'
import DayCircle from '../components/DayCircle'
import Sheet from '../components/Sheet'
import MoodPicker from '../components/MoodPicker'
import DialogOverlay from '../components/DialogOverlay'
import ProgressBar from '../components/ProgressBar'
import PrimaryButton from '../components/PrimaryButton'

interface ProgressEntry {
  id: string
  recorded_at: string
  weight_kg: number | null
  weight_lbs: number | null
  waist_cm: number | null
  energy_level: number | null
  measurements: Record<string, number> | null
  notes: string | null
}

interface DoseLog {
  id: string
  logged_at: string
}

interface MealEntry {
  id: string
  meal_type: string
  calories: number
  logged_at: string
}

interface UserSettings {
  weight_unit?: string
  current_weight?: number
  goal_weight?: number
  injection_day?: number
  injection_days?: number[]
  height_cm?: number
}

type WeightUnit = 'lbs' | 'kg'

const KG_TO_LBS = 2.20462

function getWeight(entry: ProgressEntry, unit: WeightUnit): number | null {
  if (unit === 'lbs') {
    return entry.weight_lbs ?? (entry.weight_kg ? parseFloat((entry.weight_kg * KG_TO_LBS).toFixed(1)) : null)
  }
  return entry.weight_kg
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: '0 16px', background: 'var(--cream)', minHeight: '100vh' }}>
      <div style={{ height: 56, display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 120, height: 24, borderRadius: 8, background: 'var(--border)', opacity: 0.4 }} />
      </div>
      <div style={{ height: 200, borderRadius: 12, background: 'var(--border)', opacity: 0.4, marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ height: 76, borderRadius: 8, background: 'var(--border)', opacity: 0.4 }} />
        ))}
      </div>
      <div style={{ height: 56, borderRadius: 8, background: 'var(--border)', opacity: 0.4 }} />
    </div>
  )
}

export default function Progress() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([])
  const [settings, setSettings] = useState<UserSettings>({})
  const [scrolledPast, setScrolledPast] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  const [meals, setMeals] = useState<MealEntry[]>([])
  const [weeklySheetOpen, setWeeklySheetOpen] = useState(false)
  const [weeklyMood, setWeeklyMood] = useState<number | null>(null)

  const [milestoneOverlay, setMilestoneOverlay] = useState<{
    variant: 'five_lb' | 'ten_pct' | 'thirty_day'
    currentWeight: number
    startWeight: number
    goalWeight: number
  } | null>(null)

  const weightUnit: WeightUnit = (settings.weight_unit as WeightUnit) || 'lbs'

  const loadData = useCallback(async () => {
    if (!user) return
    setError(false)
    try {
      const [entriesRes, doseRes, settingsRes, mealsRes] = await Promise.all([
        supabase.from('progress_tracking').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(365),
        supabase.from('dose_logs').select('id, logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(90),
        supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('meals').select('id, meal_type, calories, logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(100),
      ])
      if (entriesRes.data) setEntries(entriesRes.data)
      if (doseRes.data) setDoseLogs(doseRes.data)
      if (settingsRes.data) setSettings(settingsRes.data)
      if (mealsRes.data) setMeals(mealsRes.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!loading) trackEvent('progress_view')
  }, [loading])

  useEffect(() => {
    const handleScroll = () => setScrolledPast(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.scrollLeft = calendarRef.current.scrollWidth
    }
  }, [doseLogs, loading])

  if (loading) return <LoadingSkeleton />

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentEntries = entries.filter(e => new Date(e.recorded_at) >= thirtyDaysAgo)
  const weightEntries = recentEntries.filter(e => getWeight(e, weightUnit) !== null)

  const latestWeight = entries.find(e => getWeight(e, weightUnit) !== null)
  const latestWeightVal = latestWeight ? getWeight(latestWeight, weightUnit) : null

  const oldestRecentWeight = weightEntries.length > 0
    ? getWeight(weightEntries[weightEntries.length - 1], weightUnit)
    : null

  const goalWeight = settings.goal_weight || null

  const delta = latestWeightVal && oldestRecentWeight
    ? parseFloat((latestWeightVal - oldestRecentWeight).toFixed(1))
    : null

  const latestWeightKg = latestWeight
    ? (latestWeight.weight_kg ?? (latestWeight.weight_lbs ? latestWeight.weight_lbs / KG_TO_LBS : null))
    : null
  const heightCm = settings.height_cm ?? null
  const bmi = latestWeightKg && heightCm
    ? parseFloat((latestWeightKg / ((heightCm / 100) ** 2)).toFixed(1))
    : null
  const bmiDate = latestWeight ? new Date(latestWeight.recorded_at) : null

  const sparkData = weightEntries
    .slice()
    .reverse()
    .map(e => ({
      date: e.recorded_at,
      value: getWeight(e, weightUnit)!,
    }))

  // Adherence calculations
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const thisWeekDoses = doseLogs.filter(d => new Date(d.logged_at) >= weekAgo)
  const weeklyAdherence = doseLogs.length > 0 ? Math.round((thisWeekDoses.length / 7) * 100) : null

  const fourWeeksAgo = new Date(now)
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
  const monthDoses = doseLogs.filter(d => new Date(d.logged_at) >= fourWeeksAgo)
  const avgWeeklyDoses = monthDoses.length > 0 ? (monthDoses.length / 4).toFixed(1) : null

  // Streak calculation
  let streak = 0
  const doseSet = new Set(doseLogs.map(d => new Date(d.logged_at).toISOString().split('T')[0]))
  for (let i = 0; i < 90; i++) {
    const checkDate = new Date(now)
    checkDate.setDate(checkDate.getDate() - i)
    const key = checkDate.toISOString().split('T')[0]
    if (doseSet.has(key)) streak++
    else if (i > 0) break
  }

  // 30-day calendar data
  const calendarDays: { date: Date; state: 'taken' | 'missed' | 'today-taken' | 'today-missed' }[] = []
  const todayStr = now.toISOString().split('T')[0]
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const taken = doseSet.has(dateStr)
    const isToday = dateStr === todayStr
    calendarDays.push({
      date: d,
      state: isToday ? (taken ? 'today-taken' : 'today-missed') : (taken ? 'taken' : 'missed'),
    })
  }

  const hasData = entries.length > 0 || doseLogs.length > 0

  // Empty state
  if (!hasData) {
    return (
      <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
        <div style={{
          height: 56, position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', background: 'var(--cream)',
        }}>
          <h1 style={{ fontSize: 20, lineHeight: '24px', fontWeight: 700, color: 'var(--ink)' }}>My Progress</h1>
          <button
            type="button"
            aria-label="Open settings"
            onClick={() => navigate('/settings')}
            style={{
              minWidth: 48, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)',
            }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={12} cy={12} r={3} />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{
            width: 180, height: 180, borderRadius: '50%', background: 'var(--sage-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={80} height={80} viewBox="0 0 80 80" fill="none" aria-hidden="true">
              <rect x={16} y={20} width={48} height={40} rx={4} stroke="var(--sage)" strokeWidth={2} fill="none" />
              <polyline points="20,50 32,38 44,44 56,30 60,34" stroke="var(--teal-primary)" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 style={{ fontSize: 18, lineHeight: '22px', fontWeight: 600, color: 'var(--ink)', marginTop: 16 }}>
            Nothing tracked yet
          </h2>
          <p style={{ fontSize: 16, lineHeight: '22px', color: 'var(--ink-soft)', maxWidth: 280, marginTop: 8 }}>
            Log your first dose or meal to start seeing your progress.
          </p>
          <div style={{ marginTop: 24, width: '100%', maxWidth: 311 }}>
            <PrimaryButton onClick={() => navigate('/dose-log')}>
              Log today's dose
            </PrimaryButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
      {/* Top Bar */}
      <div style={{
        height: 56, position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', background: 'var(--cream)',
        borderBottom: scrolledPast ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'border-color 160ms var(--ease-in-out)',
      }}>
        <h1 style={{ fontSize: 20, lineHeight: '24px', fontWeight: 700, color: 'var(--ink)' }}>My Progress</h1>
        <button
          type="button"
          aria-label="Open settings"
          onClick={() => navigate('/settings')}
          style={{
            minWidth: 48, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)',
          }}
        >
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={12} r={3} />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          margin: 16, padding: 12, borderRadius: 'var(--radius-md)',
          background: 'var(--coral-10)', border: '1px solid var(--coral)',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <p style={{ fontSize: 14, lineHeight: '20px', color: 'var(--ink)' }}>
            We couldn't load your progress. Pull to refresh, or try again in a moment.
          </p>
          <button
            onClick={loadData}
            style={{
              alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, lineHeight: '18px', fontWeight: 500, color: 'var(--teal-deep)',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* Summary Hero Card */}
          <section aria-labelledby="hero-current-weight" style={{
            margin: 16, background: 'var(--cream)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 16,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p id="hero-current-weight" style={{ fontSize: 32, lineHeight: '38px', fontWeight: 700, color: 'var(--ink)' }}>
                {latestWeightVal ? `${latestWeightVal} ${weightUnit === 'lbs' ? 'lb' : 'kg'}` : '—'}
              </p>
              {goalWeight && (
                <p style={{ fontSize: 14, lineHeight: '20px', color: 'var(--ink-soft)' }}>
                  Goal: {goalWeight} {weightUnit === 'lbs' ? 'lb' : 'kg'}
                </p>
              )}
              {delta !== null && (
                <p style={{
                  fontSize: 16, lineHeight: '22px', fontWeight: 500,
                  color: Math.abs(delta) < 0.5 ? 'var(--ink-soft)' : delta < 0 ? 'var(--success)' : 'var(--coral)',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {Math.abs(delta) < 0.5 ? (
                    'Steady this month'
                  ) : (
                    <>
                      <svg width={12} height={12} viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path
                          d={delta < 0 ? 'M6 2v8M2 6l4 4 4-4' : 'M6 10V2M2 6l4-4 4 4'}
                          stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                        />
                      </svg>
                      {delta < 0 ? `−${Math.abs(delta)}` : `+${delta}`} {weightUnit === 'lbs' ? 'lb' : 'kg'} in 30 days
                    </>
                  )}
                </p>
              )}
            </div>

            {sparkData.length >= 2 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <SparkChart data={sparkData} width={200} height={64} />
                <div style={{
                  display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 8,
                }} aria-hidden="true">
                  <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--ink-soft)' }}>
                    Start: {sparkData[0].value}
                  </span>
                  <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--ink-soft)' }}>
                    {goalWeight ? `Goal: ${goalWeight}` : `Now: ${sparkData[sparkData.length - 1].value}`}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* BMI Indicator Row (Option B) */}
          {bmi !== null && (
            <div
              role="group"
              aria-label={`BMI: ${bmi}${bmiDate ? ` as of ${bmiDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : ''}`}
              style={{
                margin: '0 16px 16px',
                background: 'var(--cream)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span style={{ fontSize: 14, lineHeight: '18px', fontWeight: 500, color: 'var(--ink-soft)' }}>
                BMI
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 18, lineHeight: '22px', fontWeight: 600, color: 'var(--ink)' }}>
                  {bmi}
                </span>
                {bmiDate && (
                  <p style={{ fontSize: 12, lineHeight: '16px', color: 'var(--ink-soft)', marginTop: 2 }}>
                    (from {bmiDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Adherence Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '0 16px' }}>
            <StatTile label="This week" value={weeklyAdherence !== null ? `${weeklyAdherence}%` : '—'} variant="sage" />
            <StatTile label="Avg weekly doses" value={avgWeeklyDoses || '—'} variant="sage" />
            <StatTile label="Current streak" value={streak > 0 ? `${streak} days` : '—'} variant="sage" />
          </div>

          {/* Weekly Summary link */}
          <div style={{ margin: '16px 16px 0' }}>
            <button
              type="button"
              onClick={() => { setWeeklySheetOpen(true); trackEvent('weekly_summary_open') }}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)',
                background: 'var(--sage-soft)', border: '1px solid var(--border)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 16, lineHeight: '22px', fontWeight: 500, color: 'var(--ink)' }}>
                Weekly Summary
              </span>
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4l4 4-4 4" stroke="var(--ink-soft)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Calendar Section */}
          <div style={{ margin: '24px 16px 0' }}>
            <h2 style={{
              fontSize: 12, lineHeight: '16px', fontWeight: 600, color: 'var(--ink-soft)',
              textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12,
            }}>
              Last 30 days
            </h2>
            <div
              ref={calendarRef}
              className="scrollbar-hide"
              style={{
                display: 'flex', gap: 8, overflowX: 'auto',
                scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
                padding: '4px 0',
              }}
            >
              {calendarDays.map((day, i) => {
                const isMonday = day.date.getDay() === 1
                return (
                  <div key={i} style={{ scrollSnapAlign: 'center' }}>
                    <DayCircle
                      date={day.date}
                      state={day.state}
                      dayLabel={isMonday ? String(day.date.getDate()) : undefined}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Weekly Summary Sheet */}
      <Sheet open={weeklySheetOpen} onClose={() => { setWeeklySheetOpen(false); trackEvent('weekly_summary_close') }} ariaLabelledBy="weekly-heading">
        <WeeklySummaryContent
          meals={meals}
          mood={weeklyMood}
          onMoodChange={(i) => { setWeeklyMood(i); trackEvent('mood_selected', { value: i }) }}
        />
      </Sheet>

      {/* Milestone Celebration */}
      {milestoneOverlay && (
        <MilestoneCelebrationOverlay
          variant={milestoneOverlay.variant}
          currentWeight={milestoneOverlay.currentWeight}
          startWeight={milestoneOverlay.startWeight}
          goalWeight={milestoneOverlay.goalWeight}
          unit={weightUnit}
          onClose={() => setMilestoneOverlay(null)}
          onShare={() => trackEvent('milestone_share', { variant: milestoneOverlay.variant })}
        />
      )}
    </div>
  )
}

function WeeklySummaryContent({
  meals,
  mood,
  onMoodChange,
}: {
  meals: MealEntry[]
  mood: number | null
  onMoodChange: (i: number) => void
}) {
  const now = new Date()
  const weekStart = new Date(now)
  const day = weekStart.getDay()
  weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1))
  weekStart.setHours(0, 0, 0, 0)

  const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  const weekMeals = meals.filter(m => new Date(m.logged_at) >= weekStart)
  const mealsLogged = weekMeals.length
  const mealsTarget = 14

  // Avg daily calories: group by date, compute per-day totals, average them
  const caloriesByDay = new Map<string, number>()
  for (const m of weekMeals) {
    const dateKey = new Date(m.logged_at).toISOString().split('T')[0]
    caloriesByDay.set(dateKey, (caloriesByDay.get(dateKey) || 0) + (m.calories || 0))
  }
  const daysWithData = caloriesByDay.size
  const avgCalories = daysWithData >= 2
    ? Math.round([...caloriesByDay.values()].reduce((a, b) => a + b, 0) / daysWithData)
    : null

  // Best/worst day: day with most/fewest meals logged (assumption documented per manager guidance)
  const mealCountByDay = new Map<string, number>()
  for (const m of weekMeals) {
    const dateKey = new Date(m.logged_at).toISOString().split('T')[0]
    mealCountByDay.set(dateKey, (mealCountByDay.get(dateKey) || 0) + 1)
  }

  let bestDay: string | null = null
  let worstDay: string | null = null
  if (mealCountByDay.size >= 2) {
    let bestCount = -1
    let worstCount = Infinity
    for (const [dateKey, count] of mealCountByDay) {
      if (count > bestCount) { bestCount = count; bestDay = dateKey }
      if (count < worstCount) { worstCount = count; worstDay = dateKey }
    }
  }

  const formatDayLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short' })
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 id="weekly-heading" style={{ fontSize: 18, lineHeight: '22px', fontWeight: 600, color: 'var(--ink)', marginBottom: 24 }}>
        Week of {weekLabel}
      </h2>

      <p aria-label={`${mealsLogged} of ${mealsTarget} meals logged this week`}>
        <span style={{ fontSize: 48, lineHeight: '56px', fontWeight: 700, color: 'var(--teal-primary)' }}>{mealsLogged}</span>
        <span style={{ fontSize: 20, lineHeight: '24px', color: 'var(--ink-soft)' }}>/{mealsTarget}</span>
      </p>
      <p aria-hidden="true" style={{ fontSize: 14, lineHeight: '20px', color: 'var(--ink-soft)', marginTop: 4 }}>
        Meals logged this week
      </p>

      <hr aria-hidden="true" style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

      <p aria-label={`Average daily calories: ${avgCalories ?? '—'}`} style={{ fontSize: 32, lineHeight: '38px', fontWeight: 700, color: 'var(--ink)' }}>
        {avgCalories !== null ? avgCalories.toLocaleString() : '—'}
      </p>
      <p style={{ fontSize: 14, lineHeight: '20px', color: 'var(--ink-soft)', marginTop: 4 }}>
        {avgCalories !== null ? 'Avg daily calories' : 'Not enough days logged for an average'}
      </p>

      {/* Best/Worst Day */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 24 }}>
        <div role="group" aria-labelledby="best-label" style={{
          background: 'var(--success-soft)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'left',
        }}>
          <p id="best-label" style={{
            fontSize: 12, lineHeight: '16px', fontWeight: 600, color: 'var(--ink-soft)',
            textTransform: 'uppercase', letterSpacing: '0.12em',
          }}>Best Day</p>
          <p style={{ fontSize: 18, lineHeight: '22px', fontWeight: 600, color: 'var(--ink)', marginTop: 4 }}>
            {bestDay ? formatDayLabel(bestDay) : '—'}
          </p>
          <p style={{ fontSize: 14, lineHeight: '20px', color: 'var(--ink-soft)', marginTop: 2 }}>
            {bestDay ? `${mealCountByDay.get(bestDay)} meals logged` : 'Not enough data this week'}
          </p>
        </div>
        <div role="group" aria-labelledby="worst-label" style={{
          background: 'var(--coral-10)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'left',
        }}>
          <p id="worst-label" style={{
            fontSize: 12, lineHeight: '16px', fontWeight: 600, color: 'var(--ink-soft)',
            textTransform: 'uppercase', letterSpacing: '0.12em',
          }}>Worst Day</p>
          <p style={{ fontSize: 18, lineHeight: '22px', fontWeight: 600, color: 'var(--ink)', marginTop: 4 }}>
            {worstDay ? formatDayLabel(worstDay) : '—'}
          </p>
          <p style={{ fontSize: 14, lineHeight: '20px', color: 'var(--ink-soft)', marginTop: 2 }}>
            {worstDay ? `${mealCountByDay.get(worstDay)} meals logged` : 'Not enough data this week'}
          </p>
        </div>
      </div>

      {/* Mood Picker */}
      <MoodPicker value={mood} onChange={onMoodChange} className="" />

      {/* See full history link */}
      <div style={{ marginTop: 32, marginBottom: 24 }}>
        <a
          href="/progress"
          style={{
            fontSize: 16, lineHeight: '22px', fontWeight: 500, color: 'var(--teal-deep)',
            textDecoration: 'underline', textUnderlineOffset: 3,
            display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 12px',
          }}
        >
          See full history
        </a>
      </div>
    </div>
  )
}

function MilestoneCelebrationOverlay({
  variant,
  currentWeight,
  startWeight,
  goalWeight,
  unit,
  onClose,
  onShare,
}: {
  variant: 'five_lb' | 'ten_pct' | 'thirty_day'
  currentWeight: number
  startWeight: number
  goalWeight: number
  unit: WeightUnit
  onClose: () => void
  onShare?: () => void
}) {
  useEffect(() => {
    trackEvent('milestone_unlock_view', { variant })
  }, [variant])
  const unitLabel = unit === 'lbs' ? 'lb' : 'kg'

  const variants = {
    five_lb: {
      headline: unit === 'lbs' ? 'Down 5 lbs!' : 'Down 2.3 kg!',
      subhead: 'Your first milestone — you showed up every day.',
      badge: '⚖️',
      ariaLabel: unit === 'lbs' ? 'Milestone: down 5 pounds.' : 'Milestone: down 2.3 kilograms.',
    },
    ten_pct: {
      headline: '10% of your goal — done.',
      subhead: "You're building real momentum.",
      badge: '🎯',
      ariaLabel: 'Milestone: 10 percent of goal.',
    },
    thirty_day: {
      headline: '30 days straight.',
      subhead: "Consistency is the hardest part. You've got it.",
      badge: '🔥',
      ariaLabel: 'Milestone: 30 day streak.',
    },
  }

  const v = variants[variant]
  const totalToLose = startWeight - goalWeight
  const lost = startWeight - currentWeight
  const pctOfGoal = totalToLose > 0 ? Math.round((lost / totalToLose) * 100) : 0

  const confettiColors = ['var(--amber)', 'var(--teal-primary)', 'var(--sage)', 'var(--coral)', 'var(--success)']

  return (
    <DialogOverlay open onClose={onClose} ariaLabelledBy="milestone-headline" ariaDescribedBy="milestone-subhead">
      {/* Confetti Zone */}
      <div style={{
        position: 'relative', height: 240, background: 'var(--amber-soft)', overflow: 'hidden',
        borderRadius: '20px 20px 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="confetti-particle"
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: 6, height: 10,
              background: confettiColors[i % confettiColors.length],
              top: '40%', left: '50%',
              borderRadius: 2,
              ['--confetti-x' as string]: `${(Math.random() - 0.5) * 300}px`,
              ['--confetti-y' as string]: `${Math.random() * 200 - 100}px`,
              ['--confetti-r' as string]: `${Math.random() * 720 - 360}deg`,
              animation: `confetti-burst 1.2s var(--ease-out) ${Math.random() * 600}ms forwards`,
            }}
          />
        ))}
        <div role="img" aria-label={v.ariaLabel} style={{ fontSize: 80, zIndex: 1 }}>
          {/* Star placeholder icon */}
          <svg width={80} height={80} viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <polygon points="40,8 50,30 74,30 54,46 62,70 40,54 18,70 26,46 6,30 30,30" fill="var(--amber)" stroke="var(--amber)" strokeWidth={1} />
          </svg>
        </div>
      </div>

      {/* Badge */}
      <div style={{
        position: 'relative', display: 'flex', justifyContent: 'center', marginTop: -32,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: 'var(--amber)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.32)',
          animation: 'milestone-badge 360ms var(--ease-out) 120ms both',
        }}>
          <span aria-hidden="true" style={{ fontSize: 32 }}>{v.badge}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 24px 24px', textAlign: 'center' }}>
        <h1 id="milestone-headline" style={{ fontSize: 28, lineHeight: '34px', fontWeight: 700, color: 'var(--ink)', marginTop: 16 }}>
          {v.headline}
        </h1>
        <p id="milestone-subhead" style={{ fontSize: 16, lineHeight: '22px', color: 'var(--ink-soft)', maxWidth: 280, margin: '8px auto 0' }}>
          {v.subhead}
        </p>

        {/* Snapshot card */}
        {goalWeight > 0 && (
          <section aria-label="Progress snapshot" style={{
            margin: '24px 0', background: 'var(--sage-soft)',
            borderRadius: 'var(--radius-lg)', padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <p style={{
                  fontSize: 12, lineHeight: '16px', fontWeight: 600, color: 'var(--ink-soft)',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                }}>Start</p>
                <p style={{ fontSize: 18, lineHeight: '22px', fontWeight: 600, color: 'var(--ink)' }}>
                  {startWeight} {unitLabel}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{
                  fontSize: 12, lineHeight: '16px', fontWeight: 600, color: 'var(--ink-soft)',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                }}>Now</p>
                <p style={{ fontSize: 18, lineHeight: '22px', fontWeight: 600, color: 'var(--ink)' }}>
                  {currentWeight} {unitLabel}
                </p>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--ink-soft)' }}>0%</span>
                <span style={{ fontSize: 12, lineHeight: '16px', fontWeight: 600, color: 'var(--ink)' }}>{pctOfGoal}% of goal</span>
              </div>
              <ProgressBar value={pctOfGoal} />
            </div>
          </section>
        )}

        <PrimaryButton onClick={onClose}>Keep it up</PrimaryButton>

        <button
          type="button"
          onClick={() => {
            onShare?.()
            if (navigator.share) {
              navigator.share({ title: v.headline, text: v.subhead })
            }
          }}
          style={{
            display: 'block', margin: '12px auto 0',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, lineHeight: '22px', fontWeight: 500, color: 'var(--ink-soft)',
          }}
        >
          Share this
        </button>
      </div>
    </DialogOverlay>
  )
}
