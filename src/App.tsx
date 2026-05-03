import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DoseLog from './pages/DoseLog'
import MealPlans from './pages/MealPlans'
import FoodLog from './pages/FoodLog'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Welcome from './pages/onboarding/Welcome'
import DrugSelection from './pages/onboarding/DrugSelection'
import DoseSchedule from './pages/onboarding/DoseSchedule'
import Goals from './pages/onboarding/Goals'
import Profile from './pages/onboarding/Profile'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { OnboardingProvider } from './hooks/useOnboarding'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen bg-warm-white text-slate-500">Loading...</div>
  if (!user) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <Routes>
          <Route path="/onboarding" element={<Welcome />} />
          <Route path="/onboarding/drug" element={<DrugSelection />} />
          <Route path="/onboarding/schedule" element={<DoseSchedule />} />
          <Route path="/onboarding/goals" element={<Goals />} />
          <Route path="/onboarding/profile" element={<Profile />} />
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
      </OnboardingProvider>
    </AuthProvider>
  )
}
