import dayjs from "dayjs";
import type { FC } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSheet } from "@/providers/sheet/sheet-context";

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "-";
  const parsed = dayjs(iso);
  return parsed.isValid() ? parsed.format("MMM D, YYYY") : String(iso);
};

export const ViewTaskSheet: FC = () => {
  const { openSheet, closeSheet, state, task } = useSheet();

  const handleEdit = () => {
    if (task) openSheet({ mode: "edit", task });
  };

  return (
    <Sheet
      open={state.open && state.mode === "view"}
      onOpenChange={() => closeSheet()}
    >
      <SheetContent side="right" className="overflow-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="ml-auto flex items-center gap-2">
              <SheetClose></SheetClose>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 pt-0">
          <div className="mb-4">
            <div className="text-xs text-muted-foreground">Title</div>
            <div className="mt-1 text-lg font-medium break-words">
              {task?.title ?? "-"}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs text-muted-foreground">Description</div>
            <div className="mt-1 whitespace-pre-wrap text-sm">
              {task?.description ?? "-"}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="mt-1 text-sm">
                {task?.status.toUpperCase() ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Priority</div>
              <div className="mt-1 text-sm">
                {task?.priority.toUpperCase() ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Due date</div>
              <div className="mt-1 text-sm">
                {task?.due_date ? formatDateTime(task.due_date) : "-"}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-xs text-muted-foreground">Assigned to</div>
              <div className="mt-1 text-sm">
                {task?.assigned_user_name ??
                  (task?.assigned_to != null ? String(task.assigned_to) : "-")}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">
                Created / Updated
              </div>
              <div className="mt-1 text-sm">
                {task?.created_at ? formatDateTime(task.created_at) : "-"}{" "}
                <span className="text-muted-foreground">/</span>{" "}
                {task?.updated_at ? formatDateTime(task.updated_at) : "-"}
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex justify-end gap-2 p-4">
          {task && (
            <Button
              className="bg-accent"
              size="sm"
              variant="outline"
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
          <SheetClose asChild>
            <Button>Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ViewTaskSheet;
