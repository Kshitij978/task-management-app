import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import type { TaskQueryParams } from "../../types/task";

interface DataTableDueDateFilterProps {
  dueFrom?: Date;
  dueTo?: Date;
  params: TaskQueryParams;
  mergeParams: (
    params: TaskQueryParams,
    options?: { resetPage?: boolean }
  ) => void;
}
export function DataTableDueDateFilter({
  dueFrom,
  dueTo,
  params,
  mergeParams,
}: DataTableDueDateFilterProps) {
  return (
    <div className="flex items-center gap-2 p-1 px-2 border rounded-md">
      <span className="text-sm font-semibold">Due Date</span>
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <CalendarIcon className="mr-2 size-4" />
              From: {dueFrom ? dayjs(dueFrom).format("MMM D, YYYY") : ".."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              selected={dueFrom}
              onSelect={(date) => {
                const fromStr = date
                  ? dayjs(date).format("YYYY-MM-DD")
                  : undefined;
                const toDate = dueTo;
                const shouldClearTo =
                  date && toDate && dayjs(date).isAfter(dayjs(toDate), "day");
                mergeParams(
                  {
                    due_date_from: fromStr,
                    due_date_to: shouldClearTo ? undefined : params.due_date_to,
                  },
                  { resetPage: true }
                );
              }}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <CalendarIcon className="mr-2 size-4" />
              To: {dueTo ? dayjs(dueTo).format("MMM D, YYYY") : ".."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              captionLayout="dropdown"
              mode="single"
              selected={dueTo}
              onSelect={(date) => {
                const toStr = date
                  ? dayjs(date).format("YYYY-MM-DD")
                  : undefined;
                const fromDate = dueFrom;
                const shouldClearFrom =
                  date &&
                  fromDate &&
                  dayjs(date).isBefore(dayjs(fromDate), "day");
                mergeParams(
                  {
                    due_date_to: toStr,
                    due_date_from: shouldClearFrom
                      ? undefined
                      : params.due_date_from,
                  },
                  { resetPage: true }
                );
              }}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
