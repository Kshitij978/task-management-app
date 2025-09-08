import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useUserContext } from "@/providers/user/user-context";
import {
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  deleteUser as apiDeleteUser,
  type User,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/services/userService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTaskContext } from "@/providers/task/task-context";

const formSchema = z.object({
  username: z.string().min(2, "Username is required"),
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof formSchema>;

export default function UsersTable() {
  const { users, isLoading, error, refetch } = useUserContext();
  const {
    refetch: refetchTasks,
    selectedUserIds,
    setSelectedUserIds,
    mergeParams,
  } = useTaskContext();
  const rows = useMemo(() => users ?? [], [users]);

  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", full_name: "", email: "" },
    mode: "onChange",
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserInput) => apiCreateUser(payload),
    onSuccess: () => {
      setIsOpen(false);
      form.reset();
      refetch();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserInput }) =>
      apiUpdateUser(id, payload),
    onSuccess: () => {
      setIsOpen(false);
      form.reset();
      setIsEdit(false);
      setEditingId(null);
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDeleteUser(id),
    onSuccess: (result, id) => {
      setDeletingUser(null);
      refetch();
      if (
        result &&
        typeof result.affectedTasksCount === "number" &&
        result.affectedTasksCount > 0
      ) {
        if (selectedUserIds?.includes(id)) {
          const next = selectedUserIds.filter((uid) => uid !== id);
          setSelectedUserIds(next);
          mergeParams(
            { assigned_to: next.length ? next.join(",") : undefined },
            { resetPage: true }
          );
        }
        refetchTasks();
      }
    },
  });

  function openCreate() {
    setIsEdit(false);
    setEditingId(null);
    form.reset({ username: "", full_name: "", email: "" });
    setIsOpen(true);
  }

  function openEdit(user: User) {
    setIsEdit(true);
    setEditingId(user.id);
    form.reset({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
    });
    setIsOpen(true);
  }

  function onSubmit(values: FormValues) {
    if (isEdit && editingId != null) {
      updateMutation.mutate({ id: editingId, payload: values });
      return;
    }
    createMutation.mutate(values);
  }

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    form.formState.isSubmitting;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-4">
        <Button onClick={openCreate}>Add User</Button>
      </div>
      <Separator className="mb-4" />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading users…</div>
      ) : error ? (
        <div className="text-sm text-red-500">Failed to load users</div>
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="h-12 px-4">Username</TableHead>
                <TableHead className="h-12 px-4">Full name</TableHead>
                <TableHead className="h-12 px-4">Email</TableHead>
                <TableHead className="h-12 px-4 w-[160px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-left pl-4 py-3">
                    {u.username}
                  </TableCell>
                  <TableCell className="text-left pl-4 py-3">
                    {u.full_name}
                  </TableCell>
                  <TableCell className="text-left pl-4 py-3">
                    {u.email}
                  </TableCell>
                  <TableCell className="text-left pl-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(u)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingUser(u)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setIsEdit(false);
            setEditingId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3 py-2"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <div className="space-y-1">
              <Input
                placeholder="Username"
                {...form.register("username")}
                aria-invalid={!!form.formState.errors.username}
              />
              {form.formState.errors.username && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Input
                placeholder="Full name"
                {...form.register("full_name")}
                aria-invalid={!!form.formState.errors.full_name}
              />
              {form.formState.errors.full_name && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.full_name.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Input
                placeholder="Email"
                type="email"
                {...form.register("email")}
                aria-invalid={!!form.formState.errors.email}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isMutating || !form.formState.isValid}
              >
                {isEdit
                  ? updateMutation.isPending
                    ? "Saving…"
                    : "Save"
                  : createMutation.isPending
                  ? "Creating…"
                  : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete {deletingUser?.full_name}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUser(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deletingUser && deleteMutation.mutate(deletingUser.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
