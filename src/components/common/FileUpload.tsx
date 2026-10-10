import type { InputHTMLAttributes } from 'react';
import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { clsx } from 'clsx';

interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  maxFiles?: number;
  onFilesChange?: (files: File[]) => void;
  showPreview?: boolean;
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      label,
      error,
      hint,
      accept = '*/*',
      multiple = false,
      maxSizeMB = 10,
      maxFiles = 5,
      onFilesChange,
      showPreview = true,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || 'file-upload';

    useEffect(() => {
      if (onFilesChange) {
        onFilesChange(selectedFiles);
      }
    }, [selectedFiles, onFilesChange]);

    const setInputRef = useCallback(
      (el: HTMLInputElement | null) => {
        fileInputRef.current = el;
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref) {
          ref.current = el;
        }
      },
      [ref]
    );

    const generatePreviews = useCallback((files: File[]) => {
      const newPreviews: string[] = [];
      files.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          newPreviews.push(url);
        }
      });
      setPreviews((prev) => [...prev, ...newPreviews]);
      return () => {
        newPreviews.forEach((url) => URL.revokeObjectURL(url));
      };
    }, []);

    const handleFileChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);

        if (!multiple && files.length > 1) {
          return;
        }

        const validFiles: File[] = [];
        const errors: string[] = [];

        files.forEach((file) => {
          if (file.size > maxSizeMB * 1024 * 1024) {
            errors.push(`${file.name} exceeds ${maxSizeMB}MB limit`);
            return;
          }
          validFiles.push(file);
        });

        if (selectedFiles.length + validFiles.length > maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed`);
        }

        if (errors.length > 0) {
          console.warn('File upload errors:', errors);
        }

        const newFiles = [...selectedFiles, ...validFiles].slice(0, maxFiles);
        setSelectedFiles(newFiles);
        if (showPreview && validFiles.length > 0) {
          generatePreviews(validFiles);
        }
      },
      [selectedFiles, multiple, maxSizeMB, maxFiles, showPreview, generatePreviews]
    );

    const removeFile = useCallback((index: number) => {
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
      setPreviews((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const openFileDialog = () => {
      fileInputRef.current?.click();
    };

    return (
      <div className={className}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-[var(--color-text)] mb-1.5">
            {label}
            {props.required && <span className="text-[var(--color-error)] ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div
          className={clsx(
            'border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer',
            'focus-within:ring-2 focus-within:ring-primary focus-within:border-primary',
            disabled
              ? 'bg-[var(--color-surface-alt)] border-[var(--color-border)] cursor-not-allowed opacity-60'
              : 'border-[var(--color-border)] hover:border-primary bg-surface-alt/60 hover:bg-[rgba(22,101,52,0.06)]',
            error && 'border-error bg-error-light/40'
          )}
          onClick={openFileDialog}
        >
          <input
            ref={setInputRef}
            id={inputId}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            className="sr-only"
            onChange={handleFileChange}
            {...props}
          />
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-alt flex items-center justify-center text-primary mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} file(s) selected`
                : 'Drag & drop files here, or click to browse'}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {multiple ? `Up to ${maxFiles} files, ` : ''}{maxSizeMB}MB max per file
              {accept !== '*/*' && ` • Accepted: ${accept}`}
            </p>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-3 space-y-2" role="list" aria-label="Selected files">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white border border-[var(--color-border)] rounded-xl shadow-xs"
                role="listitem"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {previews[index] ? (
                    <img
                      src={previews[index]}
                      alt={file.name}
                      className="w-10 h-10 rounded-lg object-cover border border-[var(--color-border)]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface-alt flex items-center justify-center text-primary">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text)] truncate">{file.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-[var(--color-text-muted)] hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error-light flex-shrink-0"
                  aria-label={`Remove ${file.name}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs font-semibold text-error flex items-center gap-1" role="alert">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
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

FileUpload.displayName = 'FileUpload';
