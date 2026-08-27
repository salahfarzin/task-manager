import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = '', ...props }, ref) => (
        <textarea ref={ref} className={`input-base resize-none ${className}`} {...props} />
    )
);

Textarea.displayName = 'Textarea';
