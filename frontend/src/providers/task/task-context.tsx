import { createContext, useContext } from "react";
import type { TaskContextValue } from "./task-provider";

export const TaskContext = createContext<TaskContextValue | undefined>(
  undefined
);

export function useTaskContext(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTaskContext must be used inside TaskProvider");
  return ctx;
}
