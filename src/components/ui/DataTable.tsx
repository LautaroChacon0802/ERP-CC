import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface RowAction<T> {
  icon: React.ReactNode;
  onClick: (item: T) => void;
  variant?: 'default' | 'destructive';
  label?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  pagination?: boolean;
  pageSize?: number;
  rowActions?: RowAction<T>[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  searchKeys = [],
  pagination = false,
  pageSize = 10,
  rowActions = [],
  loading = false,
  emptyState,
  onRowClick,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm || searchKeys.length === 0) return data;
    
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(item =>
      searchKeys.some(key => {
        const value = item[key];
        return value && String(value).toLowerCase().includes(lowerSearch);
      })
    );
  }, [data, searchTerm, searchKeys]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, pagination, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      {searchable && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-card border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="animate-spin mx-auto mb-3 text-muted-foreground" size={32} />
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-12 text-center">
            {emptyState || (
              <p className="text-muted-foreground">No hay datos para mostrar</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {columns.map((column, index) => (
                    <th
                      key={String(column.key)}
                      className={`px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider ${alignStyles[column.align || 'left']}`}
                      style={{ width: column.width }}
                    >
                      {column.header}
                    </th>
                  ))}
                  {rowActions.length > 0 && (
                    <th className="px-6 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedData.map((item, rowIndex) => (
                  <tr
                    key={keyExtractor(item)}
                    className={`
                      transition-colors
                      ${rowIndex % 2 === 1 ? 'bg-muted/30' : 'bg-card'}
                      ${onRowClick ? 'hover:bg-muted cursor-pointer' : 'hover:bg-muted/50'}
                    `}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`px-6 py-4 text-sm ${alignStyles[column.align || 'left']}`}
                      >
                        {column.render
                          ? column.render(item)
                          : String(item[column.key as keyof T] ?? '-')}
                      </td>
                    ))}
                    {rowActions.length > 0 && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          {rowActions.map((action, actionIndex) => (
                            <button
                              key={actionIndex}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(item);
                              }}
                              className={`
                                p-2 rounded-lg transition-colors
                                ${action.variant === 'destructive'
                                  ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                                  : 'text-muted-foreground hover:text-accent hover:bg-accent/10'}
                              `}
                              title={action.label}
                            >
                              {action.icon}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, filteredData.length)} de {filteredData.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-foreground px-3">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
