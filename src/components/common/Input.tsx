import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5 tracking-tight">
            {label}
            {props.required && <span className="text-[var(--color-error)] ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'block w-full rounded-xl border border-[var(--color-border-input)] bg-white text-[var(--color-text)] placeholder-[var(--color-text-muted)] text-sm shadow-2xs',
              'focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary focus:bg-white',
              'disabled:bg-surface-alt disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]',
              'transition-all duration-200',
              leftIcon ? 'pl-10' : 'pl-3.5',
              rightIcon ? 'pr-10' : 'pr-3.5',
              'py-2.5',
              error ? 'border-error focus:ring-error/20 focus:border-error bg-error-50/20' : 'hover:border-slate-300',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-error flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-xs text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5 tracking-tight">
            {label}
            {props.required && <span className="text-[var(--color-error)] ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            'block w-full rounded-xl border border-[var(--color-border-input)] bg-white text-[var(--color-text)] placeholder-[var(--color-text-muted)] p-3.5 text-sm shadow-2xs',
            'focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary',
            'disabled:bg-surface-alt disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]',
            'transition-all duration-200 resize-y min-h-[100px]',
            error ? 'border-error focus:ring-error/20 focus:border-error bg-error-50/20' : 'hover:border-slate-300',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1.5 text-xs font-medium text-error flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-1 text-xs text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
