import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { OnboardingProvider } from './hooks/useOnboarding'

const Layout = lazy(() => import('./components/Layout'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const DoseLog = lazy(() => import('./pages/DoseLog'))
const MealPlans = lazy(() => import('./pages/MealPlans'))
const FoodLog = lazy(() => import('./pages/FoodLog'))
const Progress = lazy(() => import('./pages/Progress'))
const Settings = lazy(() => import('./pages/Settings'))
const Login = lazy(() => import('./pages/Login'))
const Welcome = lazy(() => import('./pages/onboarding/Welcome'))
const ProfileSetup = lazy(() => import('./pages/onboarding/ProfileSetup'))
const GoalSetting = lazy(() => import('./pages/onboarding/GoalSetting'))
const NotificationPrimer = lazy(() => import('./pages/onboarding/NotificationPrimer'))
const FirstAction = lazy(() => import('./pages/onboarding/FirstAction'))

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

function LoadingFallback() {
  return <div className="flex items-center justify-center h-screen bg-warm-white text-slate-500">Loading...</div>
}

export default function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <OnboardingRouteTracker>
          <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingResume />} />
            <Route path="/onboarding/profile-setup" element={<ProfileSetup />} />
            <Route path="/onboarding/goals" element={<GoalSetting />} />
            <Route path="/onboarding/notifications" element={<NotificationPrimer />} />
            <Route path="/onboarding/first-action" element={<FirstAction />} />
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
          </Suspense>
        </OnboardingRouteTracker>
      </OnboardingProvider>
    </AuthProvider>
  )
}
