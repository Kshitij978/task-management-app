import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import {
  findTasks,
  findTaskById,
  createTask,
  updateTaskWithOptimisticLock,
  deleteTaskById,
} from "../model/tasks.model";
import { createTaskSchema, updateTaskSchema } from "../validation/tasks.schema";
import pool from "../utils/db";
import {
  BadRequestError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../utils/errors";

function formatJoiError(err: Joi.ValidationError) {
  return err.details.map((d) => d.message).join("; ");
}

export const getAllTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Parse comma-separated values for multiple selection
    const parseCommaSeparated = (
      value: string | undefined
    ): string[] | undefined => {
      if (!value) return undefined;
      return value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    };

    const parseAssignedTo = (
      value: string | undefined
    ): (number | "null")[] | undefined => {
      if (!value) return undefined;
      return value
        .split(",")
        .map((v) => {
          const trimmed = v.trim();
          if (trimmed === "null") return "null" as const;
          const num = Number(trimmed);
          return Number.isNaN(num) ? undefined : num;
        })
        .filter((v): v is number | "null" => v !== undefined);
    };

    const params = {
      status: parseCommaSeparated(req.query.status as string | undefined),
      priority: parseCommaSeparated(req.query.priority as string | undefined),
      assigned_to: parseAssignedTo(req.query.assigned_to as string | undefined),
      search: req.query.search as string | undefined,
      sort: (req.query.sort as string) || "created_at",
      order:
        (req.query.order as string) === "asc"
          ? "asc"
          : ("desc" as "asc" | "desc"),
      limit: Math.min(Number(req.query.limit ?? 20), 100),
      offset: Number(req.query.offset ?? 0),
    };
    const rows = await findTasks(params);
    res.json(rows);
  } catch (err: any) {
    if (err.statusCode === 400)
      return res.status(400).json({ error: err.message });
    next(err);
  }
};

export const getTaskByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new BadRequestError("Invalid task id");
    const task = await findTaskById(id);
    if (!task) throw new NotFoundError("Task");
    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const createTaskHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = createTaskSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) throw new ValidationError(formatJoiError(error));

    // If assigned_to provided, ensure user exists
    if (value.assigned_to) {
      const { rows } = await pool.query("SELECT id FROM users WHERE id = $1", [
        value.assigned_to,
      ]);
      if (rows.length === 0)
        throw new BadRequestError("Assigned user does not exist");
    }

    const inserted = await createTask(value);
    res.status(201).json(inserted);
  } catch (err: any) {
    next(err);
  }
};

export const updateTaskHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new BadRequestError("Invalid task id");

    const { error, value } = updateTaskSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) throw new ValidationError(formatJoiError(error));

    // If assigned_to provided, ensure user exists (allow null)
    if (
      Object.prototype.hasOwnProperty.call(value, "assigned_to") &&
      value.assigned_to !== null
    ) {
      const { rows } = await pool.query("SELECT id FROM users WHERE id = $1", [
        value.assigned_to,
      ]);
      if (rows.length === 0)
        throw new BadRequestError("Assigned user does not exist");
    }

    const expectedUpdatedAt = value.updated_at;
    if (value.updated_at) delete value.updated_at;

    const updated = await updateTaskWithOptimisticLock(
      id,
      value,
      expectedUpdatedAt
    );
    if (!updated) {
      // If user passed expectedUpdatedAt and update failed -> optimistic lock conflict
      if (expectedUpdatedAt) {
        throw new ConflictError("Task was modified by someone else");
      }
      throw new NotFoundError("Task");
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteTaskHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new BadRequestError("Invalid task id");
    const ok = await deleteTaskById(id);
    if (!ok) throw new NotFoundError("Task");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
