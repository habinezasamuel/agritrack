import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'gold' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer';

    const variantClasses = {
      primary:
        '!bg-emerald-700 !text-white hover:!bg-emerald-800 shadow-sm hover:shadow-md hover:shadow-emerald-900/20 focus:ring-emerald-600 border border-emerald-800/30 hover:-translate-y-0.5 active:translate-y-0',
      secondary:
        'bg-surface text-[var(--color-text)] border-[var(--color-border)] hover:bg-surface-alt hover:border-[var(--color-text-subtle)] shadow-sm hover:shadow-md focus:ring-primary/20',
      success:
        '!bg-emerald-700 !text-white hover:!bg-emerald-800 shadow-sm hover:shadow-md hover:shadow-emerald-900/20 focus:ring-emerald-600 border border-emerald-800/30 hover:-translate-y-0.5 active:translate-y-0',
      danger:
        '!bg-rose-600 !text-white hover:!bg-rose-700 shadow-sm hover:shadow-md hover:shadow-rose-900/20 focus:ring-rose-500 border border-rose-700/40 hover:-translate-y-0.5 active:translate-y-0',
      gold:
        'bg-gold text-surface hover:bg-dark-forest shadow-sm hover:shadow-md hover:shadow-gold/20 focus:ring-gold border border-gold/30 hover:-translate-y-0.5 active:translate-y-0',
      outline:
        'border-2 border-[var(--color-border)] text-[var(--color-text)] hover:bg-surface-alt hover:border-[var(--color-text-subtle)] focus:ring-primary/20 bg-transparent font-semibold hover:-translate-y-0.5 active:translate-y-0',
      ghost:
        'text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[rgba(22,101,52,0.06)] focus:ring-primary/20 bg-transparent',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs font-semibold gap-1.5 rounded-md',
      md: 'px-4 py-2 text-sm font-semibold gap-2 rounded-lg',
      lg: 'px-5 py-2.5 text-base font-semibold gap-2.5 rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
