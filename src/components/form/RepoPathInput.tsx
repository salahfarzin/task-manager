import React from 'react';
import { FolderOpen, Github } from 'lucide-react';

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
    placeholder = '/absolute/path/to/repo',
    className,
}) => {
    const showGithub = isGitHubUrl(value);

    return (
        <div className={`space-y-1 ${className ?? ''}`}>
            <div className="relative flex items-center">
                <span className="absolute start-3 pointer-events-none text-slate-400">
                    {showGithub
                        ? <Github className="w-4 h-4" />
                        : <FolderOpen className="w-4 h-4" />
                    }
                </span>
                <input
                    type="text"
                    className="input-base font-mono text-sm ps-9 w-full"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    spellCheck={false}
                    autoComplete="off"
                />
            </div>
            {!showGithub && (
                <p className="text-xs text-slate-400 dark:text-slate-500 ps-1">
                    Paste the absolute path (e.g.{' '}
                    <code className="font-mono">/Users/you/projects/my-repo</code>).
                    Browsers cannot read full paths from the file picker.
                </p>
            )}
        </div>
    );
};
