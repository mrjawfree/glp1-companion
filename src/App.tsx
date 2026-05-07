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
const NotificationPrimer = lazy(() => import('./pages/onboarding/NotificationPrimer'))
const FirstMealEntry = lazy(() => import('./pages/onboarding/FirstMealEntry'))
const Success = lazy(() => import('./pages/onboarding/Success'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))

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

function OnboardingGate() {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center h-screen bg-warm-white text-slate-500">Loading...</div>

  if (user) {
    return <Navigate to="/" replace />
  }

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
            <Route path="/onboarding" element={<OnboardingGate />} />
            <Route path="/onboarding/profile-setup" element={<ProfileSetup />} />
            <Route path="/onboarding/notifications" element={<NotificationPrimer />} />
            <Route path="/onboarding/first-meal" element={<FirstMealEntry />} />
            <Route path="/onboarding/success" element={<Success />} />
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
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
