import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface UserProfile {
  display_name: string
  medication: string
  subscription_tier: string
}

export default function Settings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual')

  useEffect(() => {
    if (user) {
      supabase.from('users').select('display_name, medication, subscription_tier').eq('id', user.id).single().then(({ data }) => {
        if (data) setProfile(data)
      })
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/onboarding')
  }

  if (showUpgrade) {
    return (
      <div className="px-4 pt-5">
        <button onClick={() => setShowUpgrade(false)} className="flex items-center gap-2 text-slate-500 mb-6">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>

        <h1 className="text-display-lg text-slate-900 mb-2">More from your GLP-1 Companion.</h1>
        <p className="text-body-lg text-slate-500 mb-6">Unlock deeper insights and unlimited features.</p>

        <div className="space-y-4 mb-6">
          {[
            { title: 'Unlimited meal plans', desc: 'Save as many weekly plans as you need' },
            { title: 'Provider-ready exports', desc: 'Share progress PDFs with your doctor' },
            { title: 'Photo food logging', desc: 'Snap a photo instead of searching' },
            { title: 'Side-effect insights', desc: 'See correlations between doses and how you feel' },
            { title: 'Custom macro goals', desc: 'Personalized protein, fiber, and calorie targets' },
          ].map(b => (
            <div key={b.title} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="#4A7C5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <p className="text-body-md font-semibold text-slate-900">{b.title}</p>
                <p className="text-body-sm text-slate-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 bg-slate-100 rounded-md p-1 mb-6">
          <button onClick={() => setPlan('monthly')}
            className={`flex-1 py-3 rounded-md text-center transition-colors ${
              plan === 'monthly' ? 'bg-white text-slate-700 shadow-elevation-1' : 'text-slate-400'
            }`}>
            <p className="text-body-md font-semibold">Monthly</p>
            <p className="text-body-sm text-slate-500">$9.99/mo</p>
          </button>
          <button onClick={() => setPlan('annual')}
            className={`flex-1 py-3 rounded-md text-center transition-colors relative ${
              plan === 'annual' ? 'bg-white text-slate-700 shadow-elevation-1' : 'text-slate-400'
            }`}>
            <p className="text-body-md font-semibold">Annual</p>
            <p className="text-body-sm text-slate-500">$59.99/yr</p>
            <span className="absolute -top-2 right-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-pill font-medium">Save 50%</span>
          </button>
        </div>

        <button className="w-full bg-slate-700 text-white py-4 rounded-md text-label uppercase tracking-wider hover:bg-slate-900 transition-colors mb-3">
          Start 7-day free trial
        </button>
        <p className="text-body-sm text-slate-400 text-center mb-3">Cancel any time in Settings · No charge during trial</p>
        <button className="w-full text-center text-info text-body-sm">Restore purchase</button>

        <div className="mt-6 flex justify-center gap-4 text-body-sm text-slate-400">
          <button className="hover:underline">Terms of Service</button>
          <button className="hover:underline">Privacy Policy</button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-5">
      <h1 className="text-title-lg text-slate-900 mb-5">Profile</h1>

      <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-title-lg font-semibold">
            {(profile?.display_name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-body-lg font-semibold text-slate-900">{profile?.display_name || 'User'}</p>
            <p className="text-body-sm text-slate-400">{user?.email}</p>
            {profile?.medication && (
              <p className="text-body-sm text-green-600 capitalize mt-1">{profile.medication}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body-md font-semibold text-slate-900">Subscription</p>
            <p className="text-body-sm text-slate-400">
              {profile?.subscription_tier === 'pro' ? 'Pro plan' : 'Free tier'}
            </p>
          </div>
          {profile?.subscription_tier !== 'pro' && (
            <button onClick={() => setShowUpgrade(true)}
              className="px-4 py-2 bg-slate-700 text-white text-label rounded-md hover:bg-slate-900 transition-colors">
              Upgrade
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-md shadow-elevation-1 p-5 mb-4">
        <p className="text-body-md font-semibold text-slate-900 mb-3">Quick links</p>
        <div className="space-y-3">
          <button onClick={() => navigate('/onboarding/drug')} className="w-full text-left text-body-md text-info">
            Update medication
          </button>
          <button onClick={() => navigate('/onboarding/goals')} className="w-full text-left text-body-md text-info">
            Change goals
          </button>
        </div>
      </div>

      <button onClick={handleSignOut}
        className="w-full py-4 bg-white border-2 border-slate-200 text-rose-500 rounded-md text-label font-medium hover:border-rose-500 transition-colors">
        Sign out
      </button>

      <p className="text-body-sm text-slate-400 text-center mt-6">
        GLP-1 Companion v0.1 · Not medical advice
      </p>
    </div>
  )
}
