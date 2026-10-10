import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'error' | 'danger' | 'warning' | 'info' | 'gold' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulse?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', dot = false, pulse = false, className, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-slate-100 text-slate-700 border border-slate-200/90 font-medium',
      primary: 'bg-light-green text-primary-dark border border-light-green-200 font-semibold shadow-xs',
      success: 'bg-light-green text-primary-dark border border-light-green-200 font-semibold shadow-xs',
      error: 'bg-error-light text-error-text border border-error-border font-semibold shadow-xs',
      danger: 'bg-error-light text-error-text border border-error-border font-semibold shadow-xs',
      warning: 'bg-gold-bg text-gold border border-gold-light font-semibold shadow-xs',
      info: 'bg-info-light text-info-text border border-info-border font-semibold shadow-xs',
      gold: 'bg-gold-bg text-gold border border-gold-light font-semibold shadow-xs',
      secondary: 'bg-surface-alt text-secondary border border-border-subtle font-semibold shadow-xs',
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-[0.6875rem] leading-tight tracking-wide',
      md: 'px-2.5 py-1 text-xs leading-normal tracking-wide',
      lg: 'px-3 py-1.5 text-sm leading-normal tracking-wide',
    };

    const dotColors = {
      default: 'bg-slate-400',
      primary: 'bg-primary',
      success: 'bg-primary',
      error: 'bg-error',
      danger: 'bg-error',
      warning: 'bg-gold',
      info: 'bg-info',
      gold: 'bg-gold',
      secondary: 'bg-text-muted',
    };

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-full shrink-0 select-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span className="relative flex h-2 w-2 mr-1.5">
            {pulse && (
              <span className={clsx('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', dotColors[variant])} />
            )}
            <span className={clsx('relative inline-flex rounded-full h-2 w-2', dotColors[variant])} />
          </span>
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string; pulse?: boolean }> = {
    // Crop season statuses
    PLANNED: { variant: 'info', label: 'Planned' },
    ACTIVE: { variant: 'success', label: 'Active', pulse: true },
    HARVESTED: { variant: 'primary', label: 'Harvested' },
    FAILED: { variant: 'error', label: 'Failed' },
    CANCELLED: { variant: 'secondary', label: 'Cancelled' },

    // Request statuses
    DRAFT: { variant: 'secondary', label: 'Draft' },
    SUBMITTED: { variant: 'info', label: 'Submitted' },
    UNDER_REVIEW: { variant: 'warning', label: 'Under Review', pulse: true },
    APPROVED: { variant: 'success', label: 'Approved' },
    PARTIALLY_APPROVED: { variant: 'warning', label: 'Partially Approved' },
    REJECTED: { variant: 'error', label: 'Rejected' },
    EXPIRED: { variant: 'secondary', label: 'Expired' },

    // Order statuses
    PENDING_PAYMENT: { variant: 'warning', label: 'Pending Payment', pulse: true },
    PAYMENT_CONFIRMED: { variant: 'success', label: 'Payment Confirmed' },
    PREPARING: { variant: 'info', label: 'Preparing', pulse: true },
    READY_FOR_COLLECTION: { variant: 'primary', label: 'Ready for Collection', pulse: true },
    OUT_FOR_DELIVERY: { variant: 'info', label: 'Out for Delivery', pulse: true },
    COLLECTED: { variant: 'success', label: 'Collected' },
    DELIVERED: { variant: 'primary', label: 'Delivered' },

    // Payment statuses
    PENDING: { variant: 'warning', label: 'Pending', pulse: true },
    PROCESSING: { variant: 'info', label: 'Processing', pulse: true },
    SUCCESS: { variant: 'success', label: 'Success' },
    PAYMENT_FAILED: { variant: 'error', label: 'Failed' },
    REFUNDED: { variant: 'secondary', label: 'Refunded' },

    // Task statuses
    COMPLETED: { variant: 'success', label: 'Completed' },
    IN_PROGRESS: { variant: 'info', label: 'In Progress', pulse: true },
    OVERDUE: { variant: 'error', label: 'Overdue', pulse: true },

    // Problem statuses
    REPORTED: { variant: 'warning', label: 'Reported', pulse: true },
    PROBLEM_UNDER_REVIEW: { variant: 'info', label: 'Under Review', pulse: true },
    ADVICE_GIVEN: { variant: 'success', label: 'Advice Given' },
    RESOLVED: { variant: 'primary', label: 'Resolved' },
    ESCALATED: { variant: 'error', label: 'Escalated', pulse: true },

    // User roles
    ADMIN: { variant: 'error', label: 'Admin' },
    FARMER: { variant: 'success', label: 'Farmer' },
    OFFICER: { variant: 'primary', label: 'Officer' },

    // Product statuses
    PRODUCT_ACTIVE: { variant: 'success', label: 'Active' },
    UNAVAILABLE: { variant: 'warning', label: 'Unavailable' },
    DISCONTINUED: { variant: 'secondary', label: 'Discontinued' },
  };

  let config = statusConfig[status];
  if (!config) {
    if (status === 'ACTIVE') {
      config = { variant: 'success', label: 'Active', pulse: true };
    } else if (status === 'UNDER_REVIEW') {
      config = { variant: 'warning', label: 'Under Review', pulse: true };
    } else if (status === 'FAILED') {
      config = { variant: 'error', label: 'Failed' };
    }
  }
  config = config || { variant: 'default', label: status.replace(/_/g, ' ') };
  return <Badge variant={config.variant} dot pulse={config.pulse}>{config.label}</Badge>;
}
