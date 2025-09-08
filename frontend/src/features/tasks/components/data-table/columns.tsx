import { type ColumnDef } from "@tanstack/react-table";

import { Checkbox } from "@/components/ui/checkbox";

import { priorities, statuses } from "../../data/data";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import dayjs from "dayjs";
import type { Task } from "../../types/task";
import { useSheet } from "@/providers/sheet/sheet-context";

export const columns: ColumnDef<Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Task" />
    ),
    cell: ({ row }) => (
      <div className="w-[80px] flex justify-start">
        TASK-{row.getValue("id")}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const TitleCell = () => {
        const { openSheet, setTask } = useSheet();
        return (
          <>
            <div
              className="flex gap-2"
              onClick={() => {
                setTask(row.original);
                openSheet({ mode: "view", task: row.original });
              }}
            >
              <span className="max-w-[500px] truncate font-medium">
                {row.getValue("title")}
              </span>
            </div>
          </>
        );
      };
      return <TitleCell />;
    },
  },
  {
    accessorKey: "assigned_user_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned To" />
    ),
    cell: ({ row }) => {
      // show the human-readable name if available; otherwise show "Unassigned"
      const name = row.getValue<string | null>("assigned_user_name");
      return name ? (
        <span className="truncate w-full flex justify-start">{name}</span>
      ) : (
        <span className="text-muted-foreground w-full flex justify-start">
          Unassigned
        </span>
      );
    },
    // filterFn uses the stored assigned_to id (number) if you prefer numeric filtering on id;
    // here we allow filtering by the shown name as well as "Unassigned"
    filterFn: (row, id, value: string[]) => {
      // value will be array of selected filter values (strings)
      const name = row.getValue<string | null>("assigned_user_name");
      const shown = name ?? "Unassigned";
      return value.includes(shown);
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue("status")
      );

      if (!status) {
        return null;
      }

      return (
        <div className="flex w-[100px] items-center gap-2">
          {status.icon && (
            <status.icon className="text-muted-foreground size-4" />
          )}
          <span>{status.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const priority = priorities.find(
        (priority) => priority.value === row.getValue("priority")
      );

      if (!priority) {
        return null;
      }

      return (
        <div className="flex items-center gap-2">
          {priority.icon && (
            <priority.icon className="text-muted-foreground size-4" />
          )}
          <span>{priority.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "due_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const dueDate = row.getValue<string | null>("due_date");
      if (!dueDate) {
        return (
          <span className="text-muted-foreground w-full flex justify-start">
            No due date
          </span>
        );
      }

      const date = new Date(dueDate);
      const now = new Date();
      const isOverdue = date < now;
      const isToday = date.toDateString() === now.toDateString();

      return (
        <div
          className={`flex items-center gap-2 ${
            isOverdue ? "text-red-600" : isToday ? "text-orange-600" : ""
          }`}
        >
          <span className="font-medium">
            {dayjs(dueDate).format("MMM D, YYYY")}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions task={row.original} />,
  },
];
