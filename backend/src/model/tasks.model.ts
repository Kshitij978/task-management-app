import pool from "../utils/db";

export interface TaskRow {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
}

export async function findTaskById(id: number) {
  const q = `SELECT t.*, u.full_name as assigned_user_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.id = $1`;
  const { rows } = await pool.query(q, [id]);
  return rows[0] ?? null;
}

/**
 * Filtering, search, sort, pagination
 * params: status, priority, assigned_to, search, sort, order, limit, offset
 */
export async function findTasks(params: {
  status?: string;
  priority?: string;
  assigned_to?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}) {
  const {
    status,
    priority,
    assigned_to,
    search,
    sort = "created_at",
    order = "desc",
    limit = 20,
    offset = 0,
  } = params;

  const allowedSortFields = new Set([
    "created_at",
    "due_date",
    "priority",
    "id",
  ]);
  if (!allowedSortFields.has(sort))
    throw Object.assign(new Error("Invalid sort field"), { statusCode: 400 });

  const values: any[] = [];
  const where: string[] = [];

  let idx = 1;
  if (status) {
    where.push(`status = $${idx++}`);
    values.push(status);
  }
  if (priority) {
    where.push(`priority = $${idx++}`);
    values.push(priority);
  }
  if (typeof assigned_to !== "undefined") {
    where.push(`assigned_to = $${idx++}`);
    values.push(assigned_to);
  }
  if (search) {
    where.push(
      `to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')) @@ plainto_tsquery('english', $${idx++})`
    );
    values.push(search);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const q = `
    SELECT t.*, u.full_name as assigned_user_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    ${whereClause}
    ORDER BY ${sort} ${order === "asc" ? "ASC" : "DESC"}
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  values.push(limit, offset);
  const { rows } = await pool.query<TaskRow>(q, values);
  return rows;
}

export async function createTask(data: {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  due_date?: string | null;
  assigned_to?: number | null;
}) {
  const q = `INSERT INTO tasks (title, description, status, priority, due_date, assigned_to)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
  const { rows } = await pool.query<TaskRow>(q, [
    data.title,
    data.description ?? null,
    data.status ?? "todo",
    data.priority ?? "medium",
    data.due_date ?? null,
    data.assigned_to ?? null,
  ]);
  return rows[0];
}

export async function updateTaskWithOptimisticLock(
  id: number,
  patch: any,
  expectedUpdatedAt?: string
) {
  // Build dynamic query; include optimistic locking if expectedUpdatedAt provided
  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(patch)) {
    sets.push(`${k} = $${idx++}`);
    values.push(v);
  }
  if (sets.length === 0) return null;
  // updated_at will be set by trigger
  let q = `UPDATE tasks SET ${sets.join(", ")} WHERE id = $${idx}`;
  values.push(id);
  if (expectedUpdatedAt) {
    q += ` AND updated_at = $${++idx}`;
    values.push(expectedUpdatedAt);
  }
  q += ` RETURNING *`;
  const { rows } = await pool.query<TaskRow>(q, values);
  return rows[0] ?? null;
}

export async function deleteTaskById(id: number) {
  const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [
    id,
  ]);
  return rowCount === 1;
}
