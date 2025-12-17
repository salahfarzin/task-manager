import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { Header } from '../Header'
import { vi } from 'vitest'

// Mock the BoardSelector component since we're testing Header in isolation
vi.mock('../BoardSelector', () => ({
  BoardSelector: () => <div data-testid="board-selector">Board Selector</div>
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Moon: () => <div data-testid="moon-icon">Moon</div>,
  Sun: () => <div data-testid="sun-icon">Sun</div>,
  Languages: () => <div data-testid="languages-icon">Languages</div>,
}))

describe('Header', () => {
  let localStorageMock: any

  beforeEach(() => {
    localStorageMock = {
      getItem: vi.fn(() => null), // Default to null (light theme)
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
  })

  it('renders with light theme by default', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    )

    expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument()
  })

  it('renders with dark theme when stored', () => {
    localStorageMock.getItem.mockReturnValue('dark')

    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    )

    expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument()
  })

  it('toggles theme when button is clicked', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    )

    // Initially light theme - should show moon icon
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument()

    // Click the theme toggle button
    const themeButton = screen.getByLabelText('theme.toggle')
    fireEvent.click(themeButton)

    // Should now show sun icon (dark theme)
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument()

    // Click again to toggle back
    fireEvent.click(themeButton)

    // Should show moon icon again (light theme)
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument()
  })

  it('renders board selector', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    )

    expect(screen.getByTestId('board-selector')).toBeInTheDocument()
  })

  it('renders language toggle button', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    )

    expect(screen.getByLabelText('language.toggle')).toBeInTheDocument()
    expect(screen.getByTestId('languages-icon')).toBeInTheDocument()
  })

  it('renders app title', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    )

    expect(screen.getByText('app.title')).toBeInTheDocument()
  })
})