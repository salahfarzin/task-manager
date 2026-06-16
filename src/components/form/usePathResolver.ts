import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export interface PathResolverState {
    resolving: boolean;
    notFound: boolean;
    textRef: React.RefObject<HTMLInputElement | null>;
    browseRef: React.RefObject<HTMLInputElement | null>;
    handleBrowse: () => Promise<void>;
    handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    resetNotFound: () => void;
}

async function fetchResolvedPath(name: string, agentUrl: string): Promise<string | null> {
    try {
        const url = `${agentUrl.replace(/\/$/, '')}/api/resolve-path?name=${encodeURIComponent(name)}`;
        const res = await fetch(url);
        if (!res.ok) {
            return null;
        }
        const data = (await res.json()) as { found: boolean; path: string | null };
        return data.found ? data.path : null;
    } catch {
        return null;
    }
}

/** Paint the spinner before any async work by flushing React state to the DOM,
 *  then yielding one animation frame so the browser compositor actually draws it. */
async function paintThenRun(setResolving: (v: boolean) => void, setNotFound: (v: boolean) => void) {
    flushSync(() => {
        setResolving(true);
        setNotFound(false);
    });
    await new Promise<void>((res) => requestAnimationFrame(() => res()));
}

export function usePathResolver(
    agentUrl: string,
    onChange: (value: string) => void,
): PathResolverState {
    const textRef = useRef<HTMLInputElement>(null);
    const browseRef = useRef<HTMLInputElement>(null);
    const [resolving, setResolving] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const applyName = async (name: string) => {
        try {
            const full = await fetchResolvedPath(name, agentUrl);
            if (full) {
                onChange(full);
            } else {
                setNotFound(true);
                onChange('/' + name);
                requestAnimationFrame(() => {
                    if (textRef.current) {
                        textRef.current.focus();
                        textRef.current.setSelectionRange(0, 0);
                    }
                });
            }
        } finally {
            setResolving(false);
        }
    };

    const handleBrowse = async () => {
        if ('showDirectoryPicker' in globalThis) {
            await paintThenRun(setResolving, setNotFound);
            try {
                const handle = await (globalThis as typeof globalThis & {
                    showDirectoryPicker: (opts: object) => Promise<{ name: string }>;
                }).showDirectoryPicker({ mode: 'read' });
                await applyName(handle.name);
            } catch {
                setResolving(false);
            }
            return;
        }
        browseRef.current?.click();
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            await paintThenRun(setResolving, setNotFound);
            await applyName(files[0].webkitRelativePath.split('/')[0]);
        }
        e.target.value = '';
    };

    const resetNotFound = () => setNotFound(false);

    return { resolving, notFound, textRef, browseRef, handleBrowse, handleFileInput, resetNotFound };
}
