"use client"

import { AwardSystemName, TournamentSystemName } from "@mpga/types"
import {
	Button,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@mpga/ui"
import { LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { signOut, useSession } from "@/lib/auth-client"

const navGroups = [
	{
		title: "Tournaments",
		items: [
			{ title: "Four Ball", url: `/tournaments/${TournamentSystemName.FourBall}` },
			{ title: "Mid Am", url: `/tournaments/${TournamentSystemName.MidAm}` },
			{ title: "Low Net", url: `/tournaments/${TournamentSystemName.LowNet}` },
			{ title: "Jr. Public Links", url: `/tournaments/${TournamentSystemName.JrPubLinks}` },
			{ title: "Sr. Public Links", url: `/tournaments/${TournamentSystemName.SrPubLinks}` },
			{ title: "Public Links", url: `/tournaments/${TournamentSystemName.PubLinks}` },
			{ title: "Combination", url: `/tournaments/${TournamentSystemName.Combo}` },
			{ title: "Policies", url: "/tournaments/policies" },
		],
	},
	{
		title: "Match Play",
		items: [
			{ title: "Landing Page", url: "/match-play/landing" },
			{ title: "Teams", url: "/match-play/teams" },
			{ title: "Results", url: "/match-play/results" },
			{ title: "Rules", url: "/match-play/rules" },
			{ title: "Senior Rules", url: "/match-play/senior-rules" },
			{ title: "Documents", url: "/match-play/documents" },
		],
	},
	{
		title: "Members",
		items: [
			{ title: "Landing Page", url: "/members/landing" },
			{ title: "Clubs", url: "/members/clubs" },
			{ title: "Contacts", url: "/members/contacts" },
			{ title: "Golf Courses", url: "/members/golf-courses" },
		],
	},
	{
		title: "Web Content",
		items: [
			{ title: "News", url: "/content/news" },
			{ title: "Home Page", url: "/content/home" },
			{ title: "About Us", url: "/content/about-us" },
			{
				title: "Executive Committee",
				url: "/content/executive-committee",
			},
			{ title: "Past Presidents", url: `/content/awards/${AwardSystemName.PastPresidents}` },
			{ title: "Ron Self", url: `/content/awards/${AwardSystemName.RonSelf}` },
			{ title: "Clasen Cup", url: `/content/awards/${AwardSystemName.ClasenCup}` },
			{ title: "Al Wareham", url: `/content/awards/${AwardSystemName.AlWareham}` },
		],
	},
	{
		title: "Season Settings",
		items: [
			{ title: "Tournaments", url: "/settings/tournaments" },
			{ title: "Match Play Groups", url: "/settings/match-play-groups" },
			{ title: "Membership", url: "/settings/membership" },
		],
	},
]

const adminNavGroup = {
	title: "Administration",
	items: [
		{ title: "Users", url: "/admin/users" },
		{ title: "Invitations", url: "/admin/invitations" },
	],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname()
	const { data: session } = useSession()

	const handleSignOut = async () => {
		await signOut()
	}

	return (
		<Sidebar variant="floating" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="xl" asChild>
							<Link href="/">
								<div className="w-42 h-16 relative flex items-center">
									<Image
										src="/images/mpga-logo.png"
										alt="MPGA Administration"
										fill={true}
										className="object-contain"
										priority
									/>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				{navGroups.map((group) => (
					<SidebarGroup key={group.title}>
						<SidebarGroupLabel className="text-primary-300 font-medium text-sm">
							{group.title}
						</SidebarGroupLabel>
						<SidebarMenu className="ml-3">
							{group.items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild isActive={pathname === item.url}>
										<Link href={item.url}>{item.title}</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroup>
				))}
				{session?.user?.role === "super_admin" && (
					<SidebarGroup>
						<SidebarGroupLabel className="text-primary-300 font-medium text-sm">
							{adminNavGroup.title}
						</SidebarGroupLabel>
						<SidebarMenu className="ml-3">
							{adminNavGroup.items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild isActive={pathname === item.url}>
										<Link href={item.url}>{item.title}</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroup>
				)}
			</SidebarContent>
			<SidebarFooter>
				<div className="flex items-center justify-between gap-2 px-2 py-2">
					<span className="text-sm text-muted-foreground truncate">
						{session?.user?.name ?? session?.user?.email ?? "User"}
					</span>
					<Button variant="ghost" size="icon" onClick={handleSignOut}>
						<LogOut className="h-4 w-4" />
						<span className="sr-only">Sign out</span>
					</Button>
				</div>
			</SidebarFooter>
		</Sidebar>
	)
}
