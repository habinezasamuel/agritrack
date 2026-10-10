import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { SelectOption } from '../../types';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5 tracking-tight">
            {label}
            {props.required && <span className="text-[var(--color-error)] ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              'block w-full rounded-xl border border-[var(--color-border-input)] text-[var(--color-text)] bg-white text-sm shadow-2xs',
              'focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary',
              'disabled:bg-surface-alt disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]',
              'transition-all duration-200 appearance-none cursor-pointer',
              'py-2.5 pl-3.5 pr-10',
              error ? 'border-error focus:ring-error/20 focus:border-error bg-error-50/20' : 'hover:border-slate-300',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--color-text-muted)]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-xs font-medium text-error flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-1 text-xs text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';