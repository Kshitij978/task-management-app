import { type Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const rowCount = table.getRowModel().rows.length;

  // - Can go prev if pageIndex > 0
  // - Can go next if we received a full page worth of items
  const canPrev = pageIndex > 0;
  const canNext = rowCount >= pageSize; // server returned a full page → may have more

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-muted-foreground flex-1 text-sm">
        {table.getFilteredSelectedRowModel().rows.length} selected
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
              // reset to first page when page size changes
              table.setPageIndex(0);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 25, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!canPrev}
          >
            <span className="sr-only">Previous</span>
            <ChevronLeft />
          </Button>
          <div className="text-sm font-medium w-[80px] text-center">
            Page {pageIndex + 1}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!canNext}
          >
            <span className="sr-only">Next</span>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
