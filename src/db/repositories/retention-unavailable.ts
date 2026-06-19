import type { RetentionRepository } from "./retention";

export function createUnavailableRetentionRepository(): RetentionRepository {
	const unavailable = () => {
		throw new Error("Retention records are not available through this repository adapter.");
	};
	return {
		recordEventAttendance: unavailable,
		listForMember: unavailable,
		getMemberTermSummary: unavailable,
		leaderboard: unavailable,
		myHistory: unavailable,
		listTerms: unavailable,
		async createManual() {
			throw new Error("Manual retention records are not available in shared mode.");
		},
	};
}
