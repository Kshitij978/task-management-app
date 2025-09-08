import type { Task } from "@/features/tasks/types/task";
import { createContext, useContext } from "react";

export type TaskSheetMode = "view" | "edit" | "create";

export interface SheetState {
  open: boolean;
  mode?: TaskSheetMode;
  task?: Task | null;
}

export interface SheetContextValue {
  state: SheetState;
  openSheet: (opts: { mode: TaskSheetMode; task?: Task | null }) => void;
  closeSheet: () => void;
  task: Task | null;
  setTask: (task: Task | null) => void;
}

export const SheetContext = createContext<SheetContextValue | undefined>(
  undefined
);

export function useSheet() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("useSheet must be used within SheetProvider");
  return ctx;
}
