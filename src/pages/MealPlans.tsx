import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface MealPlan {
  id: string
  title: string
  description: string
  tags: string[]
  calories_target: number
  protein_target_g: number
  fiber_target_g: number
}

export default function MealPlans() {
  const [plans, setPlans] = useState<MealPlan[]>([])

  useEffect(() => {
    loadPlans()
  }, [])

  async function loadPlans() {
    const { data } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('is_template', true)
      .order('title')
    if (data) setPlans(data)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Meal Plans</h2>
      <p className="text-sm text-gray-500">GLP-1 optimized: high protein, high fiber, smaller portions</p>

      <div className="space-y-3">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-800">{plan.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
            <div className="mt-3 flex gap-2 flex-wrap">
              {plan.tags.map(tag => (
                <span key={tag} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-gray-500">
              <span>{plan.calories_target} cal</span>
              <span>{plan.protein_target_g}g protein</span>
              <span>{plan.fiber_target_g}g fiber</span>
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <p className="text-center text-gray-400 py-8">Meal plans coming soon.</p>
        )}
      </div>
    </div>
  )
}
