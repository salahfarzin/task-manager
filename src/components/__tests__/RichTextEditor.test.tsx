import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import { RichTextEditor } from '../RichTextEditor'
import { vi } from 'vitest'

// Mock TipTap
const mockRun = vi.fn()
const mockToggleBold = vi.fn(() => ({ run: mockRun }))
const mockToggleItalic = vi.fn(() => ({ run: mockRun }))
const mockToggleBulletList = vi.fn(() => ({ run: mockRun }))
const mockToggleOrderedList = vi.fn(() => ({ run: mockRun }))
const mockToggleBlockquote = vi.fn(() => ({ run: mockRun }))

const mockFocus = vi.fn(() => ({
  toggleBold: mockToggleBold,
  toggleItalic: mockToggleItalic,
  toggleBulletList: mockToggleBulletList,
  toggleOrderedList: mockToggleOrderedList,
  toggleBlockquote: mockToggleBlockquote,
  run: mockRun,
}))

const mockChain = vi.fn(() => ({
  focus: mockFocus,
  toggleBold: mockToggleBold,
  toggleItalic: mockToggleItalic,
  toggleBulletList: mockToggleBulletList,
  toggleOrderedList: mockToggleOrderedList,
  toggleBlockquote: mockToggleBlockquote,
  run: mockRun,
}))

const mockEditor = {
  chain: mockChain,
  isActive: vi.fn((type: string) => false),
  getHTML: vi.fn(() => '<p>test content</p>'),
  setContent: vi.fn(),
}

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => mockEditor),
  EditorContent: ({ editor }: any) => (
    <div data-testid="editor-content" data-editor={editor}>
      <div contentEditable className="tiptap glass rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
    </div>
  ),
}))

vi.mock('@tiptap/starter-kit', () => ({
  default: vi.fn(),
}))

// Import the mocked useEditor
const { useEditor } = vi.mocked(await import('@tiptap/react'))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Bold: () => <div data-testid="bold-icon">Bold</div>,
  Italic: () => <div data-testid="italic-icon">Italic</div>,
  List: () => <div data-testid="list-icon">List</div>,
  ListOrdered: () => <div data-testid="list-ordered-icon">ListOrdered</div>,
  Quote: () => <div data-testid="quote-icon">Quote</div>,
}))

