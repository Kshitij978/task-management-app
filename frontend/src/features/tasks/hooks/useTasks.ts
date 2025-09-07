import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as taskService from "@/services/taskService";
import type { TaskQueryParams, Task, PagedResult } from "../types/task";

const TASKS_QUERY_KEY = "tasks";

export function useTasks(params: TaskQueryParams | undefined) {
  const normalized = {
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 25,
    ...params,
  };

  return useQuery<PagedResult<Task>, Error>({
    queryKey: ["tasks", normalized],
    queryFn: () => taskService.fetchTasks(normalized),
    placeholderData: (previousData) => previousData,
    staleTime: 10000,
    retry: 1,
  });
}

export function useTask(id?: number) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => taskService.fetchTask(id as number),
    enabled: typeof id === "number",
    retry: 1,
  });
}

// Mutations
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Task> }) =>
      taskService.updateTask(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => taskService.deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] }),
  });
}
