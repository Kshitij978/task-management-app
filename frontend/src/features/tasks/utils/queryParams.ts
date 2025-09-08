import type { TaskQueryParams } from "../types/task";
import type { SortingState } from "@tanstack/react-table";

/**
 * Normalize a single filter value to a server string or undefined.
 * - strings are trimmed and empty -> undefined
 * - arrays -> comma-joined or undefined if empty
 * - null/undefined -> undefined
 * - other values -> String(value)
 */
export function normalizeFilterValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  if (Array.isArray(value)) {
    return value.length ? value.join(",") : undefined;
  }
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
}

/**
 * Set normalized value for key on target params, or delete the key if normalized === undefined.
 */
export function setOrDeleteParam<T extends keyof TaskQueryParams>(
  target: TaskQueryParams,
  key: T,
  value: unknown
): void {
  const normalized = normalizeFilterValue(value);
  if (normalized === undefined) {
    delete (target as Record<string, unknown>)[key];
  } else {
    (target as Record<string, unknown>)[key] = normalized as TaskQueryParams[T];
  }
}

/**
 * Apply a single column filter into nextParams. This function is intentionally
 * small and focused so callers can iterate column filters and call it.
 *
 * selectedUserIds is provided to support the custom assigned_user_name filter
 * which lives outside the table's column filter value.
 */
export function applyColumnFilter(
  nextParams: TaskQueryParams,
  columnId: string,
  rawValue: unknown,
  selectedUserIds: (number | "null")[]
): void {
  switch (columnId) {
    case "title": {
      setOrDeleteParam(nextParams, "search", normalizeFilterValue(rawValue));
      return;
    }
    case "status": {
      setOrDeleteParam(nextParams, "status", normalizeFilterValue(rawValue));
      return;
    }
    case "priority": {
      setOrDeleteParam(nextParams, "priority", normalizeFilterValue(rawValue));
      return;
    }
    case "assigned_user_name": {
      if (selectedUserIds && selectedUserIds.length > 0) {
        (nextParams as Record<string, unknown>)["assigned_to"] =
          selectedUserIds.join(",");
      } else {
        delete (nextParams as Record<string, unknown>)["assigned_to"];
      }
      return;
    }
    // Add more known columns here (e.g., due_date_from/due_date_to) as needed.
    default: {
      const normalized = normalizeFilterValue(rawValue);
      if (normalized === undefined) {
        delete (nextParams as Record<string, unknown>)[columnId];
      } else {
        (nextParams as Record<string, unknown>)[columnId] = normalized;
      }
      return;
    }
  }
}

/**
 * Apply sorting descriptor (first item) to nextParams and reset page if the sort changed.
 */
export function applySortingIfNeeded(
  nextParams: TaskQueryParams,
  previousParams: TaskQueryParams,
  sortingSnapshot: SortingState
): void {
  if (!Array.isArray(sortingSnapshot) || sortingSnapshot.length === 0) return;

  const first = sortingSnapshot[0];
  const requestedSort = first.id;
  const requestedOrder: "asc" | "desc" = first.desc ? "desc" : "asc";

  if (
    requestedSort !== previousParams.sort ||
    requestedOrder !== previousParams.order
  ) {
    nextParams.page = 1;
  }
  nextParams.sort = requestedSort;
  nextParams.order = requestedOrder;
}

/**
 * Return true if any of the watched keys changed between prev and cur.
 */
export function haveWatchedFiltersChanged(
  prev: TaskQueryParams,
  cur: TaskQueryParams,
  keys: (keyof TaskQueryParams)[]
): boolean {
  for (const key of keys) {
    const prevStr = prev[key] == null ? "" : String(prev[key]);
    const curStr = cur[key] == null ? "" : String(cur[key]);
    if (prevStr !== curStr) return true;
  }
  return false;
}

export const COMMON_FILTER_KEYS: (keyof TaskQueryParams)[] = [
  "status",
  "priority",
  "search",
];

export function clearCommonFiltersWhenNoColumnFilters(
  nextParams: TaskQueryParams,
  columnFilters: import("@tanstack/react-table").ColumnFiltersState | undefined,
  selectedUserIds: (number | "null")[]
): void {
  if (columnFilters && columnFilters.length > 0) return;

  // Remove well-known common filter keys
  for (const k of COMMON_FILTER_KEYS) {
    delete (nextParams as Record<string, unknown>)[k];
  }

  // assigned_to is a special case backed by external selectedUserIds state
  if (!selectedUserIds || selectedUserIds.length === 0) {
    delete (nextParams as Record<string, unknown>)["assigned_to"];
  }
}
