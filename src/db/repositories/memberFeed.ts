import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { memberFeedState } from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import type * as schema from "../schema";

type Db = DrizzleD1Database<typeof schema>;

export type MemberFeedRepository = {
	hasSeenTour(actor: Actor): Promise<boolean>;
	markTourSeen(actor: Actor): Promise<void>;
};

export function createMemberFeedRepository(db: Db): MemberFeedRepository {
	return {
		async hasSeenTour(actor) {
			const [row] = await db
				.select({ tourSeenAt: memberFeedState.tourSeenAt })
				.from(memberFeedState)
				.where(eq(memberFeedState.memberId, actor.memberId))
				.limit(1);
			return Boolean(row?.tourSeenAt);
		},
		async markTourSeen(actor) {
			await db
				.insert(memberFeedState)
				.values({ memberId: actor.memberId, tourSeenAt: new Date() })
				.onConflictDoUpdate({ target: memberFeedState.memberId, set: { tourSeenAt: new Date() } });
		},
	};
}

export function createUnavailableMemberFeedRepository(): MemberFeedRepository {
	return {
		// Tour state simply degrades to "seen" when the adapter can't read it, so the
		// tour never blocks the shared-dev shell.
		async hasSeenTour() {
			return true;
		},
		async markTourSeen() {
			// no-op
		},
	};
}
