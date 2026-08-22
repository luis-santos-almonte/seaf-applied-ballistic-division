import type { ReactNode } from 'react';
import { cx } from '@/lib/classNames';

export interface Column<Row> {
  key: string;
  header: string;
  /** Alineación. Por defecto: la primera columna a la izquierda, el resto a la derecha. */
  align?: 'left' | 'right' | 'center';
  render: (row: Row, index: number) => ReactNode;
}

interface DataTableProps<Row> {
  columns: ReadonlyArray<Column<Row>>;
  rows: readonly Row[];
  rowKey: (row: Row, index: number) => string;
  /** Marca visualmente una fila destacada, por ejemplo el mejor objetivo. */
  highlight?: (row: Row, index: number) => boolean;
  emptyMessage?: string;
  className?: string;
}

/** Tabla genérica. Todas las tablas de la app usan esta para no repetir markup. */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  highlight,
  emptyMessage = 'Sin datos.',
  className,
}: DataTableProps<Row>) {
  return (
    <div className="table-scroll">
      <table className={cx('data-table', className)}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={column.key} style={{ textAlign: column.align ?? (index === 0 ? 'left' : 'right') }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length}>{emptyMessage}</td>
            </tr>
          )}
          {rows.map((row, rowIndex) => (
            <tr key={rowKey(row, rowIndex)} className={cx(highlight?.(row, rowIndex) && 'is-highlighted')}>
              {columns.map((column, index) => (
                <td
                  key={column.key}
                  style={{ textAlign: column.align ?? (index === 0 ? 'left' : 'right') }}
                >
                  {column.render(row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
