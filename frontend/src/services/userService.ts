import client from "./api";

export type User = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
};

export type CreateUserInput = {
  username: string;
  email: string;
  full_name: string;
};

export type UpdateUserInput = Partial<CreateUserInput>;

export type DeleteUserResult = {
  deleted: boolean;
  affectedTasksCount: number;
  affectedTaskIds: number[];
  message: string;
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

export const createUser = async (payload: CreateUserInput): Promise<User> => {
  const res = await client.post<User>("/users", payload);
  return res.data;
};

export const updateUser = async (
  id: number,
  payload: UpdateUserInput
): Promise<User> => {
  const res = await client.put<User>(`/users/${id}`, payload);
  return res.data;
};

export const deleteUser = async (id: number): Promise<DeleteUserResult> => {
  const res = await client.delete(`/users/${id}`);
  return res.data as DeleteUserResult;
};
