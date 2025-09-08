import { useMemo } from "react";
import type { ReactNode } from "react";
import { UserContext } from "./user-context";
import {
  useUsers,
  useUsersFilterOptions,
} from "@/features/tasks/hooks/useUsers";
import type { User } from "@/services/userService";

export interface UserContextValue {
  users: User[];
  isLoading: boolean;
  error: unknown;
  userOptions: Array<{ label: string; value: string; id: number | null }>;
  getUserById: (id?: number | null) => User | undefined;
  refetch: () => void;
}

export function UserProvider({ children }: { children: ReactNode }) {
  // Centralize user fetching here. Components should read from context instead of calling hooks directly.
  const { data: users = [], isLoading, error, refetch } = useUsers();
  const {
    userOptions,
    isLoading: optionsLoading,
    error: optionsError,
  } = useUsersFilterOptions();

  const value = useMemo<UserContextValue>(() => {
    const getUserById = (id?: number | null) =>
      typeof id === "number" ? users.find((u) => u.id === id) : undefined;

    return {
      users,
      isLoading: isLoading || optionsLoading,
      error: error ?? optionsError ?? null,
      userOptions,
      getUserById,
      refetch,
    };
  }, [
    users,
    isLoading,
    optionsLoading,
    error,
    optionsError,
    userOptions,
    refetch,
  ]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
