"use client"

import {
	Badge,
	Button,
	H1,
	H2,
	Input,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mpga/ui"
import { Mail, Send, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { useSession } from "@/lib/auth-client"

import { createInvitationAction, listInvitationsAction, revokeInvitationAction } from "./actions"

interface Invitation {
	id: string
	email: string
	status: string
	createdAt: Date
	expiresAt: Date
}

export default function InvitationsPage() {
	const router = useRouter()
	const { data: session, isPending: sessionPending } = useSession()
	const [invitations, setInvitations] = useState<Invitation[]>([])
	const [loading, setLoading] = useState(true)
	const [email, setEmail] = useState("")
	const [sending, setSending] = useState(false)
	const [actionLoading, setActionLoading] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	// Check if user has super_admin role
	useEffect(() => {
		if (!sessionPending && session?.user?.role !== "super_admin") {
			router.replace("/")
		}
	}, [session, sessionPending, router])

	// Fetch invitations
	useEffect(() => {
		async function fetchInvitations() {
			try {
				const result = await listInvitationsAction()
				if (result.success && result.data) {
					setInvitations(result.data)
				}
			} catch (err) {
				console.error("Failed to fetch invitations:", err)
			} finally {
				setLoading(false)
			}
		}

		if (session?.user?.role === "super_admin") {
			fetchInvitations()
		}
	}, [session])

	const handleSendInvitation = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!email.trim()) return

		setSending(true)
		setError(null)
		setSuccess(null)

		try {
			const result = await createInvitationAction(email.trim())
			if (result.success) {
				setSuccess(`Invitation sent to ${email}`)
				setEmail("")
				// Refresh invitations list
				const listResult = await listInvitationsAction()
				if (listResult.success && listResult.data) {
					setInvitations(listResult.data)
				}
			} else {
				setError(result.error ?? "Failed to send invitation")
			}
		} catch (err) {
			console.error("Failed to send invitation:", err)
			setError("Failed to send invitation")
		} finally {
			setSending(false)
		}
	}

	const handleRevokeInvitation = async (invitationId: string) => {
		if (!confirm("Are you sure you want to revoke this invitation?")) {
			return
		}

		setActionLoading(invitationId)
		try {
			const result = await revokeInvitationAction(invitationId)
			if (result.success) {
				setInvitations((prev) =>
					prev.map((inv) => (inv.id === invitationId ? { ...inv, status: "revoked" } : inv)),
				)
			} else {
				setError(result.error ?? "Failed to revoke invitation")
			}
		} catch (err) {
			console.error("Failed to revoke invitation:", err)
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

	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case "pending":
				return "secondary"
			case "accepted":
				return "success"
			case "revoked":
				return "destructive"
			default:
				return "secondary"
		}
	}

	// Show nothing while checking permissions
	if (sessionPending || session?.user?.role !== "super_admin") {
		return null
	}

	return (
		<main className="mx-auto max-w-6xl px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<H1 variant="secondary">Invitation Management</H1>
			</div>

			{/* Send Invitation Form */}
			<div className="mb-8 rounded-lg bg-white shadow">
				<div className="border-b border-gray-200 px-6 py-4">
					<H2 variant="secondary">Send New Invitation</H2>
				</div>
				<div className="p-6">
					<form onSubmit={handleSendInvitation} className="flex gap-4">
						<div className="relative flex-1">
							<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
							<Input
								type="email"
								placeholder="Enter email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="pl-10"
								required
							/>
						</div>
						<Button type="submit" disabled={sending || !email.trim()}>
							<Send className="mr-2 h-4 w-4" />
							{sending ? "Sending..." : "Send Invitation"}
						</Button>
					</form>
					{error && <p className="mt-3 text-sm text-red-600">{error}</p>}
					{success && <p className="mt-3 text-sm text-green-600">{success}</p>}
				</div>
			</div>

			{/* Invitations List */}
			<div className="rounded-lg bg-white shadow">
				<div className="border-b border-gray-200 px-6 py-4">
					<H2 variant="secondary">All Invitations</H2>
				</div>
				<div className="p-6">
					{loading ? (
						<div className="py-8 text-center text-gray-500">Loading invitations...</div>
					) : invitations.length === 0 ? (
						<div className="py-8 text-center text-gray-500">No invitations found</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Email</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Expires</TableHead>
									<TableHead className="w-[100px]"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{invitations.map((invitation) => (
									<TableRow key={invitation.id}>
										<TableCell className="font-medium">{invitation.email}</TableCell>
										<TableCell>
											<Badge variant={getStatusBadgeVariant(invitation.status)}>
												{invitation.status}
											</Badge>
										</TableCell>
										<TableCell>{formatDate(invitation.createdAt)}</TableCell>
										<TableCell>{formatDate(invitation.expiresAt)}</TableCell>
										<TableCell>
											{invitation.status === "pending" && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleRevokeInvitation(invitation.id)}
													disabled={actionLoading === invitation.id}
													className="text-red-600 hover:text-red-700"
												>
													<XCircle className="mr-1 h-4 w-4" />
													Revoke
												</Button>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</div>
			</div>
		</main>
	)
}
