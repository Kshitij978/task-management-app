import pool from "../../../src/utils/db";

describe("utils/db.ts", () => {
  let mockExit: jest.SpyInstance;

  beforeAll(() => {
    // mock process.exit so Jest doesn’t actually exit
    mockExit = jest.spyOn(process, "exit").mockImplementation(((
      code?: number
    ) => {
      throw new Error(`process.exit: ${code}`);
    }) as never);
  });

  afterAll(() => {
    mockExit.mockRestore();
  });

  test("pool emits error triggers process.exit(-1)", () => {
    const err = new Error("simulated db error");

    // pool is an EventEmitter, we can emit an error event
    expect(() => {
      (pool as any).emit("error", err);
    }).toThrow("process.exit: -1");

    // verify our spy was called
    expect(mockExit).toHaveBeenCalledWith(-1);
  });
});
