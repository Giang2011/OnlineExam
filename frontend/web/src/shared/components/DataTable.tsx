import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/lib/ui/table';
import { cn } from '@/shared/utils/cn';

export interface Column<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Ẩn cột trên màn hình nhỏ. */
  hideBelow?: 'sm' | 'md' | 'lg';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  caption?: string;
  className?: string;
}

const HIDE_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

/** Bảng dữ liệu dày, canh trái, số liệu dùng tabular-nums. */
export function DataTable<T>({ columns, rows, rowKey, caption, className }: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-md border border-rule bg-paper-raised', className)}>
      <Table>
        {caption ? <caption className="px-4 py-3 text-left text-sm text-slate">{caption}</caption> : null}
        <TableHeader>
          <TableRow className="border-rule bg-paper-sunken hover:bg-paper-sunken">
            {columns.map((column) => (
              <TableHead key={column.id} className={cn('whitespace-nowrap text-ink', column.hideBelow && HIDE_CLASS[column.hideBelow])}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)} className="border-rule hover:bg-chalk-wash/50">
              {columns.map((column) => (
                <TableCell key={column.id} className={cn(column.hideBelow && HIDE_CLASS[column.hideBelow])}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
