import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

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

function NutritionRing({ protein, fiber, proteinGoal, fiberGoal }: {
  protein: number; fiber: number; proteinGoal: number; fiberGoal: number
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
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {drawArc(68, protein / proteinGoal, '#4A7C5C', 10)}
        {drawArc(54, fiber / fiberGoal, '#8995A8', 8)}
        {drawArc(42, 0 / 8, '#C2CCD9', 6)}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-900 font-semibold" fontSize="20">{protein}g</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-500" fontSize="12">protein</text>
      </svg>
      <div className="flex gap-4 mt-3 text-body-sm text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600" />Protein</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" />Fiber</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" />Water</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [lastDose, setLastDose] = useState<DoseEntry | null>(null)
  const [todayProtein, setTodayProtein] = useState(0)
  const [todayFiber, setTodayFiber] = useState(0)

  useEffect(() => {
    if (!user) return
    supabase.from('users').select('display_name, medication, current_dose').eq('id', user.id).single().then(({ data }) => {
      if (data) setProfile(data)
    })
    supabase.from('dose_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1).then(({ data }) => {
      if (data?.[0]) setLastDose(data[0])
    })
    const today = new Date().toISOString().split('T')[0]
    supabase.from('food_entries').select('protein_g, fiber_g').eq('user_id', user.id).gte('logged_at', today).then(({ data }) => {
      if (data) {
        setTodayProtein(data.reduce((s, e) => s + (e.protein_g || 0), 0))
        setTodayFiber(data.reduce((s, e) => s + (e.fiber_g || 0), 0))
      }
    })
  }, [user])

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'there'

  const getDoseStatus = () => {
    if (!lastDose) return { status: 'none' as const, label: 'Add your medication to get started' }
    const doseDate = new Date(lastDose.logged_at)
    const now = new Date()
    const hoursSince = (now.getTime() - doseDate.getTime()) / (1000 * 60 * 60)
    if (hoursSince < 24) return {
      status: 'logged' as const,
      label: `Dose logged ${doseDate.toLocaleDateString('en-US', { weekday: 'long' })} ${doseDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    }
    if (hoursSince > 180) return { status: 'overdue' as const, label: 'Your dose was scheduled recently. Log it when you\'re ready.' }
    return { status: 'due' as const, label: 'Dose due soon' }
  }

  const doseStatus = getDoseStatus()

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-title-lg text-slate-900">{getGreeting()}, {displayName}.</h1>
        <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-body-md font-semibold">
          {displayName[0]?.toUpperCase()}
        </button>
      </div>

      <button
        onClick={() => navigate('/doses')}
        className={`w-full rounded-md p-5 mb-5 text-left transition-colors ${
          doseStatus.status === 'logged' ? 'bg-green-100 border border-green-400' :
          doseStatus.status === 'overdue' ? 'bg-amber-100 border border-amber-500' :
          doseStatus.status === 'due' ? 'bg-slate-100 border border-slate-300' :
          'bg-white border-2 border-dashed border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3">
          {doseStatus.status === 'logged' && (
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L7 12L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          )}
          {doseStatus.status === 'overdue' && (
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-white font-semibold text-body-sm">!</span>
            </div>
          )}
          <div>
            <p className={`text-body-lg font-semibold ${doseStatus.status === 'overdue' ? 'text-amber-500' : 'text-slate-900'}`}>
              {doseStatus.status === 'due' ? 'Log dose' : doseStatus.status === 'none' ? 'Add your medication' : 'Dose status'}
            </p>
            <p className="text-body-sm text-slate-500">{doseStatus.label}</p>
          </div>
        </div>
      </button>

      <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-5 flex justify-center">
        <NutritionRing protein={todayProtein} fiber={todayFiber} proteinGoal={90} fiberGoal={25} />
      </div>

      <div className="mb-5">
        <h2 className="text-title-md text-slate-900 mb-3">Gentle picks for today</h2>
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
      </div>

      <p className="text-body-sm text-slate-400 text-center pb-6">
        Not a substitute for medical advice. Always follow your prescriber.
      </p>
    </div>
  )
}
