import pool from "../utils/db";

export interface UserRow {
  id: number;
  username: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export async function findAllUsers(limit = 100, offset = 0) {
  const q = `SELECT id, username, email, full_name, created_at, updated_at
             FROM users
             ORDER BY id
             LIMIT $1 OFFSET $2`;
  const { rows } = await pool.query<UserRow>(q, [limit, offset]);
  return rows;
}

export async function findUserById(id: number) {
  const q = `SELECT id, username, email, full_name, created_at, updated_at FROM users WHERE id = $1`;
  const { rows } = await pool.query<UserRow>(q, [id]);
  return rows[0] ?? null;
}

export async function findUserByEmailOrUsername(
  email: string,
  username: string
) {
  const q = `SELECT id, username, email FROM users WHERE email = $1 OR username = $2`;
  const { rows } = await pool.query(q, [email, username]);
  return rows[0] ?? null;
}

export async function createUser(u: {
  username: string;
  email: string;
  full_name: string;
}) {
  const q = `INSERT INTO users (username, email, full_name) VALUES ($1,$2,$3) RETURNING id, username, email, full_name, created_at, updated_at`;
  const { rows } = await pool.query<UserRow>(q, [
    u.username,
    u.email,
    u.full_name,
  ]);
  return rows[0];
}

export async function updateUserById(
  id: number,
  patch: Partial<{ username: string; email: string; full_name: string }>
) {
  // Build dynamic set clause
  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(patch)) {
    sets.push(`${k} = $${idx}`);
    values.push(v);
    idx++;
  }
  if (sets.length === 0) return null;
  const q = `UPDATE users SET ${sets.join(
    ", "
  )} WHERE id = $${idx} RETURNING id, username, email, full_name, created_at, updated_at`;
  values.push(id);
  const { rows } = await pool.query<UserRow>(q, values);
  return rows[0] ?? null;
}

export async function deleteUserByIdTransactional(id: number) {
  // Return affected task ids and deletion result inside a transaction
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: taskRows } = await client.query<{ id: number }>(
      "SELECT id FROM tasks WHERE assigned_to = $1",
      [id]
    );
    const taskIds = taskRows.map((r) => r.id);
    const { rowCount } = await client.query("DELETE FROM users WHERE id = $1", [
      id,
    ]);
    await client.query("COMMIT");
    return { deleted: rowCount === 1, affectedTaskIds: taskIds };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
