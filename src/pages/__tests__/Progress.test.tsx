import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Progress from '../Progress'

const mockSelect = vi.fn()
const mockFrom = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    session: { access_token: 'token' },
    loading: false,
  }),
}))

vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

function buildQueryChain(data: unknown) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.gte = vi.fn().mockReturnValue(chain)
  chain.lt = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockResolvedValue({ data, error: null })
  chain.single = vi.fn().mockResolvedValue({ data, error: null })
  return chain
}

function setupMocks(opts: {
  progressEntries?: unknown[]
  doseLogs?: unknown[]
  settings?: Record<string, unknown>
  meals?: unknown[]
} = {}) {
  const { progressEntries = [], doseLogs = [], settings = {}, meals = [] } = opts

  mockFrom.mockImplementation((table: string) => {
    if (table === 'progress_tracking') return buildQueryChain(progressEntries)
    if (table === 'dose_logs') return buildQueryChain(doseLogs)
    if (table === 'user_settings') return buildQueryChain(settings)
    if (table === 'meals') return buildQueryChain(meals)
    return buildQueryChain(null)
  })
}

function renderProgress() {
  return render(
    <MemoryRouter>
      <Progress />
    </MemoryRouter>,
  )
}

describe('Progress Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton initially then empty state when no data', async () => {
    setupMocks()
    renderProgress()
    await waitFor(() => {
      expect(screen.getByText('Nothing tracked yet')).toBeInTheDocument()
    })
  })

  it('renders weight and adherence when data exists', async () => {
    const today = new Date().toISOString()
    setupMocks({
      progressEntries: [
        { id: '1', recorded_at: today, weight_lbs: 185, weight_kg: 83.9, waist_cm: null, energy_level: null, measurements: null, notes: null },
      ],
      doseLogs: [
        { id: 'd1', logged_at: today },
      ],
      settings: { weight_unit: 'lbs', goal_weight: 170 },
    })
    renderProgress()
    await waitFor(() => {
      expect(screen.getByText('185 lb')).toBeInTheDocument()
      expect(screen.getByText('Goal: 170 lb')).toBeInTheDocument()
    })
  })

  it('opens weekly summary sheet on button click', async () => {
    const today = new Date().toISOString()
    setupMocks({
      progressEntries: [
        { id: '1', recorded_at: today, weight_lbs: 185, weight_kg: 83.9, waist_cm: null, energy_level: null, measurements: null, notes: null },
      ],
      doseLogs: [{ id: 'd1', logged_at: today }],
      settings: { weight_unit: 'lbs' },
      meals: [
        { id: 'm1', meal_type: 'lunch', calories: 500, logged_at: today },
        { id: 'm2', meal_type: 'dinner', calories: 600, logged_at: today },
      ],
    })
    renderProgress()

    await waitFor(() => {
      expect(screen.getByText('Weekly Summary')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByText('Weekly Summary'))

    await waitFor(() => {
      expect(screen.getByText('Meals logged this week')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('shows real meal count and avg calories in weekly summary', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    setupMocks({
      progressEntries: [
        { id: '1', recorded_at: today.toISOString(), weight_lbs: 180, weight_kg: 81.6, waist_cm: null, energy_level: null, measurements: null, notes: null },
      ],
      doseLogs: [{ id: 'd1', logged_at: today.toISOString() }],
      settings: { weight_unit: 'lbs' },
      meals: [
        { id: 'm1', meal_type: 'breakfast', calories: 400, logged_at: today.toISOString() },
        { id: 'm2', meal_type: 'lunch', calories: 600, logged_at: today.toISOString() },
        { id: 'm3', meal_type: 'dinner', calories: 700, logged_at: yesterday.toISOString() },
      ],
    })
    renderProgress()

    await waitFor(() => {
      expect(screen.getByText('Weekly Summary')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByText('Weekly Summary'))

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Avg daily calories')).toBeInTheDocument()
    })
  })

  it('uses weight_unit from settings', async () => {
    const today = new Date().toISOString()
    setupMocks({
      progressEntries: [
        { id: '1', recorded_at: today, weight_lbs: null, weight_kg: 84.0, waist_cm: null, energy_level: null, measurements: null, notes: null },
      ],
      doseLogs: [{ id: 'd1', logged_at: today }],
      settings: { weight_unit: 'kg', goal_weight: 75 },
    })
    renderProgress()
    await waitFor(() => {
      expect(screen.getByText('84 kg')).toBeInTheDocument()
      expect(screen.getByText('Goal: 75 kg')).toBeInTheDocument()
    })
  })

  it('fires progress_view telemetry event after loading', async () => {
    const { trackEvent } = await import('../../lib/analytics')
    setupMocks()
    renderProgress()
    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith('progress_view')
    })
  })
})
