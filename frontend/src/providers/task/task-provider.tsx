// src/context/TaskContext.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { TaskQueryParams } from "../../features/tasks/types/task";
import { debounce } from "@/utils/debounce";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import {
  applyColumnFilter,
  applySortingIfNeeded,
  clearCommonFiltersWhenNoColumnFilters,
  haveWatchedFiltersChanged,
} from "@/features/tasks/utils/queryParams";
import { useTasks } from "@/features/tasks/hooks/useTasks"; // move fetching into provider
import { TaskContext } from "./task-context";

type BuildSnapshot = {
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
};

export interface TaskContextValue {
  // params + setters
  params: TaskQueryParams;
  paramsRef: React.MutableRefObject<TaskQueryParams>;
  setParams: (next: TaskQueryParams) => void;
  scheduleParams: (next: TaskQueryParams) => void;
  mergeParams: (
    patch: Partial<TaskQueryParams>,
    opts?: { resetPage?: boolean }
  ) => void;

  // selected user ids / setter
  selectedUserIds: (number | "null")[];
  setSelectedUserIds: (ids: (number | "null")[]) => void;

  // handlers exposed for DataTable wiring
  handleStateChange: (snapshot: BuildSnapshot) => void;
  handleUserFilterChange: (userIds: (number | "null")[]) => void;
  handleServerSortChange: (payload: {
    sortBy?: string;
    sortOrder?: "asc" | "desc" | undefined;
  }) => void;

  // data fetching values (moved here)
  data: ReturnType<typeof useTasks> extends { data: infer D } ? D : unknown;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function TaskProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: Partial<TaskQueryParams>;
}) {
  const [params, setParamsState] = useState<TaskQueryParams>({
    page: 1,
    pageSize: 25,
    ...initial,
  });

  const paramsRef = useRef<TaskQueryParams>(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // debounced setter
  const debouncedSet = useMemo(
    () =>
      debounce((next: unknown) => {
        setParamsState(next as TaskQueryParams);
      }, 200),
    []
  );

  const setParams = useCallback(
    (next: TaskQueryParams) => setParamsState(next),
    []
  );
  const scheduleParams = useCallback(
    (next: TaskQueryParams) => debouncedSet(next),
    [debouncedSet]
  );

  const mergeParams = useCallback(
    (patch: Partial<TaskQueryParams>, opts?: { resetPage?: boolean }) => {
      setParamsState((prev) => {
        const merged = { ...prev, ...patch };
        if (opts?.resetPage) merged.page = 1;
        return merged;
      });
    },
    []
  );

  // selected users
  const [selectedUserIds, setSelectedUserIds] = useState<(number | "null")[]>(
    []
  );

  // server sort change
  const handleServerSortChange = useCallback(
    (payload: { sortBy?: string; sortOrder?: "asc" | "desc" | undefined }) => {
      setParamsState((prev) => ({
        ...prev,
        sort: payload.sortBy ?? prev.sort,
        order: payload.sortOrder ?? prev.order,
        page: 1,
      }));
    },
    []
  );

  // helper: build params from table snapshot
  const buildParamsFromSnapshot = useCallback(
    (snapshot: BuildSnapshot): TaskQueryParams => {
      const prev = paramsRef.current;
      const next: TaskQueryParams = {
        ...prev,
        page: snapshot.pageIndex + 1,
        pageSize: snapshot.pageSize,
      };

      for (const columnFilter of snapshot.columnFilters ?? []) {
        const columnId = String(columnFilter.id);
        applyColumnFilter(next, columnId, columnFilter.value, selectedUserIds);
      }

      clearCommonFiltersWhenNoColumnFilters(
        next,
        snapshot.columnFilters,
        selectedUserIds
      );

      applySortingIfNeeded(next, prev, snapshot.sorting);

      const watchedKeys: (keyof TaskQueryParams)[] = [
        "status",
        "priority",
        "search",
        "assigned_to",
      ];
      if (haveWatchedFiltersChanged(prev, next, watchedKeys)) {
        next.page = 1;
      }

      return next;
    },
    [selectedUserIds]
  );

  // handleStateChange & handleUserFilterChange (exposed for DataTable)
  const handleStateChange = useCallback(
    (snapshot: BuildSnapshot) => {
      const next = buildParamsFromSnapshot(snapshot);
      scheduleParams(next);
    },
    [buildParamsFromSnapshot, scheduleParams]
  );

  const handleUserFilterChange = useCallback(
    (userIds: (number | "null")[]) => {
      setSelectedUserIds(userIds);
      mergeParams(
        { assigned_to: userIds.length ? userIds.join(",") : undefined },
        { resetPage: true }
      );
    },
    [mergeParams]
  );

  // Move data fetching into provider by calling useTasks(params)
  const { data, isLoading, error, refetch } = useTasks(params);

  const value = useMemo(
    (): TaskContextValue => ({
      params,
      paramsRef,
      setParams,
      scheduleParams,
      mergeParams,
      selectedUserIds,
      setSelectedUserIds,
      handleStateChange,
      handleUserFilterChange,
      handleServerSortChange,
      data,
      isLoading,
      error,
      refetch,
    }),
    [
      params,
      setParams,
      scheduleParams,
      mergeParams,
      selectedUserIds,
      setSelectedUserIds,
      handleStateChange,
      handleUserFilterChange,
      handleServerSortChange,
      data,
      isLoading,
      error,
      refetch,
    ]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}
