-- Multi-day events, read-only (informational) events, and short share codes.
-- Additive only: every column has a default, so the currently deployed Worker keeps working
-- against this schema mid-deploy.

ALTER TABLE crs_events ADD COLUMN all_day INTEGER NOT NULL DEFAULT 0;
ALTER TABLE crs_events ADD COLUMN read_only INTEGER NOT NULL DEFAULT 0;
ALTER TABLE crs_events ADD COLUMN public_code TEXT;

-- The month view stops being a pure starts_at range scan once it selects by overlap.
CREATE INDEX IF NOT EXISTS crs_events_ends_at_idx ON crs_events (ends_at);

-- Backfill share codes for existing events so every event is shareable immediately.
-- Alphabet omits I, L, O, U, 0 and 1 — the glyphs people mistype reading a code off a poster.
-- SQLite evaluates random() once per call, so the six terms are independent.
UPDATE crs_events SET public_code = (
	substr('ABCDEFGHJKMNPQRSTVWXYZ23456789', (abs(random()) % 30) + 1, 1) ||
	substr('ABCDEFGHJKMNPQRSTVWXYZ23456789', (abs(random()) % 30) + 1, 1) ||
	substr('ABCDEFGHJKMNPQRSTVWXYZ23456789', (abs(random()) % 30) + 1, 1) ||
	substr('ABCDEFGHJKMNPQRSTVWXYZ23456789', (abs(random()) % 30) + 1, 1) ||
	substr('ABCDEFGHJKMNPQRSTVWXYZ23456789', (abs(random()) % 30) + 1, 1) ||
	substr('ABCDEFGHJKMNPQRSTVWXYZ23456789', (abs(random()) % 30) + 1, 1)
) WHERE public_code IS NULL;

-- Created after the backfill so a collision across existing rows fails loudly here rather than
-- silently mis-routing a share link later.
CREATE UNIQUE INDEX IF NOT EXISTS crs_events_public_code_idx ON crs_events (public_code);
