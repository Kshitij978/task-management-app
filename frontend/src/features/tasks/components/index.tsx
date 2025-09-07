import { useCallback, useMemo, useState } from "react";
import { columns } from "./data-table/columns";
import { DataTable } from "./data-table/data-table";
import type { TaskQueryParams } from "../types/task";
import { debounce } from "@/utils/debounce";
import { useTasks } from "../hooks/useTasks";
import type { SortingState, ColumnFiltersState } from "@tanstack/react-table";

export default function Tasks() {
  const [serverParams, setServerParams] = useState<TaskQueryParams>({
    page: 1,
    pageSize: 25,
  });
  const [selectedUserIds, setSelectedUserIds] = useState<(number | "null")[]>(
    []
  );

  console.log(serverParams);

  const scheduleSet = useMemo(
    () =>
      debounce(
        (next: unknown) => setServerParams(next as TaskQueryParams),
        200
      ),
    []
  );

  const { data } = useTasks(serverParams);

  const items = data?.items ?? [];

  // Simple mapping: table emits (pageIndex: 0-based, pageSize, sorting, columnFilters)
  const handleStateChange = useCallback(
    (state: {
      pageIndex: number;
      pageSize: number;
      sorting: SortingState;
      columnFilters: ColumnFiltersState;
    }) => {
      const next: TaskQueryParams = {
        page: state.pageIndex + 1,
        pageSize: state.pageSize,
      };

      // translate columnFilters array into API params
      // column filter object shape: { id: string, value: any }
      for (const f of state.columnFilters ?? []) {
        const id = String(f.id);
        const value = f.value;
        // common columns mapping:
        if (id === "title") {
          next.search = typeof value === "string" ? value.trim() : undefined;
        } else if (id === "status") {
          // if filter value is array -> send as array, service accepts array or CSV
          next.status = Array.isArray(value)
            ? value.join(",")
            : (value as string | undefined);
        } else if (id === "priority") {
          next.priority = Array.isArray(value)
            ? value.join(",")
            : (value as string | undefined);
        } else if (id === "assigned_user_name") {
          // Use the selected user IDs from the custom filter
          if (selectedUserIds.length > 0) {
            next.assigned_to = selectedUserIds.join(",");
          }
        } else if (id === "due_date") {
          // if you implement date-range as two columns like due_date_from/due_date_to adjust here
        } else {
          console.log("unknown column filter", id, value);
          // generic fallback: set key directly
          (next as Record<string, unknown>)[id] = value;
        }
      }

      // sorting simple handling: use first sort descriptor
      if (Array.isArray(state.sorting) && state.sorting.length > 0) {
        const s = state.sorting[0];
        next.sort = s.id;
        next.order = s.desc ? "desc" : "asc";
      }

      scheduleSet(next);
    },
    [scheduleSet, selectedUserIds]
  );

  const handleUserFilterChange = useCallback((userIds: (number | "null")[]) => {
    setSelectedUserIds(userIds);
  }, []);

  return (
    <div className="w-full">
      <DataTable
        data={items}
        columns={columns}
        onStateChange={handleStateChange}
        onUserFilterChange={handleUserFilterChange}
      />
    </div>
  );
}
