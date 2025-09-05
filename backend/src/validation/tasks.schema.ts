import Joi from "joi";

export const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().max(5000).allow(null, ""),
  status: Joi.string().valid("todo", "in-progress", "done").optional(),
  priority: Joi.string().valid("low", "medium", "high").optional(),
  due_date: Joi.date().iso().optional().allow(null),
  assigned_to: Joi.number().integer().optional().allow(null),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().max(5000).allow(null, ""),
  status: Joi.string().valid("todo", "in-progress", "done"),
  priority: Joi.string().valid("low", "medium", "high"),
  due_date: Joi.date().iso().allow(null),
  assigned_to: Joi.number().integer().allow(null),
  updated_at: Joi.string().isoDate().optional(),
}).min(1);
