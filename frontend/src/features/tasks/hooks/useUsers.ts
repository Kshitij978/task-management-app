import { useQuery } from "@tanstack/react-query";
import * as userService from "@/services/userService";
import type { User } from "@/services/userService";

const USERS_QUERY_KEY = "users";

export function useUsers(params?: { limit?: number; offset?: number }) {
  return useQuery<User[], Error>({
    queryKey: [USERS_QUERY_KEY, params],
    queryFn: () => userService.fetchUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - users don't change often
    retry: 1,
  });
}

export function useUser(id?: number) {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, id],
    queryFn: () => userService.fetchUser(id as number),
    enabled: typeof id === "number",
    retry: 1,
  });
}

export const useUsersFilterOptions = () => {
  const { data: users = [], isLoading, error } = useUsers();

  const userOptions: Array<{
    label: string;
    value: string;
    id: number | null;
  }> = users.map((user) => ({
    label: user.full_name,
    value: user.full_name,
    id: user.id, // Store the ID for mapping
  }));

  // Add "Unassigned" option
  userOptions.unshift({
    label: "Unassigned",
    value: "Unassigned",
    id: null,
  });

  return {
    userOptions,
    isLoading,
    error,
  };
};

