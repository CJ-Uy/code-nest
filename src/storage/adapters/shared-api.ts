import { getAppConfig } from "@/server/env";
import type { StorageAdapter } from "../types";

export class SharedApiStorageAdapter implements StorageAdapter {
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
				...init?.headers,
			},
		});
	}

	async putObject(input: Parameters<StorageAdapter["putObject"]>[0]): Promise<{ key: string }> {
		const response = await this.request("/internal/uploads", {
			method: "POST",
			body: input.body,
			headers: {
				"Content-Type": input.contentType ?? "application/octet-stream",
				"X-Object-Key": input.key,
			},
		});
		if (!response.ok) throw new Error("Shared API failed to store upload.");
		return response.json();
	}

	async getObject(key: string): Promise<{ body: ReadableStream | null; contentType?: string }> {
		const response = await this.request(`/internal/uploads/${encodeURIComponent(key)}`);
		if (response.status === 404) return { body: null };
		if (!response.ok) throw new Error("Shared API failed to read upload.");
		return {
			body: response.body,
			contentType: response.headers.get("content-type") ?? undefined,
		};
	}

	async deleteObject(key: string): Promise<void> {
		const response = await this.request(`/internal/uploads/${encodeURIComponent(key)}`, { method: "DELETE" });
		if (!response.ok && response.status !== 404) throw new Error("Shared API failed to delete upload.");
	}
}
