import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableStateSnapshot {
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  initialPageSize?: number;
  totalCount?: number; // total results for server-side pagination
  currentSort?: string;
  currentSortOrder?: "asc" | "desc" | undefined;
  onStateChange?: (state: {
    pageIndex: number;
    pageSize: number;
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    columnVisibility: VisibilityState;
  }) => void;
  onUserFilterChange?: (userIds: (number | "null")[]) => void;
  onServerSortChange?: (payload: {
    sortBy?: string;
    sortOrder?: "asc" | "desc" | undefined;
  }) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialPageSize = 25,
  currentSort,
  currentSortOrder,
  onStateChange,
  onUserFilterChange,
  onServerSortChange,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [paginationState, setPaginationState] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: paginationState,
    },
    initialState: {},
    // Always use server-side pagination; total pages unknown
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPaginationState,
    getCoreRowModel: getCoreRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  /**
   * Emit state to parent whenever sorting, column filters, or pagination change.
   * We read pagination values from table.getState().pagination each time the effect runs.
   */
  const pagination = table.getState().pagination;
  const pageIndex = pagination.pageIndex;
  const pageSize = pagination.pageSize;

  React.useEffect(() => {
    if (!onStateChange) return;

    const snapshot: DataTableStateSnapshot = {
      pageIndex,
      pageSize,
      sorting,
      columnFilters,
      columnVisibility: columnVisibility || {},
    };

    onStateChange(snapshot);
  }, [
    onStateChange,
    sorting,
    columnFilters,
    columnVisibility,
    pageIndex,
    pageSize,
  ]);

  const headerGroups = table.getHeaderGroups();
  const rowModel = table.getRowModel();

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar
        table={table}
        onUserFilterChange={onUserFilterChange}
        onServerSortChange={onServerSortChange}
        sortBy={currentSort}
        sortOrder={currentSortOrder}
      />
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {headerGroups.map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rowModel.rows?.length ? (
              rowModel.rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-[500px] text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
