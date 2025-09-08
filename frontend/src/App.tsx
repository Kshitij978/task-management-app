import "./App.css";
import Tasks from "./features/tasks/components";

import { SheetProvider } from "./providers/sheet/sheet-provider";
import { UserProvider } from "./providers/user/user-provider";

function App() {
  return (
    <>
      <UserProvider>
        <SheetProvider>
          <Tasks />
        </SheetProvider>
      </UserProvider>
    </>
  );
}

export default App;

