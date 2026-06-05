CREATE TABLE IF NOT EXISTS members (
	id TEXT PRIMARY KEY,
	full_name TEXT NOT NULL,
	nickname TEXT,
	pronouns TEXT,
	retention_points INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS member_roles (
	member_id TEXT NOT NULL REFERENCES members(id),
	role_id TEXT NOT NULL REFERENCES roles(id),
	assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (member_id, role_id)
);

CREATE TABLE IF NOT EXISTS resources (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	resource_type TEXT NOT NULL,
	access_level TEXT NOT NULL,
	topic TEXT NOT NULL,
	summary TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS short_links (
	slug TEXT PRIMARY KEY,
	destination_url TEXT NOT NULL,
	owner_member_id TEXT NOT NULL REFERENCES members(id),
	click_count INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crs_events (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	event_type TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending',
	points INTEGER,
	starts_at TEXT NOT NULL,
	created_by_member_id TEXT NOT NULL REFERENCES members(id),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crs_attendance (
	event_id TEXT NOT NULL REFERENCES crs_events(id),
	member_id TEXT NOT NULL REFERENCES members(id),
	scanned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (event_id, member_id)
);

CREATE TABLE IF NOT EXISTS event_media (
	id TEXT PRIMARY KEY,
	event_id TEXT NOT NULL REFERENCES crs_events(id),
	r2_key TEXT NOT NULL,
	caption TEXT,
	uploaded_by_member_id TEXT NOT NULL REFERENCES members(id),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	body TEXT NOT NULL,
	audience TEXT NOT NULL DEFAULT 'all_members',
	pinned_until TEXT,
	published_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
	id TEXT PRIMARY KEY,
	actor_member_id TEXT NOT NULL REFERENCES members(id),
	action TEXT NOT NULL,
	target_type TEXT NOT NULL,
	target_id TEXT NOT NULL,
	note TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO members (id, full_name, nickname, pronouns, retention_points)
VALUES ('mem_sam', 'Sam Dela Cruz', 'Sami', 'she/her', 42);

INSERT OR IGNORE INTO roles (id, name, description)
VALUES
	('role_member', 'Member', 'Base signed-in portal access'),
	('role_calendar_admin', 'Calendar admin', 'Can manage official calendar entries'),
	('role_super_admin', 'Super admin', 'Can manage all scoped admin areas');

INSERT OR IGNORE INTO member_roles (member_id, role_id)
VALUES
	('mem_sam', 'role_member'),
	('mem_sam', 'role_calendar_admin');

INSERT OR IGNORE INTO resources (id, title, resource_type, access_level, topic, summary)
VALUES
	('res_partner_intervention', 'Partner org intervention', 'case', 'confidential', 'Consulting', 'Diagnosis, stakeholder map, and reflections'),
	('res_event_checklist', 'Event planning checklist', 'tool', 'member', 'Retention', 'CRS-ready member event setup');

INSERT OR IGNORE INTO short_links (slug, destination_url, owner_member_id, click_count)
VALUES ('/yhk', 'https://code.cjuy.dev/resources/youth-huddle-kit', 'mem_sam', 184);
-- Migration number: 0001 	 2026-06-05T10:46:52.164Z
