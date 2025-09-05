import Joi from "joi";

export const createUserSchema = Joi.object({
  username: Joi.string().trim().min(1).max(50).required(),
  email: Joi.string().trim().email().max(100).required(),
  full_name: Joi.string().trim().min(1).max(100).required(),
});

export const updateUserSchema = Joi.object({
  username: Joi.string().trim().min(1).max(50),
  email: Joi.string().trim().email().max(100),
  full_name: Joi.string().trim().min(1).max(100),
}).min(1);
