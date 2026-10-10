import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  width?: string;
}

interface TableProps<T> extends HTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  responsive?: boolean;
}

function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
  onRowClick,
  striped = false,
  hoverable = true,
  bordered = false,
  responsive = true,
  className,
  ...props
}: TableProps<T>) {
  return (
    <div className={clsx('w-full rounded-2xl border border-[var(--color-border)] overflow-hidden bg-white shadow-2xs', responsive && 'overflow-x-auto', className)} {...props}>
      <table className="min-w-[760px] w-full text-sm text-left text-slate-800 border-collapse" role="grid">
        <thead className="bg-surface-alt/90 border-b border-[var(--color-border)] backdrop-blur-xs">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={clsx(
                  'px-4 py-3.5 font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-[0.6875rem] select-none',
                  bordered && 'border-r border-[var(--color-border)] last:border-r-0',
                  column.headerClassName
                )}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-subtle)] bg-white">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-[var(--color-text-secondary)]">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-[var(--color-text-secondary)]">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center text-[var(--color-text-subtle)] mb-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                className={clsx(
                  'transition-colors duration-150',
                  hoverable && 'hover:bg-light-green/40',
                  striped && rowIndex % 2 === 1 && 'bg-surface-alt/40',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={clsx(
                      'px-4 py-3.5 text-sm text-[var(--color-text)]',
                      bordered && 'border-r border-[var(--color-border)] last:border-r-0',
                      column.className
                    )}
                  >
                    {column.render ? column.render(row, rowIndex) : String((row as Record<string, unknown>)[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { Table };
export type { Column, TableProps };