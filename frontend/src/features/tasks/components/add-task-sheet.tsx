import { useState } from "react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
import { useCreateTask } from "../hooks/useTasks";
import { useUsersFilterOptions } from "../hooks/useUsers";
import { priorities, statuses } from "../data/data";
import { Loader2 } from "lucide-react";

interface AddTaskSheetProps {
  children: React.ReactNode;
}

export function AddTaskSheet({ children }: AddTaskSheetProps) {
  const [open, setOpen] = useState(false);
  const { mutate: createTask, isPending } = useCreateTask();
  const { userOptions, isLoading: usersLoading } = useUsersFilterOptions();

  // Simple state management without react-hook-form
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo" as "todo" | "in-progress" | "done",
    priority: "medium" as "low" | "medium" | "high",
    due_date: "",
    assigned_to: null as number | null,
  });

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const payload = {
      ...formData,
      due_date: formData.due_date
        ? new Date(formData.due_date).toISOString()
        : null,
    };

    createTask(payload, {
      onSuccess: () => {
        toast.success("Task created successfully!");
        setFormData({
          title: "",
          description: "",
          status: "todo",
          priority: "medium",
          due_date: "",
          assigned_to: null,
        });
        setOpen(false);
      },
      onError: (error) => {
        toast.error("Failed to create task. Please try again.");
        console.error("Error creating task:", error);
      },
    });
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      due_date: "",
      assigned_to: null,
    });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Add New Task</SheetTitle>
          <SheetDescription>
            Create a new task by filling out the form below.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-4">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title *
              </label>
              <Input
                id="title"
                placeholder="Enter task title..."
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                placeholder="Enter task description..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status *
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        {status.icon && <status.icon className="h-4 w-4" />}
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority *
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex items-center gap-2">
                        {priority.icon && <priority.icon className="h-4 w-4" />}
                        {priority.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <label htmlFor="assigned_to" className="text-sm font-medium">
                Assigned To
              </label>
              <Select
                value={formData.assigned_to?.toString() || "null"}
                onValueChange={(value) =>
                  handleInputChange(
                    "assigned_to",
                    value === "null" ? null : Number(value)
                  )
                }
                disabled={usersLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={usersLoading ? "Loading..." : "Select user"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {userOptions.map((user) => (
                    <SelectItem
                      key={user.id || "null"}
                      value={user.id?.toString() || "null"}
                    >
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label htmlFor="due_date" className="text-sm font-medium">
                Due Date
              </label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => handleInputChange("due_date", e.target.value)}
              />
            </div>
          </div>

          <SheetFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <span>
                  <Loader2 className="mr-2 animate-spin" /> Creating...
                </span>
              ) : (
                <span>Create</span>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
