import request from "supertest";

/**
 * Unit tests for tasks.controller.ts
 *
 * - Mocks tasks.model functions and pool (DB util) before importing the app.
 * - Tests parsing of query params in getAllTasks and all handlers' main code paths.
 */

// Mock model functions used by the controller BEFORE importing app
const mockFindTasks = jest.fn();
const mockFindTaskById = jest.fn();
const mockCreateTask = jest.fn();
const mockUpdateTaskWithOptimisticLock = jest.fn();
const mockDeleteTaskById = jest.fn();

jest.mock("../../../src/model/tasks.model", () => ({
  __esModule: true,
  findTasks: mockFindTasks,
  findTaskById: mockFindTaskById,
  createTask: mockCreateTask,
  updateTaskWithOptimisticLock: mockUpdateTaskWithOptimisticLock,
  deleteTaskById: mockDeleteTaskById,
}));

// Mock DB util so controllers that call pool.query('SELECT id FROM users ...') don't hit real DB
jest.mock("../../../src/utils/db");

import app from "../../../src/index"; // ensure this exports express app
import pool from "../../../src/utils/db";

const mockedPool = pool as unknown as {
  query: jest.Mock;
  connect?: jest.Mock;
  end?: jest.Mock;
};

describe("Tasks Controller - unit", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("GET /api/tasks - unexpected error routes to next -> 500", async () => {
    // make findTasks throw a generic error (no statusCode)
    mockFindTasks.mockRejectedValueOnce(new Error("boom"));

    const res = await request(app).get("/api/tasks");

    // Debugging assist if it doesn't behave as expected
    if (res.status !== 500) {
      // eslint-disable-next-line no-console
      console.error("Expected 500 but got:", res.status, res.body);
    }

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/internal/i);
  });

  test("GET /api/tasks - assigned_to param with invalid number is ignored", async () => {
    // Arrange: mock findTasks to capture params and return a dummy row
    const mockFindTasks = require("../../../src/model/tasks.model")
      .findTasks as jest.Mock;
    const mockRows = [
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
    mockFindTasks.mockResolvedValueOnce(mockRows);

    // Act
    const res = await request(app).get("/api/tasks?assigned_to=abc");

    // Assert response
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockRows);

    // Assert controller passed an empty array for assigned_to (invalid entries filtered out)
    const paramsPassed = mockFindTasks.mock.calls[0][0];
    expect(paramsPassed.assigned_to).toEqual([]);
    // And importantly, controller did not attempt to filter by assigned_to (handled by model when length === 0)
    expect(mockFindTasks).toHaveBeenCalled();
  });

  // ---------------- getAllTasks ----------------
  test("GET /api/tasks - returns list and calls findTasks with defaults", async () => {
    const fakeRows = [
      { id: 1, title: "t1" },
      { id: 2, title: "t2" },
    ];
    mockFindTasks.mockResolvedValueOnce(fakeRows);

    const res = await request(app).get("/api/tasks");

    if (res.status !== 200)
      console.error("GET /api/tasks failed:", res.status, res.body);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(mockFindTasks).toHaveBeenCalledTimes(1);
    // expect called with default params object
    expect(mockFindTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        status: undefined,
        priority: undefined,
        assigned_to: undefined,
        search: undefined,
        sort: "created_at",
        order: "desc",
        limit: expect.any(Number),
        offset: expect.any(Number),
      })
    );
  });

  test("GET /api/tasks - parses CSV params and assigned_to 'null'", async () => {
    // Confirm controller parses status, priority, assigned_to CSVs into arrays
    mockFindTasks.mockResolvedValueOnce([]);

    const res = await request(app).get(
      "/api/tasks?status=todo,in-progress&priority=high&assigned_to=1,null,3&search=foo&sort=due_date&order=asc&limit=5&offset=2"
    );

    expect(res.status).toBe(200);
    expect(mockFindTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ["todo", "in-progress"],
        priority: ["high"],
        assigned_to: [1, "null", 3],
        search: "foo",
        sort: "due_date",
        order: "asc",
        limit: 5,
        offset: 2,
      })
    );
  });

  test("GET /api/tasks - invalid sort param handled (400)", async () => {
    // If findTasks throws an error with statusCode 400, controller maps it to 400 response
    const err: any = new Error("Invalid sort");
    err.statusCode = 400;
    mockFindTasks.mockRejectedValueOnce(err);

    const res = await request(app).get("/api/tasks?sort=invalid_field");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  // ---------------- getTaskByIdHandler ----------------
  test("GET /api/tasks/:id - valid id returns task", async () => {
    const t = { id: 10, title: "task10" };
    mockFindTaskById.mockResolvedValueOnce(t);

    const res = await request(app).get("/api/tasks/10");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(t);
    expect(mockFindTaskById).toHaveBeenCalledWith(10);
  });

  test("GET /api/tasks/:id - non-numeric id returns 400", async () => {
    const res = await request(app).get("/api/tasks/not-a-number");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("GET /api/tasks/:id - missing task returns 404", async () => {
    mockFindTaskById.mockResolvedValueOnce(null);
    const res = await request(app).get("/api/tasks/999");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(mockFindTaskById).toHaveBeenCalledWith(999);
  });

  // ---------------- createTaskHandler ----------------
  test("POST /api/tasks - validation fails for missing required fields", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("POST /api/tasks - assigned_to non-existent returns 400", async () => {
    // pool.query should return { rows: [] } to indicate user not found
    mockedPool.query.mockResolvedValueOnce({ rows: [] });

    const payload = { title: "New", assigned_to: 9999 };
    const res = await request(app).post("/api/tasks").send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockedPool.query).toHaveBeenCalledWith(
      "SELECT id FROM users WHERE id = $1",
      [9999]
    );
  });

  test("POST /api/tasks - success returns 201", async () => {
    // pool check returns existing user row if assigned_to provided
    mockedPool.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });
    const inserted = { id: 42, title: "Created" };
    mockCreateTask.mockResolvedValueOnce(inserted);

    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Created", assigned_to: 2 });

    if (res.status !== 201)
      console.error("POST /api/tasks unexpected:", res.status, res.body);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(inserted);
    expect(mockCreateTask).toHaveBeenCalled();
  });

  // ---------------- updateTaskHandler ----------------
  test("PUT /api/tasks/:id - invalid id returns 400", async () => {
    const res = await request(app)
      .put("/api/tasks/not-a-number")
      .send({ title: "x" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("PUT /api/tasks/:id - validation fails for invalid body", async () => {
    const res = await request(app)
      .put("/api/tasks/5")
      .send({ status: "not-a-valid-status" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("PUT /api/tasks/:id - assigned_to non-existent returns 400", async () => {
    // Controller will run pool.query to validate assigned user; mock to empty rows
    mockedPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put("/api/tasks/5")
      .send({ assigned_to: 9999 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockedPool.query).toHaveBeenCalledWith(
      "SELECT id FROM users WHERE id = $1",
      [9999]
    );
  });

  test("PUT /api/tasks/:id - optimistic lock conflict returns 409", async () => {
    // Simulate updateTaskWithOptimisticLock returning falsy when expectedUpdatedAt provided
    mockUpdateTaskWithOptimisticLock.mockResolvedValueOnce(null);

    const expectedInput = "2024-01-01T00:00:00Z";
    const res = await request(app)
      .put("/api/tasks/7")
      .send({ title: "x", updated_at: expectedInput });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error");
    expect(mockUpdateTaskWithOptimisticLock).toHaveBeenCalledTimes(1);

    // Get actual call args
    const callArgs = mockUpdateTaskWithOptimisticLock.mock.calls[0];
    expect(callArgs[0]).toBe(7);
    expect(callArgs[1]).toEqual(expect.any(Object));

    // Normalize/compare the timestamp in a robust way (compare instants)
    const passedUpdatedAt = callArgs[2];
    expect(typeof passedUpdatedAt).toBe("string");
    const parsed = new Date(passedUpdatedAt).toISOString();
    const expectedIso = new Date(expectedInput).toISOString();
    expect(parsed).toBe(expectedIso);
  });

  test("PUT /api/tasks/:id - not found returns 404 when update returns falsy and no expectedUpdatedAt", async () => {
    mockUpdateTaskWithOptimisticLock.mockResolvedValueOnce(null);
    // no updated_at passed
    const res = await request(app).put("/api/tasks/8").send({ title: "x" });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  test("PUT /api/tasks/:id - success returns 200", async () => {
    const updated = { id: 9, title: "updated" };
    mockUpdateTaskWithOptimisticLock.mockResolvedValueOnce(updated);

    const res = await request(app)
      .put("/api/tasks/9")
      .send({ title: "updated" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(updated);
    expect(mockUpdateTaskWithOptimisticLock).toHaveBeenCalledWith(
      9,
      expect.any(Object),
      undefined
    );
  });

  test("PUT /api/tasks/:id - unexpected DB error returns 500", async () => {
    mockUpdateTaskWithOptimisticLock.mockRejectedValueOnce(
      new Error("db fail")
    );
    const res = await request(app).put("/api/tasks/1").send({ title: "X" });
    expect(res.status).toBe(500);
  });

  // ---------------- deleteTaskHandler ----------------
  test("DELETE /api/tasks/:id - invalid id returns 400", async () => {
    const res = await request(app).delete("/api/tasks/not-a-number");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("DELETE /api/tasks/:id - not found returns 404", async () => {
    mockDeleteTaskById.mockResolvedValueOnce(false);
    const res = await request(app).delete("/api/tasks/999");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  test("DELETE /api/tasks/:id - success returns 204", async () => {
    mockDeleteTaskById.mockResolvedValueOnce(true);
    const res = await request(app).delete("/api/tasks/5");
    expect(res.status).toBe(204);
    expect(res.text).toBe(""); // empty body for 204
    expect(mockDeleteTaskById).toHaveBeenCalledWith(5);
  });
});
