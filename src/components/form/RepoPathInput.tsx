import React, { useRef, useState } from 'react';
import { FolderOpen, Github, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

const isGitUrl = (value: string) =>
    /^(https?:\/\/|git@|github\.com\/)/i.test(value.trim());

export interface RepoPathInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const RepoPathInput: React.FC<RepoPathInputProps> = ({
    value,
    onChange,
    placeholder = '/absolute/path/to/repo  or  https://github.com/org/repo',
    className,
}) => {
    const browseRef = useRef<HTMLInputElement>(null);
    const [partialPath, setPartialPath] = useState(false);

    const handleBrowse = async () => {
        if ('showDirectoryPicker' in window) {
            try {
                // @ts-expect-error – showDirectoryPicker not in all TS libs yet
                const handle = await window.showDirectoryPicker({ mode: 'read' });
                // Browsers only expose the folder name — prepend / as a hint
                onChange('/' + handle.name);
                setPartialPath(true);
                return;
            } catch {
                // cancelled or permission denied
            }
        }
        browseRef.current?.click();
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const topFolder = files[0].webkitRelativePath.split('/')[0];
            onChange('/' + topFolder);
            setPartialPath(true);
        }
        e.target.value = '';
    };

    const handleChange = (v: string) => {
        onChange(v);
        setPartialPath(false);
    };

    const showGit = isGitUrl(value);

    return (
        <div className={`space-y-1 ${className ?? ''}`}>
            <div className="relative flex items-center">
                <span className="absolute start-3 pointer-events-none text-slate-400">
                    {showGit
                        ? <Github className="w-4 h-4" />
                        : <FolderOpen className="w-4 h-4" />
                    }
                </span>
                <input
                    type="text"
                    className="input-base font-mono text-sm ps-9 pe-24 w-full"
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={placeholder}
                    spellCheck={false}
                    autoComplete="off"
                />
                {!showGit && (
                    <Button
                        variant="ghost"
                        onClick={handleBrowse}
                        className="absolute end-2 flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Browse
                    </Button>
                )}
            </div>

            {partialPath && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 ps-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    Browser only shows the folder name — prepend the full parent path
                    (e.g. <code className="font-mono">/Users/you/projects</code>).
                </p>
            )}

            {showGit && (
                <p className="text-xs text-slate-400 dark:text-slate-500 ps-1">
                    Git URL — the agent will clone this repo before running.
                </p>
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
