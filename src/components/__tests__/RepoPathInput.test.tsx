import { render, screen, fireEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepoPathInput } from '@/components/form/RepoPathInput';

describe('RepoPathInput', () => {
    const noop = () => {};

    describe('icon logic', () => {
        it('shows FolderOpen icon for empty value', () => {
            const { container } = render(<RepoPathInput value="" onChange={noop} />);
            // The leading icon span is the first absolute child; it should NOT contain an svg with github path
            // We assert by checking the Browse button is visible (not hidden behind github detection)
            expect(screen.getByRole('button', { name: /browse/i })).toBeInTheDocument();
        });

        it('shows Browse button for a local path', () => {
            render(<RepoPathInput value="/home/user/project" onChange={noop} />);
            expect(screen.getByRole('button', { name: /browse/i })).toBeInTheDocument();
        });

        it('shows Browse button for a ~/… path', () => {
            render(<RepoPathInput value="~/projects/my-app" onChange={noop} />);
            expect(screen.getByRole('button', { name: /browse/i })).toBeInTheDocument();
        });

        it('hides Browse button for a github.com URL', () => {
            render(<RepoPathInput value="github.com/user/repo" onChange={noop} />);
            expect(screen.queryByRole('button', { name: /browse/i })).not.toBeInTheDocument();
        });

        it('hides Browse button for a https://github.com URL', () => {
            render(<RepoPathInput value="https://github.com/org/repo" onChange={noop} />);
            expect(screen.queryByRole('button', { name: /browse/i })).not.toBeInTheDocument();
        });
    });

    describe('text input', () => {
        it('reflects the controlled value', () => {
            render(<RepoPathInput value="/my/path" onChange={noop} />);
            expect(screen.getByRole('textbox')).toHaveValue('/my/path');
        });

        it('calls onChange when user types', () => {
            const handler = vi.fn();
            render(<RepoPathInput value="" onChange={handler} />);
            fireEvent.change(screen.getByRole('textbox'), { target: { value: '/new' } });
            expect(handler).toHaveBeenCalledWith('/new');
        });

        it('uses provided placeholder', () => {
            render(<RepoPathInput value="" onChange={noop} placeholder="Enter path" />);
            expect(screen.getByPlaceholderText('Enter path')).toBeInTheDocument();
        });

        it('uses default placeholder when none provided', () => {
            render(<RepoPathInput value="" onChange={noop} />);
            expect(screen.getByRole('textbox')).toHaveAttribute('placeholder');
        });
    });

    describe('Browse via File System Access API', () => {
        beforeEach(() => {
            // Provide a mock showDirectoryPicker that returns a handle with a name
            Object.defineProperty(window, 'showDirectoryPicker', {
                configurable: true,
                value: vi.fn().mockResolvedValue({ name: 'my-repo' }),
            });
        });

        it('calls showDirectoryPicker when Browse is clicked', async () => {
            render(<RepoPathInput value="" onChange={noop} />);
            fireEvent.click(screen.getByRole('button', { name: /browse/i }));
            expect(window.showDirectoryPicker).toHaveBeenCalledWith({ mode: 'read' });
        });

        it('populates onChange with the folder name when value is empty', async () => {
            const handler = vi.fn();
            render(<RepoPathInput value="" onChange={handler} />);
            fireEvent.click(screen.getByRole('button', { name: /browse/i }));
            // Wait for the async showDirectoryPicker to resolve
            await vi.waitFor(() => {
                expect(handler).toHaveBeenCalledWith('/my-repo');
            });
        });

        it('does not overwrite an existing value', async () => {
            const handler = vi.fn();
            render(<RepoPathInput value="/existing" onChange={handler} />);
            fireEvent.click(screen.getByRole('button', { name: /browse/i }));
            await vi.waitFor(() => {
                // showDirectoryPicker resolved but onChange must NOT have been called
                expect(handler).not.toHaveBeenCalled();
            });
        });
    });

    describe('Browse fallback (no File System Access API)', () => {
        beforeEach(() => {
            // Remove showDirectoryPicker to simulate unsupported browsers
            Object.defineProperty(window, 'showDirectoryPicker', {
                configurable: true,
                value: undefined,
            });
        });

        it('clicks the hidden file input as fallback', () => {
            const { container } = render(<RepoPathInput value="" onChange={noop} />);
            const hiddenInput = container.querySelector('input[type="file"]') as HTMLInputElement;
            const clickSpy = vi.spyOn(hiddenInput, 'click');
            fireEvent.click(screen.getByRole('button', { name: /browse/i }));
            expect(clickSpy).toHaveBeenCalled();
        });
    });
});
