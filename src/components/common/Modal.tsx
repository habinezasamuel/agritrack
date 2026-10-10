import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
}: ModalProps) {
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[92vw]',
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}>
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
          aria-hidden="true"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />
        <div
          className={clsx(
            'relative w-full text-left bg-white rounded-2xl shadow-2xl border border-slate-200/80 transform transition-all animate-scale-in my-8 overflow-hidden',
            sizeClasses[size]
          )}
        >
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[var(--color-border-subtle)] bg-surface-alt/50">
              {title && (
                <h2 id="modal-title" className="text-base sm:text-lg font-bold text-[var(--color-text)] tracking-tight">
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-surface-alt/60 transition-colors p-1.5 rounded-xl cursor-pointer"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          <div className="p-6">{children}</div>
          {footer && (
            <div className="px-6 py-4 bg-surface-alt/60 border-t border-[var(--color-border-subtle)] flex justify-end gap-2.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button variant={variant === 'warning' ? 'gold' : variant} size="sm" onClick={onConfirm} isLoading={isLoading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

Modal.Footer = ({ children }: { children: React.ReactNode }) => <>{children}</>;