import type { Actor } from "@/server/auth/permissions";

export type PageRequest = {
	limit?: number;
	cursor?: string | null;
};

export type PageResult<T> = {
	items: T[];
	nextCursor: string | null;
};

export type RepositoryContext = {
	actor: Actor | null;
};

export function pageLimit(input?: number): number {
	const limit = input ?? 25;
	return Math.max(1, Math.min(limit, 50));
}
