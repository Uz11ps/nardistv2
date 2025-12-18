import { ReactNode } from 'react';
import './DataTable.css';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  actions?: (item: T) => ReactNode;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Нет данных',
  actions,
}: DataTableProps<T>) {
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="data-table__header">
                {column.header}
              </th>
            ))}
            {actions && <th className="data-table__header">Действия</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="data-table__empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={item.id}
                className={`data-table__row ${onRowClick ? 'data-table__row--clickable' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="data-table__cell">
                    {column.render ? column.render(item) : (item as any)[column.key]}
                  </td>
                ))}
                {actions && (
                  <td key="actions" className="data-table__cell" onClick={(e) => e.stopPropagation()}>
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

