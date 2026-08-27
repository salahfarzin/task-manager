import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', ...props }, ref) => (
        <input ref={ref} className={`input-base ${className}`} {...props} />
    )
);

Input.displayName = 'Input';
