-- InaAlaga Initial Schema
-- Created for the hospital-to-community handoff demo
-- Run with: supabase db push (after linking project)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE handoff_state AS ENUM ('unassigned', 'pending', 'acknowledged');
CREATE TYPE visit_state AS ENUM ('scheduled', 'attempted', 'completed', 'cancelled');
CREATE TYPE request_state AS ENUM ('none', 'recorded', 'acknowledged');
CREATE TYPE attempt_outcome AS ENUM ('not_reached', 'reached');
CREATE TYPE visit_outcome AS ENUM ('completed');
CREATE TYPE event_type AS ENUM (
  'case_created',
  'case_accepted',
  'visit_scheduled',
  'visit_completed',
  'request_recorded',
  'request_acknowledged',
  'contact_attempt',
  'session_imported',
  'session_reset'
);

-- ============================================
-- STATIONS TABLE (Reference data)
-- ============================================
CREATE TABLE stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WORKERS TABLE (Reference data)
-- ============================================
CREATE TABLE workers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  station_id TEXT NOT NULL REFERENCES stations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SESSIONS TABLE (Demo session scoping)
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile TEXT NOT NULL CHECK (profile IN ('clean', 'populated')),
  demo_clock_at TIMESTAMPTZ NOT NULL,  -- Frozen clock: 2026-10-19T04:00:00Z
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CASES TABLE (Core entity)
-- ============================================
CREATE TABLE cases (
  id TEXT PRIMARY KEY,  -- e.g., 'IA-0042', 'PV-1'
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  barangay TEXT NOT NULL,
  barangay_psgc TEXT,  -- Nullable for unassigned
  station_id TEXT REFERENCES stations(id),  -- Nullable for unassigned
  handoff_state handoff_state NOT NULL DEFAULT 'pending',
  request_state request_state NOT NULL DEFAULT 'none',
  owner_worker_id TEXT REFERENCES workers(id),  -- Nullable until acknowledged
  acknowledged_at TIMESTAMPTZ,
  birth_at TIMESTAMPTZ NOT NULL,
  discharge_at TIMESTAMPTZ NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  assigned_at TIMESTAMPTZ,
  mother_token UUID UNIQUE,  -- For mother view access
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_cases_session_station ON cases(session_id, station_id);
CREATE INDEX idx_cases_session_handoff_due ON cases(session_id, handoff_state, due_at);
CREATE INDEX idx_cases_mother_token ON cases(mother_token);
CREATE INDEX idx_cases_session_owner ON cases(session_id, owner_worker_id);

-- ============================================
-- VISITS TABLE
-- ============================================
CREATE TABLE visits (
  id TEXT PRIMARY KEY,  -- e.g., 'v1', 'v2' per case
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  state visit_state NOT NULL DEFAULT 'scheduled',
  scheduled_for TIMESTAMPTZ NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('home', 'station')),
  worker_name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  outcome visit_outcome,
  completed_recorded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visits_case_state ON visits(case_id, state);
CREATE INDEX idx_visits_worker_scheduled ON visits(worker_name, scheduled_for) WHERE state = 'scheduled';

-- ============================================
-- CONTACT REQUESTS TABLE
-- ============================================
CREATE TABLE contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  state request_state NOT NULL DEFAULT 'recorded',
  recorded_at TIMESTAMPTZ NOT NULL,
  acknowledged_by TEXT,  -- Worker name
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_requests_case ON contact_requests(case_id);

-- ============================================
-- CONTACT ATTEMPTS TABLE
-- ============================================
CREATE TABLE contact_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('phone', 'sms', 'visit')),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  outcome attempt_outcome NOT NULL,
  worker_name TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_attempts_case ON contact_attempts(case_id);

-- ============================================
-- EVENTS TABLE (Audit log)
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  at TIMESTAMPTZ NOT NULL,
  type event_type NOT NULL,
  actor TEXT NOT NULL,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_case ON events(case_id);
CREATE INDEX idx_events_case_at ON events(case_id, at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Stations: readable by all authenticated (demo roles), writable by service role only
CREATE POLICY "stations_read_all" ON stations
  FOR SELECT USING (true);

-- Workers: readable by all, writable by service role only
CREATE POLICY "workers_read_all" ON workers
  FOR SELECT USING (true);

-- Sessions: service role manages, demo roles can read own session
CREATE POLICY "sessions_service_all" ON sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "sessions_read_own" ON sessions
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    id = (current_setting('request.jwt.claims', true)::json->>'session_id')::uuid
  );

