import { getAppConfig } from "@/server/env";
import type { CreateMemberInput, DatabaseAdapter, Member } from "../types";

export class SharedApiDatabaseAdapter implements DatabaseAdapter {
	readonly adapterType = "shared-api" as const;

	private request(path: string, init?: RequestInit): Promise<Response> {
		const config = getAppConfig();
		if (!config.SHARED_API_BASE_URL || !config.SHARED_API_TOKEN) {
			throw new Error("Shared API configuration is missing.");
		}

		return fetch(new URL(path, config.SHARED_API_BASE_URL), {
			...init,
			headers: {
				Authorization: `Bearer ${config.SHARED_API_TOKEN}`,
				"Content-Type": "application/json",
				...init?.headers,
			},
		});
	}

	async listMembers(): Promise<Member[]> {
		const response = await this.request("/internal/members");
		if (!response.ok) throw new Error("Shared API failed to list members.");
		return response.json();
	}

	async createMember(input: CreateMemberInput): Promise<Member> {
		const response = await this.request("/internal/members", {
			method: "POST",
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new Error("Shared API failed to create member.");
		return response.json();
	}

	async getMemberById(id: string): Promise<Member | null> {
		const response = await this.request(`/internal/members/${encodeURIComponent(id)}`);
		if (response.status === 404) return null;
		if (!response.ok) throw new Error("Shared API failed to fetch member.");
		return response.json();
	}
}
