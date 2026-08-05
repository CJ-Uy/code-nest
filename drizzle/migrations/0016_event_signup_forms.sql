ALTER TABLE crs_events ADD COLUMN rsvp_form_json text NOT NULL DEFAULT '[]';
ALTER TABLE event_rsvps ADD COLUMN answers_json text NOT NULL DEFAULT '{}';
