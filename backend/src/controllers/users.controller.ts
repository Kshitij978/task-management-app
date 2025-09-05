import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import {
  findAllUsers,
  findUserById,
  createUser,
  findUserByEmailOrUsername,
  updateUserById,
  deleteUserByIdTransactional,
} from "../model/users.model";
import { createUserSchema, updateUserSchema } from "../validation/users.schema";
import {
  BadRequestError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../utils/errors";

function formatJoiError(err: Joi.ValidationError) {
  return err.details.map((d) => d.message).join("; ");
}

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 100), 1000);
    const offset = Number(req.query.offset ?? 0);
    const rows = await findAllUsers(limit, offset);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new BadRequestError("Invalid user id");

    const user = await findUserById(id);
    if (!user) throw new NotFoundError("User");
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const createUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = createUserSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(formatJoiError(error));

    // Check uniqueness
    const existing = await findUserByEmailOrUsername(
      value.email,
      value.username
    );
    if (existing) throw new ConflictError("Username or email already exists");

    const user = await createUser(value);
    res.status(201).json(user);
  } catch (err: any) {
    // handle unique constraint DB error defensively
    if (err.code === "23505") {
      throw new ConflictError("Username or email already exists");
    }
    next(err);
  }
};

export const updateUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new BadRequestError("Invalid user id");

    const { error, value } = updateUserSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) throw new ValidationError(formatJoiError(error));

    // If updating email/username, ensure uniqueness
    if (value.email || value.username) {
      const existing = await findUserByEmailOrUsername(
        value.email ?? "",
        value.username ?? ""
      );
      if (existing && existing.id !== id)
        throw new ConflictError("Username or email already in use");
    }

    const updated = await updateUserById(id, value);
    if (!updated) throw new NotFoundError("User");
    res.json(updated);
  } catch (err: any) {
    if (err.code === "23505")
      throw new ConflictError("Username or email already in use");
    next(err);
  }
};

export const deleteUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new BadRequestError("Invalid user id");

    const { deleted, affectedTaskIds } = await deleteUserByIdTransactional(id);
    if (!deleted) throw new NotFoundError("User");

    res.json({
      deleted: true,
      affectedTasksCount: affectedTaskIds.length,
      affectedTaskIds,
      message: "User deleted. Their tasks are now unassigned.",
    });
  } catch (err) {
    next(err);
  }
};
