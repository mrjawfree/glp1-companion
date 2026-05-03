import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Settings</h2>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">Signed in as</p>
        <p className="font-medium text-gray-800">{user?.email}</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-800 mb-2">Subscription</h3>
        <p className="text-sm text-gray-500">Free tier</p>
        <button className="mt-3 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
          Upgrade to Pro
        </button>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100"
      >
        Sign Out
      </button>
    </div>
  )
}
