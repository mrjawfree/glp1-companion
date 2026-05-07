import { useEffect, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export interface NutritionGoals {
  calorie_goal: number
  protein_goal_g: number
  water_goal_ml: number
  source: 'manual' | 'suggested' | 'mixed'
  skipped_at: string | null
  updated_at: string
}

export function useNutritionGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<NutritionGoals | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', user.id)
      .single()
    setGoals(data ?? null)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const upsert = async (values: {
    calorie_goal: number
    protein_goal_g: number
    water_goal_ml: number
    source: 'manual' | 'suggested' | 'mixed'
  }) => {
    if (!user) return
    const { error } = await supabase
      .from('nutrition_goals')
      .upsert({ user_id: user.id, ...values }, { onConflict: 'user_id' })
    if (!error) await load()
    return error
  }

  const skip = async () => {
    if (!user) return
    const { error } = await supabase
      .from('nutrition_goals')
      .upsert(
        {
          user_id: user.id,
          calorie_goal: 2000,
          protein_goal_g: 100,
          water_goal_ml: 2000,
          source: 'manual' as const,
          skipped_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    if (!error) await load()
    return error
  }

  return { goals, loading, upsert, skip, reload: load }
}
