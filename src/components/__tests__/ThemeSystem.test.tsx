import { render as rtlRender, screen, fireEvent, waitFor } from '../../test/test-utils'
import { render } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext'
import { vi } from 'vitest'
import { mockLocalStorage, mockDocumentElement } from '../../test/test-helpers'

// Test component that uses the theme hook
const TestThemeComponent = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={toggleTheme} data-testid="theme-toggle" aria-label="Toggle theme">
        Toggle to {theme === 'light' ? 'dark' : 'light'}
      </button>
    </div>
  )
}

describe('Theme System', () => {
  let localStorageMock: ReturnType<typeof mockLocalStorage>
  let documentMock: ReturnType<typeof mockDocumentElement>

  beforeEach(() => {
    // Setup mocks using helper functions
    localStorageMock = mockLocalStorage()
    documentMock = mockDocumentElement()

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    Object.defineProperty(window.document, 'documentElement', {
      value: documentMock,
      writable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('ThemeProvider', () => {
    it('should initialize with stored theme preference', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue('dark')

      // Act
      render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      )

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme')
      expect(documentMock.classList.add).toHaveBeenCalledWith('dark')
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })

    it('should default to light theme when no preference stored', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null)

      // Act
      render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      )

      // Assert
      expect(documentMock.classList.add).toHaveBeenCalledWith('light')
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })

    it('should toggle theme and persist to localStorage', async () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue('light')

      render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      )

      // Act
      fireEvent.click(screen.getByTestId('theme-toggle'))

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      })
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
      expect(documentMock.classList.add).toHaveBeenCalledWith('dark')
    })

    it('should handle invalid stored theme gracefully', () => {
      // Arrange - ThemeContext accepts any string, doesn't validate
      localStorageMock.getItem.mockReturnValue('invalid-theme')

      // Act
      render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      )

      // Assert - uses whatever is stored (no validation)
      expect(documentMock.classList.add).toHaveBeenCalledWith('invalid-theme')
      expect(screen.getByTestId('current-theme')).toHaveTextContent('invalid-theme')
    })
  })

  describe('useTheme hook', () => {
    it('should throw error when used outside provider', () => {
      // Arrange & Act & Assert - use original render without providers
      expect(() => render(<TestThemeComponent />)).toThrow(
        'useTheme must be used within ThemeProvider'
      )
    })

    it('should provide theme context when used inside provider', () => {
      // Arrange & Act
      render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      )

      // Assert
      expect(screen.getByTestId('current-theme')).toBeInTheDocument()
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for theme toggle', () => {
      render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      )

      const toggleButton = screen.getByTestId('theme-toggle')
      expect(toggleButton).toHaveAttribute('aria-label', expect.stringContaining('theme'))
    })
  })
})