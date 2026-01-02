import React from 'react';

const Table = ({ 
  columns = [], 
  data = [], 
  onRowClick, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        No data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-bg-tertiary">
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className="px-6 py-4 text-left text-sm font-semibold text-text-primary whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="hover:bg-bg-tertiary/50 cursor-pointer transition-colors"
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col, colIdx) => (
                <td 
                  key={colIdx} 
                  className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap"
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
