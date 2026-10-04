import React from 'react';
import Loader from './Loader';

const Table = ({
  headers = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  renderRow,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800">
      <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
        <thead className="bg-slate-50 dark:bg-slate-700/40 text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 border-b border-slate-250 dark:border-slate-700">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                scope="col"
                className={`px-6 py-4 font-semibold ${header.className || ''}`}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 border-t border-slate-100 dark:border-slate-700">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-4 text-center">
                <Loader size="sm" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 font-medium"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => renderRow(item, index))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
