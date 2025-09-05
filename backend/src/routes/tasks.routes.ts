import { Router } from "express";
import {
  getAllTasks,
  createTaskHandler,
  deleteTaskHandler,
  getTaskByIdHandler,
  updateTaskHandler,
} from "../controllers/tasks.controller";

const router = Router();

router.get("/", getAllTasks);
router.get("/:id", getTaskByIdHandler);
router.post("/", createTaskHandler);
router.put("/:id", updateTaskHandler);
router.delete("/:id", deleteTaskHandler);

export default router;
