import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-white px-4">
      <div className="max-w-sm w-full">
        <h1 className="text-display-lg text-center text-slate-900 mb-2">GLP-1 Companion</h1>
        <p className="text-center text-slate-500 text-body-lg mb-8">Track your journey, optimize your nutrition</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-md bg-white text-body-lg focus:border-slate-700 focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-md bg-white text-body-lg focus:border-slate-700 focus:outline-none"
            required
          />
          {error && <p className="text-rose-500 text-body-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-700 text-white rounded-md text-label uppercase tracking-wider hover:bg-slate-900 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-4 text-body-md text-info hover:underline"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
        <p className="mt-8 text-body-sm text-center text-slate-400">
          Not a substitute for medical advice. Always follow your prescriber.
        </p>
      </div>
    </div>
  )
}
