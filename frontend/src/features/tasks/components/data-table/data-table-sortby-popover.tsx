import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Check,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowDownUpIcon,
} from "lucide-react";

export type SortOrder = "asc" | "desc";

type Props = {
  sortBy?: string;
  sortOrder?: SortOrder;
  onChange?: (payload: { sortBy?: string; sortOrder?: SortOrder }) => void;
};

const fieldOptions: { value: string; label: string }[] = [
  { value: "created_at", label: "Created" },
  { value: "updated_at", label: "Updated" },
  { value: "due_date", label: "Due date" },
  { value: "title", label: "Title" },
  { value: "priority", label: "Priority" },
];

export function DataTableSortbyPopover({ sortBy, sortOrder, onChange }: Props) {
  const [open, setOpen] = React.useState(false);

  const handleFieldSelect = (field: string) => {
    onChange?.({ sortBy: field, sortOrder: sortOrder ?? "desc" });
    setOpen(false);
  };

  const handleOrderSelect = (order: SortOrder) => {
    onChange?.({ sortBy: sortBy ?? "created_at", sortOrder: order });
    setOpen(false);
  };

  const currentFieldLabel =
    fieldOptions.find((f) => f.value === sortBy)?.label ?? "None";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <ArrowDownUpIcon className="h-4 w-4" />
          Sort by
          <span className="text-xs text-muted-foreground">
            {currentFieldLabel}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0">
        <Command>
          <CommandList>
            <CommandGroup heading="Field">
              {fieldOptions.map((opt) => (
                <CommandItem
                  key={opt.value}
                  onSelect={() => handleFieldSelect(opt.value)}
                  className="flex items-center justify-between"
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.value && <Check className="h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Order">
              <CommandItem
                onSelect={() => handleOrderSelect("asc")}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-4 w-4" /> Ascending
                </span>
                {sortOrder === "asc" && <Check className="h-4 w-4" />}
              </CommandItem>
              <CommandItem
                onSelect={() => handleOrderSelect("desc")}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-1">
                  <ArrowDown className="h-4 w-4" /> Descending
                </span>
                {sortOrder === "desc" && <Check className="h-4 w-4" />}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
