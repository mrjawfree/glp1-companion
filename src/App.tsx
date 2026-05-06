import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DoseLog from './pages/DoseLog'
import MealPlans from './pages/MealPlans'
import FoodLog from './pages/FoodLog'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Welcome from './pages/onboarding/Welcome'
import MedicationSelect from './pages/onboarding/MedicationSelect'
import InjectionDays from './pages/onboarding/InjectionDays'
import DoseSetup from './pages/onboarding/DoseSetup'
import WeightGoal from './pages/onboarding/WeightGoal'
import Profile from './pages/onboarding/Profile'
import NotificationPrimer from './pages/onboarding/NotificationPrimer'
import ReviewConfirm from './pages/onboarding/ReviewConfirm'
import Success from './pages/onboarding/Success'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { OnboardingProvider } from './hooks/useOnboarding'

const ONBOARDING_ROUTE_KEY = 'glp1_onboarding_route'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen bg-warm-white text-slate-500">Loading...</div>
  if (!user) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function OnboardingRouteTracker({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  useEffect(() => {
    if (location.pathname.startsWith('/onboarding') && location.pathname !== '/onboarding') {
      localStorage.setItem(ONBOARDING_ROUTE_KEY, location.pathname)
    }
  }, [location.pathname])
  return <>{children}</>
}

function OnboardingResume() {
  const savedRoute = localStorage.getItem(ONBOARDING_ROUTE_KEY)
  if (savedRoute && savedRoute !== '/onboarding') {
    return <Navigate to={savedRoute} replace />
  }
  return <Welcome />
}

export default function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <OnboardingRouteTracker>
          <Routes>
            <Route path="/onboarding" element={<OnboardingResume />} />
            <Route path="/onboarding/medication" element={<MedicationSelect />} />
            <Route path="/onboarding/injection-days" element={<InjectionDays />} />
            <Route path="/onboarding/notifications" element={<NotificationPrimer />} />
            <Route path="/onboarding/dose" element={<DoseSetup />} />
            <Route path="/onboarding/weight-goal" element={<WeightGoal />} />
            <Route path="/onboarding/review" element={<ReviewConfirm />} />
            <Route path="/onboarding/profile" element={<Profile />} />
            <Route path="/onboarding/success" element={<Success />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="doses" element={<DoseLog />} />
              <Route path="meals" element={<MealPlans />} />
              <Route path="food" element={<FoodLog />} />
              <Route path="progress" element={<Progress />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </OnboardingRouteTracker>
      </OnboardingProvider>
    </AuthProvider>
  )
}
