import { Button } from "@/components/ui/button";
import { User2Icon } from "lucide-react";
import { useState } from "react";
import Tasks from "./tasks/components";
import UsersTable from "./users/components/users-table";

export function TaskManagement() {
  const [showUsers, setShowUsers] = useState(false);

  return (
    <div className="w-full">
      <div className="flex justify-between">
        <div className="flex flex-col w-fit mb-4 text-left">
          <h2 className="text-2xl font-semibold tracking-tight">
            {showUsers ? "Users" : "Task List"}
          </h2>
          <p className="text-muted-foreground">
            {showUsers
              ? "Manage application users."
              : "Here's a list of tasks which have been created."}
          </p>
        </div>

        <Button variant="outline" onClick={() => setShowUsers((v) => !v)}>
          <User2Icon className="mr-2" />
          {showUsers ? "Back to Tasks" : "Manage Users"}
        </Button>
      </div>
      {showUsers ? <UsersTable /> : <Tasks />}
    </div>
  );
}
