import { toast } from "sonner";

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
import { useCreateTask } from "../hooks/useTasks";
import { priorities, statuses } from "../data/data";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/services/api";
import dayjs from "dayjs";
import type { Task } from "../types/task";
import { useForm, Controller } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSheet } from "@/providers/sheet/sheet-context";
import { useUserContext } from "@/providers/user/user-context";

// Domain constraints
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const VALID_STATUSES = ["todo", "in-progress", "done"] as const;
const VALID_PRIORITIES = ["low", "medium", "high"] as const;

// Types and schema
const TaskFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(
        MAX_TITLE_LENGTH,
        `Title must be ${MAX_TITLE_LENGTH} characters or fewer`
      ),
    description: z
      .string()
      .max(
        MAX_DESCRIPTION_LENGTH,
        `Description is too long (max ${MAX_DESCRIPTION_LENGTH} characters)`
      ),
    status: z.enum(VALID_STATUSES),
    priority: z.enum(VALID_PRIORITIES),
    due_date_date: z.string().optional(), // YYYY-MM-DD
    assigned_to: z.number().nullable().optional(),
  })
  .refine(
    (data) => {
      // valid if empty or a valid YYYY-MM-DD date
      if (!data.due_date_date) return true;
      return dayjs(data.due_date_date, "YYYY-MM-DD", true).isValid();
    },
    { path: ["due_date_date"], message: "Please pick a valid date" }
  );

type TaskFormData = z.infer<typeof TaskFormSchema>;

function showBoundaryToast(
  field: "title" | "description",
  prevLength: number,
  nextLength: number
) {
  if (
    field === "title" &&
    nextLength > MAX_TITLE_LENGTH &&
    prevLength <= MAX_TITLE_LENGTH
  ) {
    toast.error(`Title must be ${MAX_TITLE_LENGTH} characters or fewer`);
  }
  if (
    field === "description" &&
    nextLength > MAX_DESCRIPTION_LENGTH &&
    prevLength <= MAX_DESCRIPTION_LENGTH
  ) {
    toast.error(
      `Description is too long (max ${MAX_DESCRIPTION_LENGTH} characters)`
    );
  }
}

export function AddTaskSheet() {
  const { closeSheet, state } = useSheet();
  const { mutate: createTask, isPending } = useCreateTask();
  const { userOptions, isLoading: usersLoading } = useUserContext();

  const { control, handleSubmit, watch, setValue, reset, formState } =
    useForm<TaskFormData>({
      resolver: zodResolver(TaskFormSchema),
      defaultValues: {
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        due_date_date: "",
        assigned_to: null,
      },
      mode: "onBlur",
    });

  const titleValue = watch("title");
  const descriptionValue = watch("description");

  const onInvalid = () => {
    const firstError = Object.values(formState.errors)[0] as
      | { message?: string }
      | undefined;
    if (firstError?.message) toast.error(firstError.message);
  };

  const onSubmit: SubmitHandler<TaskFormData> = (values) => {
    let dueIso: string | null = null;
    if (values.due_date_date) {
      const d = dayjs(values.due_date_date, "YYYY-MM-DD").startOf("day");
      if (!d.isValid()) {
        toast.error("Invalid due date");
        return;
      }
      dueIso = d.toISOString();
    }

    const payload: Partial<Task> = {
      title: values.title.trim(),
      description: values.description || "",
      status: values.status,
      priority: values.priority,
      due_date: dueIso,
      assigned_to: values.assigned_to ?? null,
    };

    createTask(payload, {
      onSuccess: () => {
        toast.success("Task created successfully!");
        reset({
          title: "",
          description: "",
          status: "todo",
          priority: "medium",
          due_date_date: "",
          assigned_to: null,
        });
        closeSheet();
      },
      onError: (error: unknown) => {
        if (error instanceof ApiError) {
          const message = error.message || "Failed to create task";
          const details = error.details;
          toast.error(details ? `${message}: ${details}` : message);
        } else if (error && typeof error === "object" && "message" in error) {
          const message =
            String((error as { message?: unknown }).message) ||
            "Failed to create task";
          toast.error(message);
        } else {
          toast.error("Failed to create task");
        }
        console.error("Error creating task:", error);
      },
    });
  };

  return (
    <Sheet
      open={state.open && state.mode === "create"}
      onOpenChange={closeSheet}
    >
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Task</SheetTitle>
          <SheetDescription>
            Create a new task by filling out the form below.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="space-y-6 p-4"
        >
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title *
              </label>
              <Input
                id="title"
                placeholder="Enter task title..."
                value={titleValue}
                onChange={(e) => {
                  const next = e.target.value;
                  showBoundaryToast(
                    "title",
                    titleValue?.length ?? 0,
                    next.length
                  );
                  setValue("title", next.slice(0, MAX_TITLE_LENGTH), {
                    shouldDirty: true,
                  });
                }}
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
                value={descriptionValue}
                onChange={(e) => {
                  const next = e.target.value;
                  showBoundaryToast(
                    "description",
                    descriptionValue?.length ?? 0,
                    next.length
                  );
                  setValue(
                    "description",
                    next.slice(0, MAX_DESCRIPTION_LENGTH),
                    {
                      shouldDirty: true,
                    }
                  );
                }}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status *
              </label>
              <Controller
                control={control}
                name="status"
                render={({ field: { value, onChange } }) => (
                  <Select value={value} onValueChange={onChange}>
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
                )}
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority *
              </label>
              <Controller
                control={control}
                name="priority"
                render={({ field: { value, onChange } }) => (
                  <Select value={value} onValueChange={onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center gap-2">
                            {priority.icon && (
                              <priority.icon className="h-4 w-4" />
                            )}
                            {priority.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <label htmlFor="assigned_to" className="text-sm font-medium">
                Assigned To
              </label>
              <Controller
                control={control}
                name="assigned_to"
                render={({ field: { value, onChange } }) => (
                  <Select
                    value={value?.toString() || "null"}
                    onValueChange={(v) =>
                      onChange(v === "null" ? null : Number(v))
                    }
                    disabled={usersLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          usersLoading ? "Loading..." : "Select user"
                        }
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
                )}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="due_date_date">
                Due Date
              </label>
              <Controller
                control={control}
                name="due_date_date"
                render={({ field: { value, onChange } }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                      >
                        {value
                          ? dayjs(value).format("MMM D, YYYY")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={value ? new Date(value) : undefined}
                        onSelect={(d) => {
                          const formatted = d
                            ? dayjs(d).format("YYYY-MM-DD")
                            : "";
                          onChange(formatted);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
          </div>

          <SheetFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset({
                  title: "",
                  description: "",
                  status: "todo",
                  priority: "medium",
                  due_date_date: "",
                  assigned_to: null,
                });
                closeSheet();
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="mr-2 animate-spin" />{" "}
                  <span>Creating...</span>
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
