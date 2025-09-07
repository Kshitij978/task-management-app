import "./App.css";
import Tasks from "./features/tasks/components/data-table";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <>
      <Tasks />
      <Toaster />
    </>
  );
}

export default App;

