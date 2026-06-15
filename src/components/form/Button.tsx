import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

const variantClass: Record<ButtonVariant, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer',
    danger: 'p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer',
};

const sizeClass: Record<ButtonSize, string> = {
    sm: 'text-sm',
    md: 'text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'sm', className = '', children, type = 'button', ...props }, ref) => (
        <button
            ref={ref}
            type={type}
            className={`${variantClass[variant]} ${sizeClass[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
);

Button.displayName = 'Button';
