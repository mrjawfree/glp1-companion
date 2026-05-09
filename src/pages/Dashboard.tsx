import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { DashboardSkeleton } from '../components/Skeleton'
import NextDoseWidget from '../components/NextDoseWidget'
import type { DaysDeltaState } from '../types'
import { MEDICATION_INFO, type Medication } from '../types'

interface DoseEntry {
  id: string
  medication: string
  dose_amount: number
  logged_at: string
}

interface UserProfile {
  display_name: string
  medication: string
  current_dose: number
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function NutritionRing({ protein, fiber, hydration, proteinGoal, fiberGoal }: {
  protein: number; fiber: number; hydration: number; proteinGoal: number; fiberGoal: number
}) {
  const size = 160
  const cx = size / 2
  const cy = size / 2

  const drawArc = (radius: number, fraction: number, color: string, width: number) => {
    const f = Math.min(fraction, 1)
    const circumference = 2 * Math.PI * radius
    return (
      <>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#EDF1F6" strokeWidth={width} />
        <circle
          cx={cx} cy={cy} r={radius} fill="none" stroke={color} strokeWidth={width}
          strokeDasharray={`${circumference * f} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          className="transition-all duration-500"
        />
      </>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Daily nutrition: ${protein}g protein of ${proteinGoal}g goal, ${fiber}g fiber of ${fiberGoal}g goal, ${hydration} of 8 glasses water`}>
        {drawArc(68, protein / proteinGoal, '#4A7C5C', 10)}
        {drawArc(54, fiber / fiberGoal, '#8995A8', 8)}
        {drawArc(42, hydration / 8, '#C2CCD9', 6)}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-900 font-semibold" fontSize="20">{protein}g</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-500" fontSize="12">protein</text>
      </svg>
      <div className="flex gap-4 mt-3 text-body-sm text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600" />Protein</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" />Fiber</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" />Water ({hydration}/8)</span>
      </div>
    </div>
  )
}

function StreakRow({ streak, days }: { streak: number; days: ('logged' | 'partial' | 'missed' | 'today' | 'future')[] }) {
  const colors = {
    logged: 'bg-green-600',
    partial: 'bg-green-400',
    missed: 'bg-slate-200',
    today: 'bg-slate-700',
    future: 'bg-slate-100',
  }
  return (
    <div className="bg-white rounded-md shadow-elevation-1 p-4 mb-5">
      <p className="text-body-md text-slate-900 font-semibold mb-3">
        {streak > 0 ? `${streak}-day check-in streak` : 'Start your streak today'}
      </p>
      <div className="flex gap-1.5">
        {days.map((d, i) => (
          <div key={i} className={`w-8 h-8 rounded-full ${colors[d]} flex items-center justify-center`}>
            {d === 'logged' && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
        ))}
      </div>
      {streak === 0 && (
        <p className="text-body-sm text-slate-400 mt-2">Log a dose or a meal to start.</p>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [lastDose, setLastDose] = useState<DoseEntry | null>(null)
  const [todayProtein, setTodayProtein] = useState(0)
  const [todayFiber, setTodayFiber] = useState(0)
  const [hydration, setHydration] = useState(0)
  const [hasMealsToday, setHasMealsToday] = useState(false)
  const [streak, setStreak] = useState(0)
  const [streakDays, setStreakDays] = useState<('logged' | 'partial' | 'missed' | 'today' | 'future')[]>([])
  const [showSetupNudge, setShowSetupNudge] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('user_settings').select('onboarding_completed').eq('user_id', user.id).single().then(({ data }) => {
      if (!data || !data.onboarding_completed) setShowSetupNudge(true)
    })
    const profileP = supabase.from('users').select('display_name, medication, current_dose').eq('id', user.id).single().then(({ data }) => {
      if (data) setProfile(data)
    })
    const doseP = supabase.from('doses').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1).then(({ data }) => {
      if (data?.[0]) setLastDose(data[0])
    })
    const today = new Date().toISOString().split('T')[0]
    const mealsP = supabase.from('meals').select('protein_g, fiber_g').eq('user_id', user.id).gte('logged_at', today).then(({ data }) => {
      if (data) {
        setHasMealsToday(data.length > 0)
        setTodayProtein(data.reduce((s, e) => s + (e.protein_g || 0), 0))
        setTodayFiber(data.reduce((s, e) => s + (e.fiber_g || 0), 0))
      }
    })

    const savedHydration = localStorage.getItem(`glp1_hydration_${today}`)
    if (savedHydration) setHydration(parseInt(savedHydration))

    const streakP = computeStreak()
    Promise.all([profileP, doseP, mealsP, streakP]).finally(() => setLoading(false))
  }, [user])

  async function computeStreak() {
    if (!user) return
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const { data: foodDays } = await supabase.from('meals').select('logged_at').eq('user_id', user.id).gte('logged_at', sevenDaysAgo.toISOString())
    const { data: doseDays } = await supabase.from('doses').select('logged_at').eq('user_id', user.id).gte('logged_at', sevenDaysAgo.toISOString())

    const loggedDates = new Set<string>()
    foodDays?.forEach(e => loggedDates.add(new Date(e.logged_at).toISOString().split('T')[0]))
    doseDays?.forEach(e => loggedDates.add(new Date(e.logged_at).toISOString().split('T')[0]))

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const days: ('logged' | 'partial' | 'missed' | 'today' | 'future')[] = []
    let count = 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      if (ds === todayStr) {
        days.push(loggedDates.has(ds) ? 'logged' : 'today')
      } else if (loggedDates.has(ds)) {
        days.push('logged')
      } else {
        days.push('missed')
      }
    }
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i] === 'logged') count++
      else break
    }
    setStreak(count)
    setStreakDays(days)
  }

  if (loading) return <DashboardSkeleton />

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'there'

  const getDoseWidgetState = (): { state: DaysDeltaState; nextDoseDate: string | null; daysSinceLastDose: number | null } => {
    if (!profile?.medication || profile.medication === 'other' || !lastDose) {
      return { state: 'empty', nextDoseDate: null, daysSinceLastDose: null }
    }
    const doseDate = new Date(lastDose.logged_at)
    const now = new Date()
    const daysSince = Math.floor((now.getTime() - doseDate.getTime()) / (1000 * 60 * 60 * 24))
    const cadence = MEDICATION_INFO[profile.medication as Medication]?.cadence ?? 'weekly'
    const intervalDays = cadence === 'daily' ? 1 : 7
    const nextDose = new Date(doseDate.getTime() + intervalDays * 24 * 60 * 60 * 1000)
    const daysUntilNext = Math.ceil((nextDose.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilNext > 1) return { state: 'upcoming', nextDoseDate: nextDose.toISOString(), daysSinceLastDose: daysSince }
    if (daysUntilNext === 1) return { state: 'tomorrow', nextDoseDate: nextDose.toISOString(), daysSinceLastDose: daysSince }
    if (daysUntilNext <= 0 && daysSince <= intervalDays) return { state: 'today', nextDoseDate: nextDose.toISOString(), daysSinceLastDose: daysSince }
    if (daysSince > intervalDays && daysSince <= intervalDays + 3) return { state: 'overdue', nextDoseDate: null, daysSinceLastDose: daysSince }
    return { state: 'severe-overdue', nextDoseDate: null, daysSinceLastDose: daysSince }
  }

  const widgetState = getDoseWidgetState()

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-title-lg text-slate-900">{getGreeting()}, {displayName}.</h1>
        <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-body-md font-semibold" aria-label="Go to profile settings">
          {displayName[0]?.toUpperCase()}
        </button>
      </div>

      {showSetupNudge && (
        <button
          onClick={() => navigate('/onboarding/profile-setup')}
          className="w-full rounded-md p-4 mb-5 text-left bg-green-100 border border-green-400 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4V16M4 10H16" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <span className="block text-body-lg font-semibold text-slate-900">Complete your setup</span>
            <span className="block text-body-sm text-slate-500">Set up your medication and goals to get the most out of the app.</span>
          </div>
        </button>
      )}

      <NextDoseWidget
        state={widgetState.state}
        nextDoseDate={widgetState.nextDoseDate}
        daysSinceLastDose={widgetState.daysSinceLastDose}
        onLogDose={() => {}}
      />

      <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-5 flex justify-center">
        <NutritionRing protein={todayProtein} fiber={todayFiber} hydration={hydration} proteinGoal={90} fiberGoal={25} />
      </div>

      <StreakRow streak={streak} days={streakDays} />

      <div className="mb-5">
        <h2 className="text-title-md text-slate-900 mb-3">Gentle picks for today</h2>
        {!hasMealsToday ? (
          <div className="text-center py-12">
            <p className="text-body-lg text-slate-400 mb-3">No meals logged today yet.</p>
            <button onClick={() => navigate('/meals')} className="text-body-md text-info font-medium">
              Log your first meal
            </button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {[
              { name: 'Greek Yogurt Bowl', protein: '24g', time: '5 min', tag: 'Settles well' },
              { name: 'Bone Broth & Toast', protein: '18g', time: '10 min', tag: 'Sip-friendly' },
              { name: 'Cottage Cheese Plate', protein: '28g', time: '5 min', tag: 'Easy on stomach' },
            ].map((meal) => (
              <button
                key={meal.name}
                onClick={() => navigate('/meals')}
                className="min-w-[200px] bg-white rounded-md shadow-elevation-1 p-4 text-left flex-shrink-0"
              >
                <div className="w-full h-24 bg-warm-white-2 rounded-sm mb-3" />
                <p className="text-body-md font-semibold text-slate-900 mb-1">{meal.name}</p>
                <div className="flex gap-2">
                  <span className="text-body-sm text-green-600 font-medium">{meal.protein} protein</span>
                  <span className="text-body-sm text-slate-400">{meal.time}</span>
                </div>
                <span className="inline-block mt-2 text-body-sm bg-green-100 text-green-600 px-2 py-0.5 rounded-pill">{meal.tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-body-sm text-slate-400 text-center pb-6">
        Not a substitute for medical advice. Always follow your prescriber.
      </p>
    </div>
  )
}
