import { eq } from "drizzle-orm";
import { getRepositories } from "@/db";
import { crsEvents } from "@/db/schema";
import { getDb } from "@/db/client";
import { getActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";
import { getAppConfig } from "@/server/env";
import { assertSameOrigin } from "@/server/http/origin";
import { createUploadHandlers } from "@/server/uploads";
import { getStorageAdapter } from "@/storage";

export async function POST(request: Request) {
	const config = getAppConfig();
	try {
		assertSameOrigin(request, config.APP_BASE_URL);
	} catch {
		return Response.json({ error: "Cross-origin request rejected." }, { status: 403 });
	}
	return (await createHandlers()).collection(request);
}

async function createHandlers() {
	return createUploadHandlers({
		getActor: async () => getActor(),
		storage: await getStorageAdapter(),
		canPostEvent: async (actor, eventId) => {
			if (!can(actor, "event:approve")) return false;
			const [event] = await getDb()
				.select()
				.from(crsEvents)
				.where(eq(crsEvents.id, eventId))
				.limit(1);
			return event?.status === "approved";
		},
		canEditLink: async (actor, linkId) => {
			const { links } = await getRepositories();
			try {
				return Boolean(await links.getById(actor, linkId));
			} catch {
				return false;
			}
		},
	});
}

