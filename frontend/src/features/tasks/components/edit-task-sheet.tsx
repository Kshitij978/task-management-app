import { useEffect, useState } from "react";
import { toast } from "sonner";
import dayjs from "dayjs";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type { Task } from "../types/task";
import { priorities, statuses } from "../data/data";
import { useUpdateTask } from "../hooks/useTasks";
import TextWithLoader from "@/components/text-with-loader";
import { useSheet } from "@/providers/sheet/sheet-context";
import { useUserContext } from "@/providers/user/user-context";

export function EditTaskSheet() {
  const { userOptions, isLoading: usersLoading } = useUserContext();
  const { mutate: updateTask, isPending } = useUpdateTask();
  const { closeSheet, state, task: taskObj } = useSheet();
  const task = taskObj as Task;

  // Local editable state kept minimal; reuse same constraints/UX as add sheet
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    due_date_date: task.due_date
      ? dayjs(task.due_date).format("YYYY-MM-DD")
      : "",
    assigned_to: task.assigned_to ?? null,
  });

  useEffect(() => {
    if (!state.open || state.mode !== "edit" || !task) return;
    setForm({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      due_date_date: task.due_date
        ? dayjs(task.due_date).format("YYYY-MM-DD")
        : "",
      assigned_to: task.assigned_to ?? null,
    });
  }, [task, state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const title = form.title.trim();
    if (!title) return toast.error("Title is required");
    if (title.length > 200)
      return toast.error("Title must be 200 characters or fewer");
    if (form.description && form.description.length > 5000)
      return toast.error("Description is too long (max 5000 characters)");

    let dueIso: string | null = null;
    if (form.due_date_date) {
      const d = dayjs(form.due_date_date, "YYYY-MM-DD").startOf("day");
      if (!d.isValid()) return toast.error("Invalid due date");
      dueIso = d.toISOString();
    }

    updateTask(
      {
        id: task.id,
        payload: {
          title,
          description: form.description || "",
          status: form.status,
          priority: form.priority,
          due_date: dueIso,
          assigned_to: form.assigned_to,
        },
      },
      {
        onSuccess: () => {
          toast.success("Task updated");
          closeSheet();
        },
        onError: () => toast.error("Failed to update task"),
      }
    );
  };

  return (
    <Sheet open={state.open && state.mode === "edit"} onOpenChange={closeSheet}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Task</SheetTitle>
          <SheetDescription>Update the task details</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Title *
              </label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    title: e.target.value.slice(0, 200),
                  }))
                }
                placeholder="Enter task title..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    description: e.target.value.slice(0, 5000),
                  }))
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
                placeholder="Enter task description..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status *</label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as Task["status"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority *</label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, priority: v as Task["priority"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned To</label>
              <Select
                value={form.assigned_to?.toString() || "null"}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    assigned_to: v === "null" ? null : Number(v),
                  }))
                }
                disabled={usersLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={usersLoading ? "Loading..." : "Select user"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {userOptions.map((u) => (
                    <SelectItem
                      key={u.id || "null"}
                      value={u.id?.toString() || "null"}
                    >
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                  >
                    {form.due_date_date
                      ? dayjs(form.due_date_date).format("MMM D, YYYY")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      form.due_date_date
                        ? new Date(form.due_date_date)
                        : undefined
                    }
                    onSelect={(d) =>
                      setForm((p) => ({
                        ...p,
                        due_date_date: d ? dayjs(d).format("YYYY-MM-DD") : "",
                      }))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <SheetFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => closeSheet}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <TextWithLoader text="Saving..." />
              ) : (
                <span>Save</span>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
