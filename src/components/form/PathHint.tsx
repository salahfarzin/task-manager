import React from 'react';

interface PathHintProps {
    value: string;
    notFound: boolean;
    looksPartial: boolean;
    isGitUrl: boolean;
}

export const PathHint: React.FC<PathHintProps> = ({ value, notFound, looksPartial, isGitUrl }) => {
    if (isGitUrl) {
        return (
            <p className="flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400 ps-1">
                Git URL — the agent will clone this repo before running.
            </p>
        );
    }

    if (looksPartial && notFound) {
        return (
            <p className="text-xs text-amber-600 dark:text-amber-400 ps-1">
                Couldn't find <code className="font-mono">{value.slice(1)}</code> in common
                directories. Cursor is at the start — type the full parent path.
            </p>
        );
    }

    if (looksPartial) {
        return (
            <p className="text-xs text-amber-600 dark:text-amber-400 ps-1">
                Doesn't look like an absolute path. Did you mean{' '}
                <code className="font-mono">/Users/you/projects/{value}</code>?
            </p>
        );
    }

    return null;
};