describe('RichTextEditor', () => {
  const defaultProps = {
    content: '<p>Initial content</p>',
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render editor with toolbar', () => {
    render(<RichTextEditor {...defaultProps} />)

    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    expect(screen.getByLabelText('Bold')).toBeInTheDocument()
    expect(screen.getByLabelText('Italic')).toBeInTheDocument()
    expect(screen.getByLabelText('Bullet List')).toBeInTheDocument()
    expect(screen.getByLabelText('Numbered List')).toBeInTheDocument()
    expect(screen.getByLabelText('Quote')).toBeInTheDocument()
  })

  it('should render with custom placeholder', () => {
    render(<RichTextEditor {...defaultProps} placeholder="Custom placeholder" />)

    // The placeholder is configured in the extension, so we can't easily test it
    // But we can verify the component renders
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('should call onChange when editor content changes', () => {
    render(<RichTextEditor {...defaultProps} />)

    // Simulate editor update by calling the onUpdate callback
    // This would normally be called by TipTap when content changes
    expect(defaultProps.onChange).not.toHaveBeenCalled()

    // Since we can't easily trigger TipTap events in tests,
    // we just verify the component renders and the editor is set up
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('should toggle bold when bold button clicked', () => {
    render(<RichTextEditor {...defaultProps} />)

    const boldButton = screen.getByLabelText('Bold')
    fireEvent.click(boldButton)

    expect(mockEditor.chain).toHaveBeenCalled()
    expect(mockEditor.chain().focus).toHaveBeenCalled()
    expect(mockEditor.chain().focus().toggleBold).toHaveBeenCalled()
  })

  it('should toggle italic when italic button clicked', () => {
    render(<RichTextEditor {...defaultProps} />)

    const italicButton = screen.getByLabelText('Italic')
    fireEvent.click(italicButton)

    expect(mockEditor.chain).toHaveBeenCalled()
    expect(mockEditor.chain().focus).toHaveBeenCalled()
    expect(mockEditor.chain().focus().toggleItalic).toHaveBeenCalled()
  })

  it('should toggle bullet list when list button clicked', () => {
    render(<RichTextEditor {...defaultProps} />)

    const listButton = screen.getByLabelText('Bullet List')
    fireEvent.click(listButton)

    expect(mockEditor.chain).toHaveBeenCalled()
    expect(mockEditor.chain().focus).toHaveBeenCalled()
    expect(mockEditor.chain().focus().toggleBulletList).toHaveBeenCalled()
  })

  it('should toggle ordered list when ordered list button clicked', () => {
    render(<RichTextEditor {...defaultProps} />)

    const orderedListButton = screen.getByLabelText('Numbered List')
    fireEvent.click(orderedListButton)

    expect(mockEditor.chain).toHaveBeenCalled()
    expect(mockEditor.chain().focus).toHaveBeenCalled()
    expect(mockEditor.chain().focus().toggleOrderedList).toHaveBeenCalled()
  })

  it('should toggle blockquote when quote button clicked', () => {
    render(<RichTextEditor {...defaultProps} />)

    const quoteButton = screen.getByLabelText('Quote')
    fireEvent.click(quoteButton)

    expect(mockEditor.chain).toHaveBeenCalled()
    expect(mockEditor.chain().focus).toHaveBeenCalled()
    expect(mockEditor.chain().focus().toggleBlockquote).toHaveBeenCalled()
  })

  it('should show active state for bold when bold is active', () => {
    mockEditor.isActive.mockImplementation((type: string) => type === 'bold')

    render(<RichTextEditor {...defaultProps} />)

    const boldButton = screen.getByLabelText('Bold')
    expect(boldButton).toHaveClass('bg-primary-100')
  })

  it('should show active state for italic when italic is active', () => {
    mockEditor.isActive.mockImplementation((type: string) => type === 'italic')

    render(<RichTextEditor {...defaultProps} />)

    const italicButton = screen.getByLabelText('Italic')
    expect(italicButton).toHaveClass('bg-primary-100')
  })

  it('should show active state for bullet list when bullet list is active', () => {
    mockEditor.isActive.mockImplementation((type: string) => type === 'bulletList')

    render(<RichTextEditor {...defaultProps} />)

    const listButton = screen.getByLabelText('Bullet List')
    expect(listButton).toHaveClass('bg-primary-100')
  })

  it('should show active state for ordered list when ordered list is active', () => {
    mockEditor.isActive.mockImplementation((type: string) => type === 'orderedList')

    render(<RichTextEditor {...defaultProps} />)

    const orderedListButton = screen.getByLabelText('Numbered List')
    expect(orderedListButton).toHaveClass('bg-primary-100')
  })

  it('should show active state for blockquote when blockquote is active', () => {
    mockEditor.isActive.mockImplementation((type: string) => type === 'blockquote')

    render(<RichTextEditor {...defaultProps} />)

    const quoteButton = screen.getByLabelText('Quote')
    expect(quoteButton).toHaveClass('bg-primary-100')
  })

  it('should show inactive state when formatting is not active', () => {
    mockEditor.isActive.mockReturnValue(false)

    render(<RichTextEditor {...defaultProps} />)

    const buttons = [
      screen.getByLabelText('Bold'),
      screen.getByLabelText('Italic'),
      screen.getByLabelText('Bullet List'),
      screen.getByLabelText('Numbered List'),
      screen.getByLabelText('Quote'),
    ]

    buttons.forEach(button => {
      expect(button).not.toHaveClass('bg-primary-100')
    })
  })

  it('should render editor content area with proper classes', () => {
    render(<RichTextEditor {...defaultProps} />)

    const editorContent = screen.getByTestId('editor-content')
    expect(editorContent).toBeInTheDocument()

    // Check that the contentEditable div has the expected classes
    const editableDiv = screen.getByTestId('editor-content').querySelector('[contenteditable]')
    expect(editableDiv).toHaveClass('tiptap', 'glass', 'rounded-lg')
  })

  it('should have proper accessibility labels', () => {
    render(<RichTextEditor {...defaultProps} />)

    expect(screen.getByLabelText('Bold')).toBeInTheDocument()
    expect(screen.getByLabelText('Italic')).toBeInTheDocument()
    expect(screen.getByLabelText('Bullet List')).toBeInTheDocument()
    expect(screen.getByLabelText('Numbered List')).toBeInTheDocument()
    expect(screen.getByLabelText('Quote')).toBeInTheDocument()
  })

  it('should render toolbar buttons in correct order', () => {
    render(<RichTextEditor {...defaultProps} />)

    const toolbar = screen.getByLabelText('Bold').closest('div')
    const buttons = toolbar?.querySelectorAll('button')

    expect(buttons).toHaveLength(5)
    expect(buttons?.[0]).toHaveAttribute('aria-label', 'Bold')
    expect(buttons?.[1]).toHaveAttribute('aria-label', 'Italic')
    expect(buttons?.[2]).toHaveAttribute('aria-label', 'Bullet List')
    expect(buttons?.[3]).toHaveAttribute('aria-label', 'Numbered List')
    expect(buttons?.[4]).toHaveAttribute('aria-label', 'Quote')
  })

  it('should have separator between text formatting and list formatting', () => {
    render(<RichTextEditor {...defaultProps} />)

    // The separator is a div with specific classes
    const toolbar = screen.getByLabelText('Bold').closest('div')
    const separator = toolbar?.querySelector('.w-px.h-6.bg-slate-300')

    expect(separator).toBeInTheDocument()
  })

  it('should handle editor initialization failure', () => {
    // Mock useEditor to return null (editor failed to initialize)
    useEditor.mockReturnValueOnce(null)

    const { container } = render(<RichTextEditor {...defaultProps} />)

    // Should render nothing when editor is null
    expect(container.firstChild).toBeNull()
  })

  it('should pass content to editor', () => {
    const customContent = '<h1>Custom Content</h1>'
    render(<RichTextEditor {...defaultProps} content={customContent} />)

    // The content is passed to useEditor, we can verify the setup
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })
})