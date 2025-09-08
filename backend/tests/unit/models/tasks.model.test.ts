import { TaskRow } from "../../../src/model/tasks.model";

// Mock the DB pool BEFORE importing the model under test
jest.mock("../../../src/utils/db");

import pool from "../../../src/utils/db";
import * as tasksModel from "../../../src/model/tasks.model";

const mockedPool = pool as unknown as {
  query: jest.Mock;
  connect?: jest.Mock;
  end?: jest.Mock;
};

describe("tasks.model", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ---------- findTaskById ----------
  test("findTaskById returns row when found", async () => {
    const fake: TaskRow = {
      id: 1,
      title: "T1",
      description: null,
      status: "todo",
      priority: "medium",
      due_date: null,
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockedPool.query.mockResolvedValueOnce({ rows: [fake] });

    const res = await tasksModel.findTaskById(1);
    expect(res).toEqual(fake);
    expect(mockedPool.query).toHaveBeenCalledWith(expect.any(String), [1]);
  });

  test("findTaskById returns null when not found", async () => {
    mockedPool.query.mockResolvedValueOnce({ rows: [] });
    const res = await tasksModel.findTaskById(999);
    expect(res).toBeNull();
  });

  // ---------- findTasks: basic and filters ----------
  test("findTasks returns rows and passes default params", async () => {
    const rows = [
      {
        id: 1,
        title: "t1",
        description: null,
        status: "todo",
        priority: "low",
        due_date: null,
        assigned_to: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_user_name: null,
        total_count: "1",
      },
    ];
    mockedPool.query.mockResolvedValueOnce({ rows });

    const res = await tasksModel.findTasks({});
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].id).toBe(1);
    expect(mockedPool.query).toHaveBeenCalled();
  });

  test("findTasks handles status and priority arrays", async () => {
    mockedPool.query.mockResolvedValueOnce({ rows: [] });
    await tasksModel.findTasks({
      status: ["todo", "in-progress"],
      priority: ["high"],
    });

    // pool.query called with a SQL string containing "t.status IN" and "t.priority IN"
    const q = mockedPool.query.mock.calls[0][0] as string;
    expect(q).toMatch(/t\.status IN/);
    expect(q).toMatch(/t\.priority IN/);
  });

  test("findTasks handles assigned_to with numbers and null", async () => {
    mockedPool.query.mockResolvedValueOnce({ rows: [] });
    await tasksModel.findTasks({ assigned_to: [1, "null", 3] });

    const q = mockedPool.query.mock.calls[0][0] as string;
    // Should contain assigned_to IS NULL clause and assigned_to IN (...) clause
    expect(q).toMatch(/assigned_to IS NULL/);
    expect(q).toMatch(/assigned_to IN/);
  });

  test("findTasks handles search by to_tsvector", async () => {
    mockedPool.query.mockResolvedValueOnce({ rows: [] });
    await tasksModel.findTasks({ search: "hello" });

    const q = mockedPool.query.mock.calls[0][0] as string;
    expect(q).toMatch(/to_tsvector/);
    // ensure the search parameter was passed
    const params = mockedPool.query.mock.calls[0][1] as any[];
    expect(params).toContain("hello");
  });

  test("findTasks handles due_date range filters", async () => {
    mockedPool.query.mockResolvedValueOnce({ rows: [] });
    await tasksModel.findTasks({
      due_date_from: "2024-01-01",
      due_date_to: "2024-12-31",
    });

    const q = mockedPool.query.mock.calls[0][0] as string;
    expect(q).toMatch(/t\.due_date >=/);
    expect(q).toMatch(/t\.due_date <=/);
  });

  test("findTasks validates invalid sort field throws 400-like error", async () => {
    await expect(
      tasksModel.findTasks({ sort: "not_a_field" as any })
    ).rejects.toMatchObject({
      message: "Invalid sort field",
    });
  });

  test("findTasks orders by chosen sort and tiebreaker id", async () => {
    mockedPool.query.mockResolvedValueOnce({ rows: [] });
    await tasksModel.findTasks({ sort: "due_date", order: "asc" });

    const q = mockedPool.query.mock.calls[0][0] as string;
    expect(q).toMatch(/ORDER BY t\.due_date ASC, t\.id ASC/);
  });

  // ---------- createTask ----------
  test("createTask inserts and returns created row", async () => {
    const created: TaskRow = {
      id: 99,
      title: "created",
      description: "desc",
      status: "todo",
      priority: "medium",
      due_date: null,
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockedPool.query.mockResolvedValueOnce({ rows: [created] });

    const res = await tasksModel.createTask({
      title: "created",
      description: "desc",
    });
    expect(res).toEqual(created);

    const callArgs = mockedPool.query.mock.calls[0][1] as any[];
    // parameter positions: title, description, status, priority, due_date, assigned_to
    expect(callArgs[0]).toBe("created");
    expect(callArgs[1]).toBe("desc");
  });

  // ---------- updateTaskWithOptimisticLock ----------
  test("updateTaskWithOptimisticLock returns updated row when updated", async () => {
    const updated: TaskRow = {
      id: 7,
      title: "updated",
      description: null,
      status: "todo",
      priority: "medium",
      due_date: null,
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockedPool.query.mockResolvedValueOnce({ rows: [updated] });

    const res = await tasksModel.updateTaskWithOptimisticLock(
      7,
      { title: "updated" },
      undefined
    );
    expect(res).toEqual(updated);

    // Ensure query string contains "UPDATE tasks SET"
    const q = mockedPool.query.mock.calls[0][0] as string;
    expect(q).toMatch(/^UPDATE tasks SET/);
    // Ensure values contain the patch value and id
    const vals = mockedPool.query.mock.calls[0][1] as any[];
    expect(vals).toContain("updated");
    expect(vals).toContain(7);
  });

  test("updateTaskWithOptimisticLock returns null when no rows (optimistic lock fail)", async () => {
    mockedPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await tasksModel.updateTaskWithOptimisticLock(
      7,
      { title: "x" },
      "2024-01-01T00:00:00Z"
    );
    expect(res).toBeNull();

    // Verify the query included the AND updated_at = $N clause when expectedUpdatedAt provided
    const q = mockedPool.query.mock.calls[0][0] as string;
    expect(q).toMatch(/AND updated_at =/);
  });

  test("updateTaskWithOptimisticLock returns null if patch empty", async () => {
    const res = await tasksModel.updateTaskWithOptimisticLock(7, {}, undefined);
    expect(res).toBeNull();
    expect(mockedPool.query).not.toHaveBeenCalled();
  });

  // ---------- deleteTaskById ----------
  test("deleteTaskById returns true when rowCount === 1", async () => {
    mockedPool.query.mockResolvedValueOnce({ rowCount: 1 });
    const ok = await tasksModel.deleteTaskById(5);
    expect(ok).toBe(true);
    expect(mockedPool.query).toHaveBeenCalledWith(
      "DELETE FROM tasks WHERE id = $1",
      [5]
    );
  });

  test("deleteTaskById returns false when rowCount !== 1", async () => {
    mockedPool.query.mockResolvedValueOnce({ rowCount: 0 });
    const ok = await tasksModel.deleteTaskById(999);
    expect(ok).toBe(false);
  });
});
