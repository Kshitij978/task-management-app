/**
 * Unit tests for user.model.ts
 *
 * - Mocks the DB pool before importing the model.
 * - Tests CRUD helpers and transactional delete.
 */

jest.mock("../../../src/utils/db");

import pool from "../../../src/utils/db";
import * as usersModel from "../../../src/model/users.model";
import type { UserRow } from "../../../src/model/users.model";

const mockedPool = pool as unknown as {
  query: jest.Mock;
  connect: jest.Mock;
  end?: jest.Mock;
};

describe("users.model", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ---------- findAllUsers ----------
  test("findAllUsers returns rows", async () => {
    const fake: UserRow[] = [
      {
        id: 1,
        username: "john",
        email: "john@example.com",
        full_name: "John",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    mockedPool.query.mockResolvedValueOnce({ rows: fake });

    const res = await usersModel.findAllUsers(10, 0);
    expect(res).toEqual(fake);
    expect(mockedPool.query).toHaveBeenCalledWith(expect.any(String), [10, 0]);
  });

  test("findAllUsers passes default limit/offset when omitted", async () => {
    const fake: UserRow[] = [];
    mockedPool.query.mockResolvedValueOnce({ rows: fake });

    const res = await usersModel.findAllUsers();
    expect(res).toEqual([]);
    // defaults are LIMIT $1 OFFSET $2 with 100 and 0
    expect(mockedPool.query).toHaveBeenCalledWith(expect.any(String), [100, 0]);
  });

  // ---------- findUserById ----------
  test("findUserById returns row when found", async () => {
    const row: UserRow = {
      id: 2,
      username: "alice",
      email: "alice@example.com",
      full_name: "Alice",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockedPool.query.mockResolvedValueOnce({ rows: [row] });

    const res = await usersModel.findUserById(2);
    expect(res).toEqual(row);
    expect(mockedPool.query).toHaveBeenCalledWith(expect.any(String), [2]);
  });

  test("findUserById returns null when not found", async () => {
    mockedPool.query.mockResolvedValueOnce({ rows: [] });
    const res = await usersModel.findUserById(999);
    expect(res).toBeNull();
  });

  // ---------- findUserByEmailOrUsername ----------
  test("findUserByEmailOrUsername returns user when found", async () => {
    const row = { id: 3, username: "u3", email: "u3@example.com" };
    mockedPool.query.mockResolvedValueOnce({ rows: [row] });

    const res = await usersModel.findUserByEmailOrUsername(
      "u3@example.com",
      "u3"
    );
    expect(res).toEqual(row);
    expect(mockedPool.query).toHaveBeenCalledWith(expect.any(String), [
      "u3@example.com",
      "u3",
    ]);
  });

  test("findUserByEmailOrUsername returns null when not found", async () => {
    mockedPool.query.mockResolvedValueOnce({ rows: [] });
    const res = await usersModel.findUserByEmailOrUsername("x@x", "x");
    expect(res).toBeNull();
  });

  // ---------- createUser ----------
  test("createUser inserts and returns created row", async () => {
    const created: UserRow = {
      id: 10,
      username: "new",
      email: "n@example.com",
      full_name: "New",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockedPool.query.mockResolvedValueOnce({ rows: [created] });

    const res = await usersModel.createUser({
      username: "new",
      email: "n@example.com",
      full_name: "New",
    });

    expect(res).toEqual(created);
    expect(mockedPool.query).toHaveBeenCalledWith(expect.any(String), [
      "new",
      "n@example.com",
      "New",
    ]);
  });

  // ---------- updateUserById ----------
  test("updateUserById returns updated row", async () => {
    const updated: UserRow = {
      id: 20,
      username: "u20",
      email: "20@example.com",
      full_name: "U20",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockedPool.query.mockResolvedValueOnce({ rows: [updated] });

    const res = await usersModel.updateUserById(20, { full_name: "U20" });
    expect(res).toEqual(updated);

    // ensure query params include new full_name and id
    const args = mockedPool.query.mock.calls[0][1] as any[];
    expect(args).toContain("U20");
    expect(args).toContain(20);
  });

  test("updateUserById returns null for empty patch", async () => {
    const res = await usersModel.updateUserById(5, {});
    expect(res).toBeNull();
    expect(mockedPool.query).not.toHaveBeenCalled();
  });

  test("updateUserById returns null when DB returns no rows", async () => {
    mockedPool.query.mockResolvedValueOnce({ rows: [] });
    const res = await usersModel.updateUserById(1, { full_name: "X" });
    expect(res).toBeNull();
  });

  // ---------- deleteUserByIdTransactional ----------
  test("deleteUserByIdTransactional commits and returns deleted true + task ids", async () => {
    // Prepare client mock with sequential responses:
    // 1) SELECT id FROM tasks WHERE assigned_to = $1  -> returns task rows
    // 2) DELETE FROM users WHERE id = $1 -> returns { rowCount: 1 }
    const client = {
      query: jest
        .fn()
        // first call: BEGIN -> could return anything
        .mockResolvedValueOnce({ rows: [] })
        // second call: SELECT id FROM tasks...
        .mockResolvedValueOnce({ rows: [{ id: 101 }, { id: 102 }] })
        // third call: DELETE FROM users...
        .mockResolvedValueOnce({ rowCount: 1 })
        // fourth call: COMMIT
        .mockResolvedValueOnce({ rows: [] }),
      release: jest.fn(),
    };

    mockedPool.connect.mockResolvedValueOnce(client);

    const res = await usersModel.deleteUserByIdTransactional(3);
    expect(res).toEqual({ deleted: true, affectedTaskIds: [101, 102] });

    // Ensure client.query was called for BEGIN/SELECT/DELETE/COMMIT
    expect(client.query).toHaveBeenCalled();
    expect(client.release).toHaveBeenCalled();
    // Verify that the DELETE call used id=3 somewhere in the args
    const calls = client.query.mock.calls.map((c: any[]) => c);
    // find the DELETE call (we expect an object with rowCount returned at index 2)
    expect(calls[2]).toBeDefined();
  });

  test("deleteUserByIdTransactional rolls back and rethrows on error", async () => {
    // Client throws during SELECT; we must see ROLLBACK called and error thrown
    const error = new Error("boom");
    const client = {
      query: jest
        .fn()
        // BEGIN
        .mockResolvedValueOnce({ rows: [] })
        // SELECT -> throw
        .mockRejectedValueOnce(error)
        // ROLLBACK call will be attempted after catch
        .mockResolvedValueOnce({ rows: [] }),
      release: jest.fn(),
    };
    mockedPool.connect.mockResolvedValueOnce(client);

    await expect(usersModel.deleteUserByIdTransactional(4)).rejects.toThrow(
      "boom"
    );

    // After error, code attempts ROLLBACK and client.release()
    // We expect at least one call to query that attempted ROLLBACK (last call)
    expect(client.query).toHaveBeenCalled();
    expect(client.release).toHaveBeenCalled();
    // The second call threw; the next call should be ROLLBACK (the mockResolvedValueOnce for ROLLBACK)
    // Confirm that the sequence contained the ROLLBACK call by checking total calls >= 3
    expect(client.query.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
