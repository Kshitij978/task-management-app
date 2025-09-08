import "./App.css";
import Tasks from "./features/tasks/components";

import { SheetProvider } from "./providers/sheet/sheet-provider";
import { TaskProvider } from "./providers/task/task-provider";
import { UserProvider } from "./providers/user/user-provider";

function App() {
  return (
    <>
      <UserProvider>
        <TaskProvider>
          <SheetProvider>
            <Tasks />
          </SheetProvider>
        </TaskProvider>
      </UserProvider>
    </>
  );
}

export default App;

