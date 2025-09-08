import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { columns } from "./data-table/columns";
import { DataTable } from "./data-table/data-table";
import type { TaskQueryParams } from "../types/task";
import { debounce } from "@/utils/debounce";
import { useTasks } from "../hooks/useTasks";
import type { SortingState, ColumnFiltersState } from "@tanstack/react-table";
import {
  applyColumnFilter,
  applySortingIfNeeded,
  clearCommonFiltersWhenNoColumnFilters,
  haveWatchedFiltersChanged,
} from "../utils/queryParams";

export default function Tasks() {
  const [serverParams, setServerParams] = useState<TaskQueryParams>({
    page: 1,
    pageSize: 25,
  });

  const serverParamsRef = useRef<TaskQueryParams>(serverParams);

  useEffect(() => {
    serverParamsRef.current = serverParams;
  }, [serverParams]);

  const scheduleSet = useMemo(
    () =>
      debounce(
        (next: unknown) => setServerParams(next as TaskQueryParams),
        200
      ),
    []
  );

  const [selectedUserIds, setSelectedUserIds] = useState<(number | "null")[]>(
    []
  );
  const { data } = useTasks(serverParams);

  const items = data?.items ?? [];

  const handleStateChange = useCallback(
    (snapshot: {
      pageIndex: number;
      pageSize: number;
      sorting: SortingState;
      columnFilters: ColumnFiltersState;
    }) => {
      const previousParams = serverParamsRef.current;
      const nextParams: TaskQueryParams = {
        ...previousParams,
        page: snapshot.pageIndex + 1,
        pageSize: snapshot.pageSize,
      };

      // apply every column filter
      for (const columnFilter of snapshot.columnFilters ?? []) {
        const columnId = String(columnFilter.id);
        applyColumnFilter(
          nextParams,
          columnId,
          columnFilter.value,
          selectedUserIds
        );
      }

      // if there were no column filters, clear common keys to avoid stale filtering
      clearCommonFiltersWhenNoColumnFilters(
        nextParams,
        snapshot.columnFilters,
        selectedUserIds
      );

      // apply sorting and reset page if change detected
      applySortingIfNeeded(nextParams, previousParams, snapshot.sorting);

      // if any watched filters changed, reset page to 1
      const watchedKeys: (keyof TaskQueryParams)[] = [
        "status",
        "priority",
        "search",
        "assigned_to",
      ];
      if (haveWatchedFiltersChanged(previousParams, nextParams, watchedKeys)) {
        nextParams.page = 1;
      }

      scheduleSet(nextParams);
    },
    [scheduleSet, selectedUserIds]
  );

  const handleUserFilterChange = useCallback((userIds: (number | "null")[]) => {
    setSelectedUserIds(userIds);
  }, []);

  const handleServerSortChange = useCallback(
    (payload: { sortBy?: string; sortOrder?: "asc" | "desc" | undefined }) => {
      setServerParams((prev) => ({
        ...prev,
        sort: payload.sortBy ?? prev.sort,
        order: payload.sortOrder ?? prev.order,
        page: 1, // reset to first page when server sort changes
      }));
    },
    []
  );

  return (
    <div className="w-full">
      <DataTable
        data={items}
        columns={columns}
        onStateChange={handleStateChange}
        onUserFilterChange={handleUserFilterChange}
        onServerSortChange={handleServerSortChange}
        currentSort={serverParams.sort}
        currentSortOrder={serverParams.order}
      />
    </div>
  );
}
