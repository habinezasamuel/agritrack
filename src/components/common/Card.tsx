import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', padding = 'md', className, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white border border-[var(--agri-border)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)] transition-shadow duration-200',
      glass: 'glass-card',
      outlined: 'bg-white border border-[var(--agri-border-strong)] shadow-none',
      elevated: 'bg-white shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] border border-[var(--agri-border-subtle)] transition-all duration-200',
    };

    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8',
      xl: 'p-8 sm:p-10',
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-2xl',
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('flex items-start justify-between gap-4 mb-4', className)}
        {...props}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight whitespace-normal break-words">{title}</h3>
          {subtitle && <p className="text-xs sm:text-sm text-[var(--agri-text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('mt-5 pt-4 border-t border-[var(--agri-border-subtle)] flex items-center justify-end gap-2.5', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';