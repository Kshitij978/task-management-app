import client from "./api";

export type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  due_date?: string | null;
  assigned_to?: number | null;
  assigned_user_name?: string | null; // from LEFT JOIN
  created_at: string;
  updated_at: string;
};

export type TaskQueryParams = {
  status?: Task["status"];
  priority?: Task["priority"];
  assigned_to?: number | null;
  search?: string;
  sort?: "created_at" | "due_date" | "priority" | "id";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export const fetchTasks = async (params?: TaskQueryParams): Promise<Task[]> => {
  const res = await client.get<Task[]>("/tasks", { params });
  return res.data;
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
