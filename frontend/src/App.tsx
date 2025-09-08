import "./App.css";
import { TaskManagement } from "./features";

import { SheetProvider } from "./providers/sheet/sheet-provider";
import { TaskProvider } from "./providers/task/task-provider";
import { UserProvider } from "./providers/user/user-provider";

function App() {
  return (
    <>
      <UserProvider>
        <TaskProvider>
          <SheetProvider>
            <TaskManagement />
          </SheetProvider>
        </TaskProvider>
      </UserProvider>
    </>
  );
}

export default App;

