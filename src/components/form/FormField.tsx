import React from 'react';

interface FormFieldProps {
    label?: React.ReactNode;
    hint?: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, hint, error, children, className }) => (
    <div className={className}>
        {label && (
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {label}
            </label>
        )}
        {children}
        {hint && !error && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        )}
        {error && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
    </div>
);
