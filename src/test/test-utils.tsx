import { render, type RenderOptions } from '@testing-library/react'
import AllTheProviders from './test-providers'
import { type ReactElement } from 'react'

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Explicitly export only the needed functions from @testing-library/react
export {
  screen,
  fireEvent,
  waitFor,
  act,
  within,
  // add other exports you use from @testing-library/react here
} from '@testing-library/react'
export { customRender as render }