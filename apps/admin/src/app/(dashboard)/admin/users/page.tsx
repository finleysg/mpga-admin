"use client";

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mpga/ui";
import {
  MoreHorizontal,
  Shield,
  ShieldOff,
  Trash2,
  UserCog,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/lib/auth-client";

import {
  banUserAction,
  listUsersAction,
  removeUserAction,
  setRoleAction,
} from "./actions";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  banned: boolean | null;
  createdAt: Date;
}

export default function UsersPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check if user has super_admin role
  useEffect(() => {
    if (!sessionPending && session?.user?.role !== "super_admin") {
      router.replace("/");
    }
  }, [session, sessionPending, router]);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await listUsersAction();
        if (result.success && result.data) {
          setUsers(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.role === "super_admin") {
      fetchUsers();
    }
  }, [session]);

  const handleBanUser = async (userId: string, ban: boolean) => {
    setActionLoading(userId);
    try {
      const result = await banUserAction(userId, ban);
      if (result.success) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, banned: ban } : user,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to update ban status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user?")) {
      return;
    }
    setActionLoading(userId);
    try {
      const result = await removeUserAction(userId);
      if (result.success) {
        setUsers((prev) => prev.filter((user) => user.id !== userId));
      }
    } catch (error) {
      console.error("Failed to remove user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetRole = async (
    userId: string,
    role: "admin" | "super_admin",
  ) => {
    setActionLoading(userId);
    try {
      const result = await setRoleAction(userId, role);
      if (result.success) {
        setUsers((prev) =>
          prev.map((user) => (user.id === userId ? { ...user, role } : user)),
        );
      }
    } catch (error) {
      console.error("Failed to set role:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Show nothing while checking permissions
  if (sessionPending || session?.user?.role !== "super_admin") {
    return null;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold text-secondary-500">
          User Management
        </h1>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">All Users</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name ?? "-"}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "super_admin" ? "default" : "secondary"
                        }
                      >
                        {user.role ?? "admin"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.banned ? "destructive" : "success"}>
                        {user.banned ? "Banned" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={actionLoading === user.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleSetRole(
                                user.id,
                                user.role === "super_admin"
                                  ? "admin"
                                  : "super_admin",
                              )
                            }
                            disabled={user.id === session?.user?.id}
                          >
                            <UserCog className="mr-2 h-4 w-4" />
                            {user.role === "super_admin"
                              ? "Demote to Admin"
                              : "Promote to Super Admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBanUser(user.id, !user.banned)}
                            disabled={user.id === session?.user?.id}
                          >
                            {user.banned ? (
                              <>
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Unban User
                              </>
                            ) : (
                              <>
                                <Shield className="mr-2 h-4 w-4" />
                                Ban User
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRemoveUser(user.id)}
                            disabled={user.id === session?.user?.id}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </main>
  );
}
