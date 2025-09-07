import React, { useCallback, useState } from "react";
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";
import { LayoutContext } from "./layout-context";
import { Toaster } from "sonner";

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [handler, setHandler] = useState<(() => Promise<void> | void) | null>(
    null
  );

  const openDelete = useCallback((onConfirm: () => Promise<void> | void) => {
    setHandler(() => onConfirm);
    setOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (handler) {
      await handler();
    }
    setOpen(false);
    setHandler(null);
  }, [handler]);

  return (
    <LayoutContext.Provider value={{ openDelete }}>
      {children}

      <DeleteConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
      />
      <Toaster richColors closeButton position="bottom-left" />
    </LayoutContext.Provider>
  );
};
