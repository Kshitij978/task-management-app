import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  SheetContext,
  type SheetState,
  type TaskSheetMode,
} from "./sheet-context";
import type { Task } from "@/features/tasks/types/task";
import ViewTaskSheet from "@/features/tasks/components/view-task-sheet";
import { EditTaskSheet } from "@/features/tasks/components/edit-task-sheet";
import { AddTaskSheet } from "@/features/tasks/components/add-task-sheet";

export function SheetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SheetState>({
    open: false,
    mode: undefined,
    task: null,
  });

  const [task, setTask] = useState<Task | null>(null);

  const openSheet = useCallback(
    (opts: { mode: TaskSheetMode; task?: Task | null }) => {
      setState({ open: true, mode: opts.mode, task: opts.task ?? null });
    },
    []
  );

  const closeSheet = useCallback(() => {
    setState({ open: false, mode: undefined, task: null });
  }, []);

  const value = useMemo(
    () => ({ state, openSheet, closeSheet, task, setTask }),
    [state, openSheet, closeSheet, task, setTask]
  );
  return (
    <SheetContext.Provider value={value}>
      {children}

      {state.mode === "view" && <ViewTaskSheet />}
      {state.mode === "edit" && <EditTaskSheet />}
      {state.mode === "create" && <AddTaskSheet />}
    </SheetContext.Provider>
  );
}
