import React from 'react';
import { FolderOpen, Link } from 'lucide-react';
import { Button } from './Button';
import { Spinner } from '@/components/Spinner';
import { PathHint } from './PathHint';
import { usePathResolver } from './usePathResolver';
import { CONFIGS } from '@/config';

const isGitUrl = (value: string) =>
    /^(https?:\/\/|git@|github\.com\/)/i.test(value.trim());

const isAbsolutePath = (value: string) =>
    value.startsWith('/') || /^[A-Za-z]:\\/.test(value);

export interface RepoPathInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    agentUrl?: string;
}

export const RepoPathInput: React.FC<RepoPathInputProps> = ({
    value,
    onChange,
    placeholder = '/Users/you/projects/my-repo',
    className,
    agentUrl = CONFIGS.AGENT_URL,
}) => {
    const { resolving, notFound, textRef, browseRef, handleBrowse, handleFileInput, resetNotFound } =
        usePathResolver(agentUrl, onChange);

    const gitUrl = isGitUrl(value);
    const looksPartial = value.trim().length > 0 && !gitUrl && !isAbsolutePath(value);

    return (
        <div className={`space-y-1.5 ${className ?? ''}`}>
            <div className="relative flex items-center">
                <span className="absolute start-3 pointer-events-none text-slate-400">
                    {gitUrl ? <Link className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
                </span>
                <input
                    ref={textRef}
                    type="text"
                    className="input-base font-mono text-sm ps-9 pe-24 w-full"
                    value={value}
                    onChange={(e) => { onChange(e.target.value); resetNotFound(); }}
                    placeholder={placeholder}
                    spellCheck={false}
                    autoComplete="off"
                />
                {!gitUrl && (
                    <Button
                        variant="ghost"
                        onClick={handleBrowse}
                        disabled={resolving}
                        className="absolute end-2 flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-60"
                    >
                        {resolving
                            ? <Spinner size="sm" label="Resolving…" />
                            : <><FolderOpen className="w-3.5 h-3.5" /> Browse</>
                        }
                    </Button>
                )}
            </div>

            <PathHint value={value} notFound={notFound} looksPartial={looksPartial} isGitUrl={gitUrl} />

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

