import type {
  PagedResult,
  Task,
  TaskQueryParams,
} from "@/features/tasks/types/task";
import client from "./api";

export const fetchTasks = async (
  params?: TaskQueryParams
): Promise<PagedResult<Task>> => {
  const limit = params?.pageSize ?? 25;
  const offset =
    typeof params?.page === "number" ? (params.page - 1) * limit : 0;

  const query: Record<string, unknown> = { limit, offset };

  if (params?.search) query.search = params.search;
  if (params?.status) query.status = params.status;
  if (params?.priority) query.priority = params.priority;

  console.log(params);

  const res = await client.get<Task[]>("/tasks", { params: query });
  const tasks = res.data;
  // Prefer X-Total-Count header if backend provides it (common pattern)
  const headerTotal = res.headers?.["x-total-count"];
  const total =
    typeof headerTotal === "string" && headerTotal !== ""
      ? Number(headerTotal)
      : tasks.length;
  return { items: tasks, total };
};

export const fetchTask = async (id: number): Promise<Task> => {
  const res = await client.get<Task>(`/tasks/${id}`);
  return res.data;
};

export const createTask = async (payload: Partial<Task>): Promise<Task> => {
  const res = await client.post<Task>("/tasks", payload);
  return res.data;
};

export const updateTask = async (
  id: number,
  payload: Partial<Task>
): Promise<Task> => {
  const res = await client.put<Task>(`/tasks/${id}`, payload);
  return res.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  await client.delete(`/tasks/${id}`);
};
