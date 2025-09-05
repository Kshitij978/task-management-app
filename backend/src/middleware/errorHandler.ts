import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err);

  // If it's our custom AppError, use its status code
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.statusCode,
      error: err.message,
    });
    return;
  }

  // For other errors, return 500
  res.status(500).json({
    status: 500,
    error: "Internal Server Error",
  });
}

export default errorHandler;
