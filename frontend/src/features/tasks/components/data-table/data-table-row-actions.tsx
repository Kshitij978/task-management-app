import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import * as React from "react";
import type { Task } from "../../types/task";
import { EditTaskSheet } from "../edit-task-sheet";
import { useLayout } from "@/providers/layout/layout-context";
import { useDeleteTask } from "../../hooks/useTasks";

export function DataTableRowActions({ task }: { task: Task }) {
  const [openEdit, setOpenEdit] = React.useState(false);
  const { openDelete } = useLayout();
  const { mutate: deleteTask } = useDeleteTask();

  const handleDeleteTask = () => openDelete(() => deleteTask(task.id));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="data-[state=open]:bg-muted size-8"
          >
            <MoreHorizontal />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onSelect={() => setOpenEdit(true)}>
            Edit
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={handleDeleteTask}>
            Delete
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditTaskSheet open={openEdit} onOpenChange={setOpenEdit} task={task} />
    </>
  );
}
