import React from 'react';
import { Loader2 } from 'lucide-react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

export interface SpinnerProps {
    size?: SpinnerSize;
    label?: string;
    className?: string;
}

const sizeClass: Record<SpinnerSize, string> = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', label, className = '' }) => (
    <output aria-label={label ?? 'Loading'} className={`inline-flex items-center gap-1.5 ${className}`}>
        <Loader2 className={`${sizeClass[size]} animate-spin shrink-0`} />
        {label && <span className="text-current">{label}</span>}
    </output>
);
