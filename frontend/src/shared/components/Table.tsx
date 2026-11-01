import React from 'react';

export interface TableProps {
  headers: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ headers, children, className = '' }) => (
  <div className={['overflow-x-auto rounded-2xl border border-slate-200 bg-white', className].join(' ')}>
    <table className="min-w-full divide-y divide-slate-200">
      <thead className="bg-slate-50">
        <tr>
          {headers.map((header, index) => (
            <th key={index} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
    </table>
  </div>
);

export default Table;
