import React, { useRef } from 'react';
import { FolderOpen, Github } from 'lucide-react';
import { Button } from './Button';

const isGitHubUrl = (value: string) =>
    /^(https?:\/\/)?(www\.)?github\.com\//i.test(value.trim());

export interface RepoPathInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const RepoPathInput: React.FC<RepoPathInputProps> = ({
    value,
    onChange,
    placeholder = 'github.com/user/repo  or  /local/path',
    className,
}) => {
    const browseRef = useRef<HTMLInputElement>(null);

    const handleBrowse = async () => {
        // Try modern File System Access API first (Chrome / Edge 86+)
        if ('showDirectoryPicker' in window) {
            try {
                // @ts-expect-error – showDirectoryPicker not yet in all TS libs
                const handle = await window.showDirectoryPicker({ mode: 'read' });
                // API returns only the folder name, not the full path; prefill if empty
                if (!value) {
                    onChange('/' + handle.name);
                }
                return;
            } catch {
                // user cancelled or permission denied – fall through to input fallback
            }
        }
        browseRef.current?.click();
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const topFolder = files[0].webkitRelativePath.split('/')[0];
            if (!value) {
                onChange('/' + topFolder);
            }
        }
        e.target.value = '';
    };

    const showGithub = isGitHubUrl(value);

    return (
        <div className={`relative flex items-center ${className ?? ''}`}>
            <span className="absolute start-3 pointer-events-none text-slate-400">
                {showGithub
                    ? <Github className="w-4 h-4" />
                    : <FolderOpen className="w-4 h-4" />
                }
            </span>

            <input
                type="text"
                className="input-base font-mono text-sm ps-9 pe-24 w-full"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                spellCheck={false}
                autoComplete="off"
            />

            {!showGithub && (
                <Button
                    variant="ghost"
                    onClick={handleBrowse}
                    className="absolute end-2 flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Browse
                </Button>
            )}

            {/* Hidden fallback for browsers without File System Access API */}
            <input
                ref={browseRef}
                type="file"
                className="hidden"
                // @ts-expect-error – webkitdirectory is non-standard
                webkitdirectory=""
                onChange={handleFileInput}
                tabIndex={-1}
                aria-hidden="true"
            />
        </div>
    );
};
