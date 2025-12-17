import { render, screen, act } from '../../test/test-utils'
import { FileUpload } from '../FileUpload'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
  I18nextProvider: ({ children }: any) => <>{children}</>,
}))

// Mock react-dropzone
const mockGetRootProps = vi.fn(() => ({}))
const mockGetInputProps = vi.fn(() => ({ type: 'file' }))

vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn(),
}))

// Mock URL.createObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-url'),
})

// Mock Zustand store
const mockStore = {
  addAttachment: vi.fn(),
}

vi.mock('../../store/taskStore', () => ({
  useTaskStore: () => mockStore,
}))

// Import the mocked useDropzone
const { useDropzone } = vi.mocked(await import('react-dropzone'))

describe('FileUpload', () => {
  const defaultProps = {
    taskId: 'task-1',
    onClose: vi.fn(),
  }

  let capturedOnDrop: (files: File[]) => void;

  beforeEach(() => {
    vi.clearAllMocks()
    useDropzone.mockImplementation((config: any) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: mockGetRootProps,
        getInputProps: mockGetInputProps,
        open: vi.fn(),
        isDragActive: false,
      } as any;
    })
  })

  it('should render upload area', () => {
    render(<FileUpload {...defaultProps} />)

    expect(screen.getByText('task.addAttachment')).toBeInTheDocument()
    expect(screen.getByText(/Drag & drop files here/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('should call onClose when close button clicked', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('should show drag active state when isDragActive is true', () => {
    useDropzone.mockImplementation((config: any) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: mockGetRootProps,
        getInputProps: mockGetInputProps,
        open: vi.fn(),
        isDragActive: true,
      } as any;
    })

    render(<FileUpload {...defaultProps} />)

    expect(screen.getByText('Drop files here...')).toBeInTheDocument()
  })

  it('should handle file drop correctly', () => {
    render(<FileUpload {...defaultProps} />)

    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

    // Simulate drop
    act(() => {
      if (capturedOnDrop) {
        capturedOnDrop([mockFile])
      }
    })

    expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockFile)
    expect(mockStore.addAttachment).toHaveBeenCalledWith('task-1', expect.objectContaining({
      name: 'test.txt',
      type: 'text/plain'
    }))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should process multiple files', () => {
    render(<FileUpload {...defaultProps} />)

    const mockFiles = [
      new File(['content1'], 'file1.txt', { type: 'text/plain' }),
      new File(['content2'], 'file2.jpg', { type: 'image/jpeg' }),
    ]

    act(() => {
      if (capturedOnDrop) {
        capturedOnDrop(mockFiles)
      }
    })

    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(2)
    expect(mockStore.addAttachment).toHaveBeenCalledTimes(2)
  })

  it('should have proper accessibility attributes', () => {
    const { container } = render(<FileUpload {...defaultProps} />)

    const fileInput = container.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
  })
})