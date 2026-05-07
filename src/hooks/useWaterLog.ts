import { useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export function useWaterLog() {
  const { user } = useAuth()

  const logWater = useCallback(async (amountMl: number) => {
    if (!user) return null
    const { data, error } = await supabase
      .from('water_logs')
      .insert({ user_id: user.id, amount_ml: amountMl })
      .select()
      .single()
    if (error) return null
    return data
  }, [user])

  return { logWater }
}
