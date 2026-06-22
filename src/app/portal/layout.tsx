import { redirect } from "next/navigation";
import { getRepositories } from "@/db";
import { GuidedTour, type TourStep } from "@/components/portal/guided-tour";
import { NotificationBell } from "@/components/portal/notification-bell";
import { PortalShell } from "@/components/portal/portal-shell";
import { getActor } from "@/server/auth/actor";
import { hasAnyAdminScope } from "@/server/auth/admin";
import { markTourSeenAction, signOutAction } from "./actions";
import { markAllNotificationsReadAction, markNotificationReadAction } from "./notifications/actions";

export const dynamic = "force-dynamic";

function initialsFrom(name: string): string {
	const parts = name.trim().split(/\s+/).slice(0, 2);
	return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "M";
}

const TOUR_MEMBER: TourStep[] = [
	{ title: "Welcome to CODE Portal", body: "Your member workspace. The bottom tabs jump between Overview, Calendar, Retention, and Profile." },
	{ title: "The + button", body: "Tap the raised + in the center of the bottom bar to open the menu: announcements, the link shortener, your member QR, and more." },
	{ title: "Your member code", body: "Open the menu to find your QR. Show it to an event admin to be marked present." },
];

const TOUR_ADMIN: TourStep[] = [
	...TOUR_MEMBER,
	{ title: "Admin tools", body: "You have admin access. The Admin entry in the menu and sidebar opens reporting, roster, announcements, the audit log, and more." },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
	const actor = await getActor();
	if (!actor) redirect("/signin");

	const repositories = await getRepositories();
	// notifications is unavailable through the shared-dev adapter until a future
	// phase wires an internal proxy route for it; degrade to an empty feed
	// instead of crashing every authed page.
	const [member, feed, unreadCount, tourSeen] = await Promise.all([
		repositories.members.getById(actor, actor.memberId),
		repositories.notifications.listFeed(actor, { limit: 10 }).catch(() => []),
		repositories.notifications.unreadCount(actor).catch(() => 0),
		repositories.memberFeed.hasSeenTour(actor).catch(() => true),
	]);
	if (!member) redirect("/signin");

	const displayName = member.nickname ?? member.fullName ?? member.name ?? member.email;
	const showAdmin = hasAnyAdminScope(actor);

	// TODO(phase-8): load nav_pins via a navPins repository once Phase 8 adds it.
	const navPins: { id: string; label: string; url: string }[] = [];

	return (
		<>
			<PortalShell
				member={{ displayName, initials: initialsFrom(displayName), subtitle: member.email }}
				memberId={actor.memberId}
				navPins={navPins}
				showAdmin={showAdmin}
				signOutAction={signOutAction}
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
			{tourSeen ? null : <GuidedTour steps={showAdmin ? TOUR_ADMIN : TOUR_MEMBER} onComplete={markTourSeenAction} />}
		</>
	);
}
