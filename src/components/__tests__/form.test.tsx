import React from 'react';
import { render, screen, fireEvent } from '../../test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/form/Button';
import { Input } from '@/components/form/Input';
import { Textarea } from '@/components/form/Textarea';
import { Select } from '@/components/form/Select';
import { FormField } from '@/components/form/FormField';

// ─── Button ─────────────────────────────────────────────────────────────────

describe('Button', () => {
    it('renders children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('defaults to type="button" to avoid accidental form submission', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('applies primary variant class', () => {
        render(<Button variant="primary">Primary</Button>);
        expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });

    it('applies secondary variant class', () => {
        render(<Button variant="secondary">Secondary</Button>);
        expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    });

    it('applies ghost variant class', () => {
        render(<Button variant="ghost">Ghost</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('rounded-lg');
    });

    it('applies danger variant class', () => {
        render(<Button variant="danger">Delete</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('hover:text-red-500');
    });

    it('merges extra className', () => {
        render(<Button className="extra-class">Btn</Button>);
        expect(screen.getByRole('button')).toHaveClass('extra-class');
    });

    it('calls onClick handler', () => {
        const handler = vi.fn();
        render(<Button onClick={handler}>Btn</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is set', () => {
        render(<Button disabled>Btn</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not call onClick when disabled', () => {
        const handler = vi.fn();
        render(<Button disabled onClick={handler}>Btn</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(handler).not.toHaveBeenCalled();
    });

    it('forwards ref to the underlying button element', () => {
        const ref = React.createRef<HTMLButtonElement>();
        render(<Button ref={ref}>Ref</Button>);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('passes through aria attributes', () => {
        render(<Button aria-label="Close dialog">X</Button>);
        expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
    });
});

// ─── Input ───────────────────────────────────────────────────────────────────

describe('Input', () => {
    it('renders an input element', () => {
        render(<Input aria-label="Name" />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('applies input-base class', () => {
        render(<Input aria-label="Name" />);
        expect(screen.getByRole('textbox')).toHaveClass('input-base');
    });

    it('merges extra className', () => {
        render(<Input aria-label="Name" className="font-mono" />);
        expect(screen.getByRole('textbox')).toHaveClass('font-mono');
    });

    it('reflects controlled value', () => {
        render(<Input aria-label="Name" value="hello" onChange={() => {}} />);
        expect(screen.getByRole('textbox')).toHaveValue('hello');
    });

    it('calls onChange when user types', () => {
        const handler = vi.fn();
        render(<Input aria-label="Name" onChange={handler} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } });
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('forwards ref to the underlying input element', () => {
        const ref = React.createRef<HTMLInputElement>();
        render(<Input ref={ref} aria-label="Name" />);
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('passes through placeholder', () => {
        render(<Input aria-label="Name" placeholder="Enter name" />);
        expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    });
});

// ─── Textarea ─────────────────────────────────────────────────────────────────

describe('Textarea', () => {
    it('renders a textarea element', () => {
        render(<Textarea aria-label="Notes" />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('applies input-base and resize-none classes', () => {
        render(<Textarea aria-label="Notes" />);
        const el = screen.getByRole('textbox');
        expect(el).toHaveClass('input-base');
        expect(el).toHaveClass('resize-none');
    });

    it('merges extra className', () => {
        render(<Textarea aria-label="Notes" className="h-32" />);
        expect(screen.getByRole('textbox')).toHaveClass('h-32');
    });

    it('forwards ref', () => {
        const ref = React.createRef<HTMLTextAreaElement>();
        render(<Textarea ref={ref} aria-label="Notes" />);
        expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('calls onChange when user types', () => {
        const handler = vi.fn();
        render(<Textarea aria-label="Notes" onChange={handler} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'note' } });
        expect(handler).toHaveBeenCalledTimes(1);
    });
});

// ─── Select ───────────────────────────────────────────────────────────────────

describe('Select', () => {
    it('renders a select element', () => {
        render(
            <Select aria-label="Status">
                <option value="a">A</option>
                <option value="b">B</option>
            </Select>
        );
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('applies input-base class', () => {
        render(<Select aria-label="Status"><option>A</option></Select>);
        expect(screen.getByRole('combobox')).toHaveClass('input-base');
    });

    it('merges extra className', () => {
        render(<Select aria-label="Status" className="w-full"><option>A</option></Select>);
        expect(screen.getByRole('combobox')).toHaveClass('w-full');
    });

    it('forwards ref', () => {
        const ref = React.createRef<HTMLSelectElement>();
        render(<Select ref={ref} aria-label="Status"><option>A</option></Select>);
        expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });

    it('calls onChange when selection changes', () => {
        const handler = vi.fn();
        render(
            <Select aria-label="Status" onChange={handler}>
                <option value="a">A</option>
                <option value="b">B</option>
            </Select>
        );
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } });
        expect(handler).toHaveBeenCalledTimes(1);
    });
});

// ─── FormField ───────────────────────────────────────────────────────────────

describe('FormField', () => {
    it('renders children', () => {
        render(
            <FormField>
                <input aria-label="Field" />
            </FormField>
        );
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders a label when provided', () => {
        render(
            <FormField label="Email">
                <input aria-label="Email" />
            </FormField>
        );
        expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('renders hint text when provided', () => {
        render(
            <FormField hint="Use your work email">
                <input aria-label="Email" />
            </FormField>
        );
        expect(screen.getByText('Use your work email')).toBeInTheDocument();
    });

    it('renders error text and hides hint when error is set', () => {
        render(
            <FormField hint="Hint text" error="Required field">
                <input aria-label="Email" />
            </FormField>
        );
        expect(screen.getByText('Required field')).toBeInTheDocument();
        expect(screen.queryByText('Hint text')).not.toBeInTheDocument();
    });

    it('applies extra className to wrapper', () => {
        const { container } = render(
            <FormField className="mb-4">
                <input aria-label="X" />
            </FormField>
        );
        expect(container.firstChild).toHaveClass('mb-4');
    });
});
