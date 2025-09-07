import { createContext, useContext } from "react";

type LayoutContextValue = {
  openDelete: (onConfirm: () => Promise<void> | void) => void;
};

export const LayoutContext = createContext<LayoutContextValue | undefined>(
  undefined
);

export const useLayout = (): LayoutContextValue => {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error("useLayout must be used inside DeleteDialogProvider");
  }
  return ctx;
};
