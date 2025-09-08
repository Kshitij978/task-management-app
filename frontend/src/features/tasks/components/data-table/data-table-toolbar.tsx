import { type Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

import { priorities, statuses } from "../../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { useUsersFilterOptions } from "../../hooks/useUsers";
import { DataTableSortbyPopover } from "./data-table-sortby-popover";
import { useSheet } from "@/providers/sheet/sheet-context";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  sortBy?: string;
  sortOrder: "asc" | "desc" | undefined;
  onUserFilterChange?: (userIds: (number | "null")[]) => void;

  onServerSortChange?: (payload: {
    sortBy?: string;
    sortOrder?: "asc" | "desc" | undefined;
  }) => void;
}

export function DataTableToolbar<TData>({
  table,
  sortBy,
  sortOrder,
  onUserFilterChange,
  onServerSortChange,
}: DataTableToolbarProps<TData>) {
  const {
    userOptions: users,
    isLoading: usersLoading,
    error: usersError,
  } = useUsersFilterOptions();
  const { openSheet } = useSheet();
  const isFiltered = table.getState().columnFilters.length > 0;

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
              onUserFilterChange?.(userIds?.length ? userIds : []);
            }}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
          >
            Reset
            <X />
          </Button>
        )}

        <DataTableSortbyPopover
          sortBy={sortBy}
          sortOrder={sortOrder}
          onChange={({ sortBy, sortOrder }) => {
            onServerSortChange?.({ sortBy, sortOrder });
          }}
        />
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
