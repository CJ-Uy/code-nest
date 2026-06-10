import { getAppConfig } from "@/server/env";
import type { CreateUserInput, DatabaseAdapter, User } from "../types";

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

	async listUsers(): Promise<User[]> {
		const response = await this.request("/internal/users");
		if (!response.ok) throw new Error("Shared API failed to list users.");
		return response.json();
	}

	async createUser(input: CreateUserInput): Promise<User> {
		const response = await this.request("/internal/users", {
			method: "POST",
			body: JSON.stringify(input),
		});
		if (!response.ok) throw new Error("Shared API failed to create user.");
		return response.json();
	}

	async getUserById(id: string): Promise<User | null> {
		const response = await this.request(`/internal/users/${encodeURIComponent(id)}`);
		if (response.status === 404) return null;
		if (!response.ok) throw new Error("Shared API failed to fetch user.");
		return response.json();
	}
}
