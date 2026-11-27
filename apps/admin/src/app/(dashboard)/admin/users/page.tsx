"use client"

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
	EmptyState,
	H1,
	H2,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@mpga/ui"
import { KeyRound, MoreHorizontal, Shield, ShieldOff, Trash2, UserCog } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { useSession } from "@/lib/auth-client"
import { ASSIGNABLE_ROLES, isLibraryRole, ROLE_LABELS, type AssignableRole } from "@/lib/roles"

import {
	banUserAction,
	listUsersAction,
	removeUserAction,
	sendPasswordResetAction,
	setRoleAction,
} from "./actions"

interface User {
	id: string
	name: string | null
	email: string
	role: string | null
	banned: boolean | null
	createdAt: Date
}

export default function UsersPage() {
	const router = useRouter()
	const { data: session, isPending: sessionPending } = useSession()
	const [users, setUsers] = useState<User[]>([])
	const [loading, setLoading] = useState(true)
	const [actionLoading, setActionLoading] = useState<string | null>(null)

	// Check if user has super_admin role
	useEffect(() => {
		if (!sessionPending && session?.user?.role !== "super_admin") {
			router.replace("/")
		}
	}, [session, sessionPending, router])

	// Fetch users
	useEffect(() => {
		async function fetchUsers() {
			try {
				const result = await listUsersAction()
				if (result.success && result.data) {
					setUsers(result.data)
				}
			} catch (error) {
				console.error("Failed to fetch users:", error)
			} finally {
				setLoading(false)
			}
		}

		if (session?.user?.role === "super_admin") {
			fetchUsers()
		}
	}, [session])

	const handleBanUser = async (userId: string, ban: boolean) => {
		setActionLoading(userId)
		try {
			const result = await banUserAction(userId, ban)
			if (result.success) {
				setUsers((prev) =>
					prev.map((user) => (user.id === userId ? { ...user, banned: ban } : user)),
				)
			}
		} catch (error) {
			console.error("Failed to update ban status:", error)
		} finally {
			setActionLoading(null)
		}
	}

	const handleRemoveUser = async (userId: string) => {
		if (!confirm("Are you sure you want to remove this user?")) {
			return
		}
		setActionLoading(userId)
		try {
			const result = await removeUserAction(userId)
			if (result.success) {
				setUsers((prev) => prev.filter((user) => user.id !== userId))
			}
		} catch (error) {
			console.error("Failed to remove user:", error)
		} finally {
			setActionLoading(null)
		}
	}

	const handleSetRole = async (userId: string, role: AssignableRole) => {
		setActionLoading(userId)
		try {
			const result = await setRoleAction(userId, role)
			if (result.success) {
				setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role } : user)))
			}
		} catch (error) {
			console.error("Failed to set role:", error)
		} finally {
			setActionLoading(null)
		}
	}

	const handleSendPasswordReset = async (user: User) => {
		if (!confirm(`Email ${user.email} a link to set a new password?`)) {
			return
		}
		setActionLoading(user.id)
		try {
			const result = await sendPasswordResetAction(user.id)
			if (result.success) {
				toast.success(`Password reset link sent to ${user.email}`)
			} else {
				toast.error(result.error ?? "Failed to send password reset")
			}
		} catch (error) {
			console.error("Failed to send password reset:", error)
			toast.error("Failed to send password reset")
		} finally {
			setActionLoading(null)
		}
	}

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		})
	}

	// Show nothing while checking permissions
	if (sessionPending || session?.user?.role !== "super_admin") {
		return null
	}

	return (
		<main className="mx-auto max-w-6xl px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<H1 variant="secondary">User Management</H1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>
						<H2 variant="secondary">All Users</H2>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<EmptyState message="Loading users..." />
					) : users.length === 0 ? (
						<EmptyState message="No users found" />
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
									<TableHead className="w-18"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((user) => (
									<TableRow key={user.id}>
										<TableCell className="font-medium">{user.name ?? "-"}</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell>
											<Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
												{ROLE_LABELS[user.role ?? "user"] ?? user.role}
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
													<Button variant="ghost" size="icon" disabled={actionLoading === user.id}>
														<MoreHorizontal className="h-4 w-4" />
														<span className="sr-only">Actions</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<DropdownMenuSeparator />
													<DropdownMenuSub>
														<DropdownMenuSubTrigger disabled={user.id === session?.user?.id}>
															<UserCog className="mr-2 h-4 w-4" />
															Change role
														</DropdownMenuSubTrigger>
														<DropdownMenuSubContent>
															{ASSIGNABLE_ROLES.map((role) => (
																<DropdownMenuItem
																	key={role}
																	disabled={user.role === role}
																	onClick={() => handleSetRole(user.id, role)}
																>
																	{ROLE_LABELS[role]}
																</DropdownMenuItem>
															))}
														</DropdownMenuSubContent>
													</DropdownMenuSub>
													{isLibraryRole(user.role) && (
														<DropdownMenuItem
															onClick={() => handleSendPasswordReset(user)}
															disabled={!!user.banned}
														>
															<KeyRound className="mr-2 h-4 w-4" />
															Send password reset
														</DropdownMenuItem>
													)}
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
				</CardContent>
			</Card>
		</main>
	)
}
