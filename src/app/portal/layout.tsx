import { redirect } from "next/navigation";
import { getRepositories } from "@/db";
import { NotificationBell } from "@/components/portal/notification-bell";
import { PortalShell } from "@/components/portal/portal-shell";
import { getActor } from "@/server/auth/actor";
import { markAllNotificationsReadAction, markNotificationReadAction } from "./notifications/actions";

export const dynamic = "force-dynamic";

function initialsFrom(name: string): string {
	const parts = name.trim().split(/\s+/).slice(0, 2);
	return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "M";
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
	const actor = await getActor();
	if (!actor) redirect("/signin");

	const repositories = await getRepositories();
	// notifications is unavailable through the shared-dev adapter until a future
	// phase wires an internal proxy route for it; degrade to an empty feed
	// instead of crashing every authed page.
	const [member, feed, unreadCount] = await Promise.all([
		repositories.members.getById(actor, actor.memberId),
		repositories.notifications.listFeed(actor, { limit: 10 }).catch(() => []),
		repositories.notifications.unreadCount(actor).catch(() => 0),
	]);
	if (!member) redirect("/signin");

	const displayName = member.nickname ?? member.fullName ?? member.name ?? member.email;

	// TODO(phase-8): load nav_pins via a navPins repository once Phase 8 adds it.
	const navPins: { id: string; label: string; url: string }[] = [];

	return (
		<PortalShell
			member={{ displayName, initials: initialsFrom(displayName) }}
			navPins={navPins}
			bell={
				<NotificationBell
					items={feed}
					unreadCount={unreadCount}
					onMarkRead={markNotificationReadAction}
					onMarkAllRead={markAllNotificationsReadAction}
				/>
			}
		>
			{children}
		</PortalShell>
	);
}
