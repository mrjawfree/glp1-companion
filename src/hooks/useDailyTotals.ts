import { useEffect, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export interface DailyTotals {
  day: string
  calories: number
  protein_g: number
  water_ml: number
}

export function useDailyTotals(date: string) {
  const { user } = useAuth()
  const [totals, setTotals] = useState<DailyTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const { data, error: rpcError } = await supabase.rpc('daily_totals_local', {
      tz,
      start_date: date,
      end_date: date,
    })
    if (rpcError) {
      setError(rpcError.message)
      setTotals(null)
    } else {
      setTotals(data?.[0] ?? { day: date, calories: 0, protein_g: 0, water_ml: 0 })
    }
    setLoading(false)
  }, [user, date])

  useEffect(() => { load() }, [load])

  return { totals, loading, error, reload: load }
}

export function useWeeklyTotals(endDate: string) {
  const { user } = useAuth()
  const [days, setDays] = useState<DailyTotals[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const end = new Date(endDate)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const { data } = await supabase.rpc('daily_totals_local', {
      tz,
      start_date: start.toISOString().split('T')[0],
      end_date: endDate,
    })
    setDays(data ?? [])
    setLoading(false)
  }, [user, endDate])

  useEffect(() => { load() }, [load])

  return { days, loading, reload: load }
}
