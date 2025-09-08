import "./App.css";
import Tasks from "./features/tasks/components";

import { SheetProvider } from "./providers/sheet/sheet-provider";

function App() {
  return (
    <>
      <SheetProvider>
        <Tasks />
      </SheetProvider>
    </>
  );
}

export default App;

