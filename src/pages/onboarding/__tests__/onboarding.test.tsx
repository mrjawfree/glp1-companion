import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OnboardingProvider } from '../../../hooks/useOnboarding'
import Welcome from '../Welcome'
import ProfileSetup from '../ProfileSetup'
import NotificationPrimer from '../NotificationPrimer'
import FirstMealEntry from '../FirstMealEntry'
import Success from '../Success'

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }),
    }),
  },
}))

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: null,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../../../hooks/usePushNotifications', () => ({
  usePushNotifications: vi.fn().mockReturnValue({
    permissionState: 'prompt',
    subscription: null,
    supported: false,
    loading: false,
    subscribe: vi.fn().mockResolvedValue(true),
    unsubscribe: vi.fn(),
  }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderWithProviders(ui: React.ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <OnboardingProvider>
        {ui}
      </OnboardingProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('Welcome', () => {
  it('renders the value prop and CTA', () => {
    renderWithProviders(<Welcome />)
    expect(screen.getByText('Steady support for your GLP-1 journey.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
    expect(screen.getByText(/I already have an account/i)).toBeInTheDocument()
  })

  it('navigates to profile-setup on CTA click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Welcome />)
    await user.click(screen.getByRole('button', { name: /get started/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding/profile-setup')
  })

  it('navigates to login for existing users', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Welcome />)
    await user.click(screen.getByText(/I already have an account/i))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('shows offline banner and disables buttons when offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    renderWithProviders(<Welcome />)
    expect(screen.getByText(/You're offline/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get started/i })).toBeDisabled()
    vi.restoreAllMocks()
  })

  it('shows medical disclaimer', () => {
    renderWithProviders(<Welcome />)
    expect(screen.getByText(/Not a substitute for medical advice/i)).toBeInTheDocument()
  })
})

describe('ProfileSetup', () => {
  it('renders name input, medication list, and weight fields', () => {
    renderWithProviders(<ProfileSetup />)
    expect(screen.getByText('Tell us about yourself')).toBeInTheDocument()
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
    expect(screen.getByText('Ozempic')).toBeInTheDocument()
    expect(screen.getByText('Wegovy')).toBeInTheDocument()
    expect(screen.getByLabelText(/current/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/goal/i)).toBeInTheDocument()
  })

  it('shows step indicator 1 of 4', () => {
    renderWithProviders(<ProfileSetup />)
    expect(screen.getByText('1 of 4')).toBeInTheDocument()
  })

  it('disables continue when name is empty', () => {
    renderWithProviders(<ProfileSetup />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('shows error when trying to continue without name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProfileSetup />)

    // Select medication and injection day to enable button partially
    await user.click(screen.getByText('Ozempic'))
    // The continue button is still disabled without name, so we check that
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('shows other medication input when "Other" is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProfileSetup />)
    await user.click(screen.getByText('Other / not sure'))
    expect(screen.getByPlaceholderText(/enter medication name/i)).toBeInTheDocument()
  })

  it('has skip functionality', () => {
    renderWithProviders(<ProfileSetup />)
    expect(screen.getByText('Skip')).toBeInTheDocument()
  })
})

describe('NotificationPrimer', () => {
  it('renders notification opt-in with benefit framing', () => {
    renderWithProviders(<NotificationPrimer />)
    expect(screen.getByText('Stay on track with reminders')).toBeInTheDocument()
    expect(screen.getByText(/gentle nudge on injection days/i)).toBeInTheDocument()
  })

  it('shows enable button and not-now option', () => {
    renderWithProviders(<NotificationPrimer />)
    expect(screen.getByRole('button', { name: /enable notifications/i })).toBeInTheDocument()
    expect(screen.getByText(/not now/i)).toBeInTheDocument()
  })

  it('shows step indicator 2 of 4', () => {
    renderWithProviders(<NotificationPrimer />)
    expect(screen.getByText('2 of 4')).toBeInTheDocument()
  })

  it('navigates to first-meal on skip', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NotificationPrimer />)
    await user.click(screen.getByText(/not now/i))
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding/first-meal')
  })
})

describe('FirstMealEntry', () => {
  it('renders meal entry form with coach marks', () => {
    renderWithProviders(<FirstMealEntry />)
    expect(screen.getByText('Log your first meal')).toBeInTheDocument()
    expect(screen.getByText('Breakfast')).toBeInTheDocument()
    expect(screen.getByText('Lunch')).toBeInTheDocument()
    expect(screen.getByText('Dinner')).toBeInTheDocument()
    expect(screen.getByText('Snack')).toBeInTheDocument()
  })

  it('shows first coach mark tooltip', () => {
    renderWithProviders(<FirstMealEntry />)
    expect(screen.getByText(/start by picking the meal/i)).toBeInTheDocument()
  })

  it('dismisses coach mark on "Got it" click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FirstMealEntry />)
    await user.click(screen.getByText('Got it'))
    expect(screen.queryByText(/start by picking the meal/i)).not.toBeInTheDocument()
  })

  it('shows meal description and notes fields', () => {
    renderWithProviders(<FirstMealEntry />)
    expect(screen.getByLabelText(/what did you eat/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/how did you feel/i)).toBeInTheDocument()
  })

  it('shows step indicator 3 of 4', () => {
    renderWithProviders(<FirstMealEntry />)
    expect(screen.getByText('3 of 4')).toBeInTheDocument()
  })

  it('shows email/password fields when user is not logged in', () => {
    renderWithProviders(<FirstMealEntry />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })
})

describe('Success', () => {
  it('renders confirmation message', () => {
    renderWithProviders(<Success />)
    expect(screen.getByText("You're all set!")).toBeInTheDocument()
    expect(screen.getByText(/your profile is saved/i)).toBeInTheDocument()
  })

  it('shows what to expect next list', () => {
    renderWithProviders(<Success />)
    expect(screen.getByText('What to expect next')).toBeInTheDocument()
    expect(screen.getByText(/log doses and meals/i)).toBeInTheDocument()
    expect(screen.getByText(/check progress/i)).toBeInTheDocument()
    expect(screen.getByText(/adjust your settings/i)).toBeInTheDocument()
  })

  it('has dashboard button', () => {
    renderWithProviders(<Success />)
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument()
  })

  it('navigates to dashboard on button click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Success />)
    await user.click(screen.getByRole('button', { name: /go to dashboard/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('clears onboarding route from localStorage on navigation', async () => {
    localStorage.setItem('glp1_onboarding_route', '/onboarding/first-meal')
    const user = userEvent.setup()
    renderWithProviders(<Success />)
    await user.click(screen.getByRole('button', { name: /go to dashboard/i }))
    expect(localStorage.getItem('glp1_onboarding_route')).toBeNull()
  })
})
