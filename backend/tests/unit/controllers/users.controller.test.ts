// backend/tests/unit/users.controller.test.ts
import request from "supertest";

/**
 * Unit tests for users.controller.ts
 *
 * We mock the model functions that the controller depends on so tests are fast
 * and deterministic. Make sure this mock setup runs BEFORE importing the app.
 */

// ---- Mock model exports used by controller ----
const mockFindAllUsers = jest.fn();
const mockFindUserById = jest.fn();
const mockFindUserByEmailOrUsername = jest.fn();
const mockCreateUser = jest.fn();
const mockUpdateUserById = jest.fn();
const mockDeleteUserByIdTransactional = jest.fn();

jest.mock("../../../src/model/users.model", () => ({
  __esModule: true,
  findAllUsers: mockFindAllUsers,
  findUserById: mockFindUserById,
  findUserByEmailOrUsername: mockFindUserByEmailOrUsername,
  createUser: mockCreateUser,
  updateUserById: mockUpdateUserById,
  deleteUserByIdTransactional: mockDeleteUserByIdTransactional,
}));

// Also mock DB util to be safe for other imports
jest.mock("../../../src/utils/db");

import app from "../../../src/index"; // your express app (should export app, not just start listening)

describe("Users Controller - unit", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ---------- GET /api/users ----------
  test("GET /api/users - unexpected error -> 500 and next(err) path covered", async () => {
    // make findAllUsers reject with a plain error
    mockFindAllUsers.mockRejectedValueOnce(new Error("boom-getAll"));
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });

  test("GET /api/users - returns list", async () => {
    const fake = [
      { id: 1, username: "john", email: "john@example.com", full_name: "John" },
    ];
    mockFindAllUsers.mockResolvedValueOnce(fake);

    const res = await request(app).get("/api/users");

    if (res.status !== 200) {
      // eslint-disable-next-line no-console
      console.error("GET /api/users failed:", res.status, res.body);
    }

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].username).toBe("john");
    expect(mockFindAllUsers).toHaveBeenCalled();
  });

  // ---------- GET /api/users/:id ----------
  test("GET /api/users/:id - valid id returns user", async () => {
    const user = { id: 2, username: "a", email: "a@x.com", full_name: "A" };
    mockFindUserById.mockResolvedValueOnce(user);

    const res = await request(app).get("/api/users/2");

    if (res.status !== 200)
      console.error("GET /api/users/2 failed:", res.status, res.body);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(2);
    expect(mockFindUserById).toHaveBeenCalledWith(2);
  });

  test("GET /api/users/:id - non-numeric id returns 400", async () => {
    const res = await request(app).get("/api/users/not-a-number");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("GET /api/users/:id - missing user returns 404", async () => {
    mockFindUserById.mockResolvedValueOnce(null);
    const res = await request(app).get("/api/users/999");
    if (res.status !== 404)
      console.error("GET missing user unexpected body:", res.body);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(mockFindUserById).toHaveBeenCalledWith(999);
  });

  // ---------- POST /api/users ----------
  test("POST /api/users - validation fails for missing required fields", async () => {
    const res = await request(app).post("/api/users").send({ username: "" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("POST /api/users - duplicate unique constraint maps to 409", async () => {
    // Controller calls findUserByEmailOrUsername first. Simulate no existing user,
    // then simulate createUser throwing PG unique error (code 23505).
    mockFindUserByEmailOrUsername.mockResolvedValueOnce(null);
    mockCreateUser.mockRejectedValueOnce(
      Object.assign(new Error("dup"), { code: "23505" })
    );

    const payload = {
      username: "dup",
      email: "dup@example.com",
      full_name: "Dup",
    };
    const res = await request(app).post("/api/users").send(payload);

    if (res.status !== 409)
      console.error("POST duplicate unexpected:", res.status, res.body);
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error");
    expect(mockFindUserByEmailOrUsername).toHaveBeenCalledWith(
      payload.email,
      payload.username
    );
    expect(mockCreateUser).toHaveBeenCalled();
  });

  test("POST /api/users - success returns 201", async () => {
    const newUser = {
      id: 10,
      username: "new",
      email: "n@x.com",
      full_name: "New",
    };
    mockFindUserByEmailOrUsername.mockResolvedValueOnce(null);
    mockCreateUser.mockResolvedValueOnce(newUser);

    const res = await request(app).post("/api/users").send({
      username: "new",
      email: "n@x.com",
      full_name: "New",
    });

    if (res.status !== 201)
      console.error("POST success unexpected:", res.status, res.body);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 10, username: "new" });
    expect(mockCreateUser).toHaveBeenCalled();
  });

  test("POST /api/users - pre-existence check returns 409 without creating", async () => {
    const existing = {
      id: 1,
      username: "taken",
      email: "taken@example.com",
      full_name: "Taken",
    };
    mockFindUserByEmailOrUsername.mockResolvedValueOnce(existing);

    const res = await request(app).post("/api/users").send({
      username: "taken",
      email: "taken@example.com",
      full_name: "Any",
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error");
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  // ---------- PUT /api/users/:id ----------
  test("PUT /api/users/:id - invalid id returns 400", async () => {
    const res = await request(app)
      .put("/api/users/not-a-number")
      .send({ full_name: "x" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("PUT /api/users/:id - validation fails for invalid body", async () => {
    // valid numeric id but body invalid
    const res = await request(app)
      .put("/api/users/5")
      .send({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("PUT /api/users/:id - conflict when email/username already in use", async () => {
    // Simulate the "existing" user that has the same email but different id
    const existing = {
      id: 2,
      username: "other",
      email: "other@x.com",
      full_name: "Other",
    };

    // Controller will call findUserByEmailOrUsername(...) once during the uniqueness check
    mockFindUserByEmailOrUsername.mockResolvedValueOnce(existing);

    // Perform the request - attempt to update user with id=5 to use existing.email
    const res = await request(app)
      .put("/api/users/5")
      .send({ email: "other@x.com" });

    // Debug output if it fails so you can see the actual response body
    if (res.status !== 409) {
      // eslint-disable-next-line no-console
      console.error(
        "PUT conflict test failed - status:",
        res.status,
        "body:",
        res.body
      );
    }

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error");
    // ensure the uniqueness check was invoked with provided email and username (username undefined here)
    expect(mockFindUserByEmailOrUsername).toHaveBeenCalledWith(
      "other@x.com",
      ""
    );
    // updateUserById should not be called in conflict case
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  test("PUT /api/users/:id - conflict when username already in use", async () => {
    const existing = {
      id: 2,
      username: "taken",
      email: "other@x.com",
      full_name: "Other",
    };
    mockFindUserByEmailOrUsername.mockResolvedValueOnce(existing);

    const res = await request(app)
      .put("/api/users/5")
      .send({ username: "taken" });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error");
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  test("PUT /api/users/:id - not found returns 404", async () => {
    // After validation and uniqueness check, updateUserById returns falsy -> 404
    mockFindUserByEmailOrUsername.mockResolvedValueOnce(null);
    mockUpdateUserById.mockResolvedValueOnce(null);

    const res = await request(app)
      .put("/api/users/999")
      .send({ full_name: "Noop" });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(mockUpdateUserById).toHaveBeenCalledWith(999, expect.any(Object));
  });

  test("PUT /api/users/:id - success returns 200", async () => {
    const updated = { id: 7, username: "u7", email: "7@x", full_name: "U7" };
    mockFindUserByEmailOrUsername.mockResolvedValueOnce(null);
    mockUpdateUserById.mockResolvedValueOnce(updated);

    const res = await request(app)
      .put("/api/users/7")
      .send({ full_name: "U7" });
    if (res.status !== 200)
      console.error("PUT success unexpected:", res.status, res.body);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(updated);
    expect(mockUpdateUserById).toHaveBeenCalledWith(7, expect.any(Object));
  });

  test("PUT /api/users/:id - PG unique violation mapped to 409 (no unhandled throw)", async () => {
    // Controller will call findUserByEmailOrUsername -> updateUserById
    // Simulate uniqueness check returns null then update throws code 23505
    mockFindUserByEmailOrUsername.mockResolvedValueOnce(null);
    const pgErr: any = new Error("duplicate key");
    pgErr.code = "23505";
    mockUpdateUserById.mockRejectedValueOnce(pgErr);

    const res = await request(app)
      .put("/api/users/5")
      .send({ email: "dup@example.com" });
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error");
  });

  test("PUT /api/users/:id - unexpected DB error -> 500", async () => {
    // Make updateUserById throw a generic error
    mockFindUserByEmailOrUsername.mockResolvedValueOnce(null);
    mockUpdateUserById.mockRejectedValueOnce(new Error("db-fail"));

    const res = await request(app).put("/api/users/5").send({ full_name: "X" });
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });

  // ---------- DELETE /api/users/:id ----------
  test("DELETE /api/users/:id - non-existent returns 404", async () => {
    mockDeleteUserByIdTransactional.mockResolvedValueOnce({
      deleted: false,
      affectedTaskIds: [],
    });

    const res = await request(app).delete("/api/users/999");
    if (res.status !== 404)
      console.error("DELETE non-existent unexpected:", res.status, res.body);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(mockDeleteUserByIdTransactional).toHaveBeenCalledWith(999);
  });

  test("DELETE /api/users/:id - success returns 200 with details", async () => {
    const affected = [1, 2, 3];
    mockDeleteUserByIdTransactional.mockResolvedValueOnce({
      deleted: true,
      affectedTaskIds: affected,
    });

    const res = await request(app).delete("/api/users/3");
    if (res.status !== 200)
      console.error("DELETE success unexpected:", res.status, res.body);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      deleted: true,
      affectedTasksCount: affected.length,
      affectedTaskIds: affected,
    });
    expect(mockDeleteUserByIdTransactional).toHaveBeenCalledWith(3);
  });

  test("DELETE /api/users/:id - invalid id returns 400", async () => {
    const res = await request(app).delete("/api/users/not-a-number");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
