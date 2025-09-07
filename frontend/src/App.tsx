import "./App.css";
import Tasks from "./features/tasks/components/data-table";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <>
      <Tasks />
      <Toaster richColors closeButton position="bottom-left" />
    </>
  );
}

export default App;

