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
  status?: string[];
  priority?: string[];
  assigned_to?: (number | "null")[];
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

  // whitelist of allowed sort -> actual column (fully controlled)
  const SORT_MAP: Record<string, string> = {
    created_at: "created_at",
    updated_at: "updated_at",
    due_date: "due_date",
    priority: "priority",
    id: "id",
    title: "title",
  };

  if (!(sort in SORT_MAP)) {
    const err: any = new Error("Invalid sort field");
    err.statusCode = 400;
    throw err;
  }
  const sortCol = SORT_MAP[sort];

  const values: unknown[] = [];
  const where: string[] = [];
  let idx = 1;

  // status IN (...)
  if (status && status.length > 0) {
    const placeholders = status.map(() => `$${idx++}`).join(",");
    where.push(`t.status IN (${placeholders})`);
    values.push(...status);
  }

  // priority IN (...)
  if (priority && priority.length > 0) {
    const placeholders = priority.map(() => `$${idx++}`).join(",");
    where.push(`t.priority IN (${placeholders})`);
    values.push(...priority);
  }

  // assigned_to: array of numbers and/or "null"
  if (assigned_to && assigned_to.length > 0) {
    const numberValues = assigned_to.filter(
      (v): v is number => typeof v === "number"
    );
    const hasNull = assigned_to.some((v) => v === "null");

    const conditions: string[] = [];
    if (numberValues.length > 0) {
      const placeholders = numberValues.map(() => `$${idx++}`).join(",");
      conditions.push(`t.assigned_to IN (${placeholders})`);
      values.push(...numberValues);
    }
    if (hasNull) {
      conditions.push(`t.assigned_to IS NULL`);
    }
    if (conditions.length > 0) {
      where.push(`(${conditions.join(" OR ")})`);
    }
  }

  // full-text search
  if (search && search.trim().length > 0) {
    where.push(
      `to_tsvector('english', coalesce(t.title,'') || ' ' || coalesce(t.description,'')) @@ plainto_tsquery('english', $${idx++})`
    );
    values.push(search);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // deterministic order: primary sort + id as tiebreaker
  const orderDir = order === "asc" ? "ASC" : "DESC";
  const orderClause = `ORDER BY t.${sortCol} ${orderDir}, t.id ${orderDir}`;

  const q = `
  SELECT t.*, u.full_name as assigned_user_name,
         COUNT(*) OVER() AS total_count
  FROM tasks t
  LEFT JOIN users u ON t.assigned_to = u.id
  ${whereClause}
  ${orderClause}
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
