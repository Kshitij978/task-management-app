import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
} from "../controllers/users.controller";

const router = Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUserHandler);
router.put("/:id", updateUserHandler);
router.delete("/:id", deleteUserHandler);

export default router;
