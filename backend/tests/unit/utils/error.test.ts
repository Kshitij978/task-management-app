import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../../src/utils/errors";

describe("utils/errors", () => {
  test("AppError default statusCode of 500 is used when not provided", () => {
    const e = new AppError("defaulted");
    expect(e).toBeInstanceOf(AppError);
    expect(e.message).toBe("defaulted");
    expect(e.statusCode).toBe(500); // covers the default param branch
    expect(e.isOperational).toBe(true);
    expect(typeof e.stack).toBe("string");
  });

  test("AppError sets message, statusCode and isOperational", () => {
    const err = new AppError("oops", 501, false);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe("oops");
    expect(err.statusCode).toBe(501);
    expect(err.isOperational).toBe(false);
    // stack should be present (captureStackTrace called)
    expect(typeof err.stack).toBe("string");
  });

  test("ValidationError defaults to 400", () => {
    const err = new ValidationError("bad");
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("bad");
    expect(err.isOperational).toBe(true);
  });

  test("NotFoundError builds message and sets 404", () => {
    const e1 = new NotFoundError("User");
    expect(e1.statusCode).toBe(404);
    expect(e1.message).toBe("User not found");

    const e2 = new NotFoundError();
    expect(e2.message).toBe("Resource not found");
  });

  test("ConflictError sets 409", () => {
    const err = new ConflictError("dup");
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe("dup");
  });

  test("BadRequestError sets 400", () => {
    const err = new BadRequestError("bad request");
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("bad request");
  });
});
