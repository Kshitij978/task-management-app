import { type Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

import { priorities, statuses } from "../../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableSortbyPopover } from "./data-table-sortby-popover";
import { useSheet } from "@/providers/sheet/sheet-context";
import { useUserContext } from "@/providers/user/user-context";
import { useTaskContext } from "@/providers/task/task-context";

import { DataTableDueDateFilter } from "./data-table-duedate-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const {
    userOptions: users,
    isLoading: usersLoading,
    error: usersError,
  } = useUserContext();
  const { openSheet } = useSheet();
  const {
    handleServerSortChange,
    handleUserFilterChange,
    params,
    mergeParams,
    resetFilters,
  } = useTaskContext();

  const sortBy = params.sort;
  const sortOrder = params.order;

  const dueFrom = params.due_date_from
    ? new Date(String(params.due_date_from))
    : undefined;
  const dueTo = params.due_date_to
    ? new Date(String(params.due_date_to))
    : undefined;
  const hasDueRange = Boolean(dueFrom || dueTo);

  const isFiltered = table.getState().columnFilters.length > 0 || hasDueRange;

  const isSorting =
    table.getState().sorting.length > 0 ||
    sortBy !== undefined ||
    sortOrder !== undefined;

  // Log error if users fail to load
  if (usersError) {
    console.error("Failed to load users:", usersError);
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
          />
        )}
        {table.getColumn("priority") && (
          <DataTableFacetedFilter
            column={table.getColumn("priority")}
            title="Priority"
            options={priorities}
          />
        )}
        {table.getColumn("assigned_user_name") && (
          <DataTableFacetedFilter
            column={table.getColumn("assigned_user_name")}
            title={usersLoading ? "Loading..." : "Assigned To"}
            options={users}
            onFilterChange={(_, userIds) => {
              handleUserFilterChange?.(userIds?.length ? userIds : []);
            }}
          />
        )}

        <DataTableDueDateFilter
          dueFrom={dueFrom}
          dueTo={dueTo}
          params={params}
          mergeParams={mergeParams}
        />

        <DataTableSortbyPopover
          sortBy={sortBy}
          sortOrder={sortOrder}
          onChange={({ sortBy, sortOrder }) => {
            handleServerSortChange?.({ sortBy, sortOrder });
          }}
        />

        {(isFiltered || isSorting) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              table.resetColumnFilters();
              table.resetSorting();
              handleUserFilterChange?.([]);
              resetFilters();
            }}
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
        <Button onClick={() => openSheet({ mode: "create" })} size="sm">
          Add Task
        </Button>
      </div>
    </div>
  );
}
