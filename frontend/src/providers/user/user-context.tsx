import { createContext, useContext } from "react";
import type { UserContextValue } from "./user-provider";

export const UserContext = createContext<UserContextValue | undefined>(
  undefined
);

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUserContext must be used inside UserProvider");
  return ctx;
}
