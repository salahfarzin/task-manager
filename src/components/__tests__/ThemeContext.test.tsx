import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext'
import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock document.documentElement
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn(),
}
Object.defineProperty(window.document, 'documentElement', {
  value: {
    classList: mockClassList,
  }
})

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ThemeProvider', () => {
    it('loads theme from localStorage on mount', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      )

      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme')
      expect(mockClassList.add).toHaveBeenCalledWith('dark')
      expect(mockClassList.remove).toHaveBeenCalledWith('light', 'dark')
    })

    it('defaults to light theme when no stored theme', () => {
      localStorageMock.getItem.mockReturnValue(null)

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      )

      expect(mockClassList.add).toHaveBeenCalledWith('light')
    })

    it('toggles theme correctly', () => {
      localStorageMock.getItem.mockReturnValue('light')

      const TestComponent = () => {
        const { theme, toggleTheme } = useTheme()
        return (
          <div>
            <span data-testid="theme">{theme}</span>
            <button onClick={toggleTheme} data-testid="toggle">Toggle</button>
          </div>
        )
      }

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('light')

      fireEvent.click(screen.getByTestId('toggle'))

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('updates localStorage when theme changes', () => {
      localStorageMock.getItem.mockReturnValue('light')

      const TestComponent = () => {
        const { toggleTheme } = useTheme()
        return <button onClick={toggleTheme} data-testid="toggle">Toggle</button>
      }

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      fireEvent.click(screen.getByTestId('toggle'))

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    })

    it('applies theme class to document root', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      )

      expect(mockClassList.remove).toHaveBeenCalledWith('light', 'dark')
      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })
  })

  describe('useTheme hook', () => {
    it('throws error when used outside ThemeProvider', () => {
      const TestComponent = () => {
        useTheme()
        return <div>Test</div>
      }

      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => render(<TestComponent />)).toThrow(
        'useTheme must be used within ThemeProvider'
      )

      consoleSpy.mockRestore()
    })

    it('provides theme context when used inside ThemeProvider', () => {
      localStorageMock.getItem.mockReturnValue('light')

      const TestComponent = () => {
        const { theme, toggleTheme } = useTheme()
        return (
          <div>
            <span data-testid="theme">{theme}</span>
            <button onClick={toggleTheme} data-testid="toggle">Toggle</button>
          </div>
        )
      }

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('light')
      expect(typeof screen.getByTestId('toggle')).toBe('object')
    })
  })
})