-- Cases: complex policies based on demo role
-- Coordinator (service role via API): full access
CREATE POLICY "cases_service_all" ON cases
  FOR ALL USING (auth.role() = 'service_role');

-- BHW: can read cases for their station
CREATE POLICY "cases_bhw_read_station" ON cases
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    station_id = current_setting('request.jwt.claims', true)::json->>'station_id'
  );

-- BHW: can update handoff_state, owner_worker_id, acknowledged_at for their station
CREATE POLICY "cases_bhw_update_acknowledge" ON cases
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    station_id = current_setting('request.jwt.claims', true)::json->>'station_id'
  ) WITH CHECK (
    auth.role() = 'authenticated' AND
    station_id = current_setting('request.jwt.claims', true)::json->>'station_id'
  );

-- Mother: can read only their own case via token
CREATE POLICY "cases_mother_read_own" ON cases
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    mother_token = (current_setting('request.jwt.claims', true)::json->>'mother_token')::uuid
  );

-- Mother: can update request_state on their own case
CREATE POLICY "cases_mother_update_request" ON cases
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    mother_token = (current_setting('request.jwt.claims', true)::json->>'mother_token')::uuid
  ) WITH CHECK (
    auth.role() = 'authenticated' AND
    mother_token = (current_setting('request.jwt.claims', true)::json->>'mother_token')::uuid
  );

-- Visits: service role full access
CREATE POLICY "visits_service_all" ON visits
  FOR ALL USING (auth.role() = 'service_role');

-- BHW: can read/insert/update visits for their station's cases
CREATE POLICY "visits_bhw_access" ON visits
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = visits.case_id
      AND c.station_id = current_setting('request.jwt.claims', true)::json->>'station_id'
    )
  );

-- Mother: can read visits for their case
CREATE POLICY "visits_mother_read_own" ON visits
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = visits.case_id
      AND c.mother_token = (current_setting('request.jwt.claims', true)::json->>'mother_token')::uuid
    )
  );

-- Contact requests: service role full access
CREATE POLICY "contact_requests_service_all" ON contact_requests
  FOR ALL USING (auth.role() = 'service_role');

-- BHW: can read/update for their station
CREATE POLICY "contact_requests_bhw_access" ON contact_requests
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = contact_requests.case_id
      AND c.station_id = current_setting('request.jwt.claims', true)::json->>'station_id'
    )
  );

-- Mother: can insert (create request) and read for their case
CREATE POLICY "contact_requests_mother_access" ON contact_requests
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = contact_requests.case_id
      AND c.mother_token = (current_setting('request.jwt.claims', true)::json->>'mother_token')::uuid
    )
  );

-- Contact attempts: service role full access
CREATE POLICY "contact_attempts_service_all" ON contact_attempts
  FOR ALL USING (auth.role() = 'service_role');

-- BHW: can insert/read for their station
CREATE POLICY "contact_attempts_bhw_access" ON contact_attempts
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = contact_attempts.case_id
      AND c.station_id = current_setting('request.jwt.claims', true)::json->>'station_id'
    )
  );

-- Events: service role full access (insert-only for audit)
CREATE POLICY "events_service_all" ON events
  FOR ALL USING (auth.role() = 'service_role');

-- BHW: can read events for their station's cases
CREATE POLICY "events_bhw_read" ON events
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = events.case_id
      AND c.station_id = current_setting('request.jwt.claims', true)::json->>'station_id'
    )
  );

-- Mother: can read events for their case
CREATE POLICY "events_mother_read" ON events
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = events.case_id
      AND c.mother_token = (current_setting('request.jwt.claims', true)::json->>'mother_token')::uuid
    )
  );

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_requests_updated_at BEFORE UPDATE ON contact_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA FOR STATIONS AND WORKERS
-- ============================================
INSERT INTO stations (id, name) VALUES
  ('tanza', 'Tanza BHS (demo station)'),
  ('linao', 'Linao West BHS (demo station)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workers (id, name, station_id) VALUES
  ('ana', 'Demo worker Ana', 'tanza'),
  ('carlo', 'Demo worker Carlo', 'tanza'),
  ('bea', 'Demo worker Bea', 'linao'),
  ('dina', 'Demo worker Dina', 'linao')
ON CONFLICT (id) DO NOTHING;