-- Named assignment is separate from the worker's acceptance.
ALTER TABLE cases ADD COLUMN assigned_worker_id TEXT REFERENCES workers(id);
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'case_assigned';

-- Row locks keep assignment, acceptance and audit writes atomic. Only the
-- server's service role may call these functions; public RPC access is revoked.
CREATE OR REPLACE FUNCTION assign_case_to_worker(p_case_id TEXT, p_worker_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE c cases%ROWTYPE; w workers%ROWTYPE; action_at TIMESTAMPTZ := clock_timestamp();
BEGIN
  SELECT * INTO w FROM workers WHERE id = p_worker_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Choose an available BHW.'; END IF;
  SELECT * INTO c FROM cases WHERE id = p_case_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown case'; END IF;
  IF c.assigned_worker_id = w.id AND c.station_id = w.station_id THEN RETURN; END IF;
  IF c.handoff_state <> 'unassigned' OR c.owner_worker_id IS NOT NULL THEN
    RAISE EXCEPTION 'This case is already assigned. Refresh the record.';
  END IF;
  UPDATE cases SET station_id = w.station_id, assigned_worker_id = w.id,
    assigned_at = action_at, handoff_state = 'pending' WHERE id = c.id;
  INSERT INTO events(case_id, at, type, actor, detail)
    VALUES(c.id, action_at, 'case_assigned', 'Facility staff',
      to_jsonb('Assigned to ' || replace(w.name, 'Demo worker ', '') || ' · ' ||
        (SELECT replace(name, ' (demo station)', '') FROM stations WHERE id = w.station_id)));
END; $$;

CREATE OR REPLACE FUNCTION accept_assigned_case(p_case_id TEXT, p_worker_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE c cases%ROWTYPE; w workers%ROWTYPE; action_at TIMESTAMPTZ := clock_timestamp();
BEGIN
  SELECT * INTO w FROM workers WHERE id = p_worker_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown worker'; END IF;
  SELECT * INTO c FROM cases WHERE id = p_case_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown case'; END IF;
  IF c.handoff_state = 'unassigned' THEN RAISE EXCEPTION 'No station assigned'; END IF;
  IF w.station_id IS DISTINCT FROM c.station_id THEN RAISE EXCEPTION 'This worker belongs to another station.'; END IF;
  IF c.assigned_worker_id IS NOT NULL AND c.assigned_worker_id <> w.id THEN
    RAISE EXCEPTION 'This case is assigned to another BHW.';
  END IF;
  IF c.handoff_state = 'acknowledged' THEN
    IF c.owner_worker_id IS DISTINCT FROM w.id THEN RAISE EXCEPTION 'Owner conflict'; END IF;
    RETURN;
  END IF;
  UPDATE cases SET handoff_state = 'acknowledged', owner_worker_id = w.id,
    acknowledged_at = action_at WHERE id = c.id;
  INSERT INTO events(case_id, at, type, actor, detail)
    VALUES(c.id, action_at, 'case_accepted', replace(w.name, 'Demo worker ', ''), to_jsonb('Accepted responsibility'::text));
END; $$;

REVOKE ALL ON FUNCTION assign_case_to_worker(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION accept_assigned_case(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION assign_case_to_worker(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION accept_assigned_case(TEXT, TEXT) TO service_role;
