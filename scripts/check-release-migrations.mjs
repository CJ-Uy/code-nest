import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

const migrationDir = path.resolve("drizzle/release-migrations");
const preflightSql = `SELECT event_id, member_id, COUNT(*) AS award_count
FROM point_awards
WHERE event_id IS NOT NULL
GROUP BY event_id, member_id
HAVING COUNT(*) > 1;`;
const tempDir = mkdtempSync(path.join(os.tmpdir(), "code-nest-release-migrations-"));
let db;

try {
	db = new Database(path.join(tempDir, "release.sqlite"));
	for (const name of [
		"0000_young_bullseye.sql",
		"0001_member_portal_links.sql",
		"0002_link_workspace_fields.sql",
		"0003_admin_members_nav.sql",
	]) {
		db.exec(readFileSync(path.join(migrationDir, name), "utf8").replaceAll("--> statement-breakpoint", ""));
	}

	db.exec(`
		INSERT INTO members (id, email, name) VALUES
			('member_release', 'release@example.com', 'Release member'),
			('member_awarder', 'awarder@example.com', 'Awarder member');
		INSERT INTO terms (id, name, retained_at, probation_below, starts_at, ends_at)
		VALUES ('term_release', 'Release term', 10, 5, 0, 1);
		INSERT INTO crs_events (id, title, type, place, starts_at, description, created_by, checkin_secret)
		VALUES ('event_release', 'Release event', 'official', 'Online', 0, 'Synthetic release event', 'member_awarder', 'secret');
		INSERT INTO point_awards (id, member_id, term_id, event_id, points, reason, awarded_by, awarded_at) VALUES
			('award_release', 'member_release', 'term_release', 'event_release', 5, 'Synthetic award', 'member_awarder', 1),
			('award_release_duplicate', 'member_release', 'term_release', 'event_release', 5, 'Synthetic duplicate', 'member_awarder', 2);
		INSERT INTO short_links (id, slug, destination_url, title, owner_member_id) VALUES
			('link_release_a', 'release-a', 'https://example.com/a', 'Release A', 'member_release'),
			('link_release_b', 'release-b', 'https://example.com/b', 'Release B', 'member_release');
		INSERT INTO link_daily_stats (link_id, date, referrer_bucket, device_bucket, count) VALUES
			('link_release_a', '2026-08-05', 'direct', 'desktop', 1),
			('link_release_a', '2026-08-05', 'search', 'mobile', 2),
			('link_release_b', '2026-08-05', 'direct', 'desktop', 3);
		INSERT INTO audit_logs (id, actor_member_id, action, target_type, target_id, category)
		VALUES ('audit_release', 'member_awarder', 'release.check', 'member', 'member_release', 'system');
	`);

	assert.deepEqual(db.prepare(preflightSql).all(), [
		{ event_id: "event_release", member_id: "member_release", award_count: 2 },
	]);
	db.prepare("DELETE FROM point_awards WHERE id = ?").run("award_release_duplicate");
	assert.deepEqual(db.prepare(preflightSql).all(), []);

	const counts = Object.fromEntries(
		["members", "short_links", "link_daily_stats", "audit_logs"].map((table) => [
			table,
			db.prepare(`SELECT count(*) count FROM ${table}`).get().count,
		]),
	);
	const destinations = db.prepare("SELECT slug, destination_url FROM short_links ORDER BY slug").all();

	db.exec(readFileSync(path.join(migrationDir, "0004_beta_release_bridge.sql"), "utf8").replaceAll("--> statement-breakpoint", ""));

	for (const [table, count] of Object.entries(counts)) {
		assert.equal(db.prepare(`SELECT count(*) count FROM ${table}`).get().count, count);
	}
	assert.equal(db.prepare("SELECT count(*) count FROM short_links").get().count, 2);
	assert.equal(db.prepare("SELECT count(*) count FROM link_daily_stats").get().count, 3);
	assert.deepEqual(destinations, [
		{ slug: "release-a", destination_url: "https://example.com/a" },
		{ slug: "release-b", destination_url: "https://example.com/b" },
	]);
	assert.deepEqual(db.prepare("SELECT slug, destination_url FROM short_links ORDER BY slug").all(), destinations);
	assert.deepEqual(
		db.prepare("SELECT id, point_type_id, points FROM retention_records WHERE id = 'award_release'").get(),
		{ id: "award_release", point_type_id: "pt_retention", points: 5 },
	);

	for (const table of ["link_hourly_stats", "quick_links", "event_type_rules", "point_types", "event_point_awards", "event_staff", "event_invites"]) {
		assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table));
	}
	const eventColumns = new Set(db.prepare("PRAGMA table_info(crs_events)").all().map(({ name }) => name));
	for (const column of ["deleted_at", "grace_minutes", "rsvp_form_json", "rsvp_responses_public", "all_day", "read_only", "public_code"]) {
		assert.ok(eventColumns.has(column));
	}

	console.log(`Release migration preservation check passed: preserved ${counts.short_links} links and ${counts.link_daily_stats} daily stats.`);
} finally {
	db?.close();
	rmSync(tempDir, { recursive: true, force: true });
}
