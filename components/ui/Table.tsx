import React from 'react';

interface Column<T> { key: keyof T | string; header: string; render?: (row: T) => React.ReactNode }
interface TableProps<T> { columns: Column<T>[]; data: T[] }

function BaseTable<T>({ columns, data }: TableProps<T>) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-3xl">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            {columns.map(col => (
              <th key={String(col.key)} className="px-4 py-3 text-left font-semibold text-gray-700">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map(col => (
                <td key={String(col.key)} className="px-4 py-3 text-gray-800">
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BaseTable;
