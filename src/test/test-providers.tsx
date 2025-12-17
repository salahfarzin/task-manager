import { ThemeProvider } from '@/contexts/ThemeContext'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'

// Custom render function that includes all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </I18nextProvider>
  )
}

export default AllTheProviders