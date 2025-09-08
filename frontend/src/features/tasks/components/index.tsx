import { useMemo } from "react";
import { columns } from "./data-table/columns";
import { DataTable } from "./data-table/data-table";
import { useTaskContext } from "@/providers/task/task-context";

export default function Tasks() {
  const { data } = useTaskContext();

  const items = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="w-full">
      <DataTable data={items} columns={columns} />
    </div>
  );
}
