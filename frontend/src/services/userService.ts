import client from "./api";

export type User = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
};

export const fetchUsers = async (params?: {
  limit?: number;
  offset?: number;
}): Promise<User[]> => {
  const res = await client.get<User[]>("/users", { params });
  return res.data;
};

export const fetchUser = async (id: number): Promise<User> => {
  const res = await client.get<User>(`/users/${id}`);
  return res.data;
};
