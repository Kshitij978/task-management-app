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
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  priority?: string;
  assigned_to?: string; // comma-separated values like "1,2,null"
  sort?: string;
  order?: "asc" | "desc";
  due_date_from?: string;
  due_date_to?: string;
};

export type PagedResult<T> = {
  items: T[];
  total: number;
};
