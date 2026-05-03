import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500">Track your GLP-1 journey</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/doses" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-primary-200 transition-colors">
          <span className="text-2xl">💉</span>
          <p className="mt-2 text-sm font-medium text-gray-700">Log Dose</p>
          <p className="text-xs text-gray-400">Track your medication</p>
        </Link>
        <Link to="/food" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-primary-200 transition-colors">
          <span className="text-2xl">📝</span>
          <p className="mt-2 text-sm font-medium text-gray-700">Log Food</p>
          <p className="text-xs text-gray-400">Track nutrition</p>
        </Link>
        <Link to="/meals" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-primary-200 transition-colors">
          <span className="text-2xl">🍽️</span>
          <p className="mt-2 text-sm font-medium text-gray-700">Meal Plans</p>
          <p className="text-xs text-gray-400">GLP-1 optimized</p>
        </Link>
        <Link to="/progress" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-primary-200 transition-colors">
          <span className="text-2xl">📊</span>
          <p className="mt-2 text-sm font-medium text-gray-700">Progress</p>
          <p className="text-xs text-gray-400">Weight & metrics</p>
        </Link>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-xs text-blue-600">
          ⚕️ This app is a wellness tool, not medical advice. Always consult your healthcare provider about your GLP-1 medication.
        </p>
      </div>
    </div>
  )
}
