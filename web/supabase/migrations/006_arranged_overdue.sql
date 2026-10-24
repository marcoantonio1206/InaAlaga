-- An arrangement resolves warnings, independently of completed contact/visits.
ALTER TABLE cases ADD COLUMN overdue_arranged_at TIMESTAMPTZ,
  ADD COLUMN overdue_arranged_by TEXT;
ALTER TABLE visits ADD COLUMN arranged_at TIMESTAMPTZ,
  ADD COLUMN arranged_by TEXT;
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'followup_arranged';

CREATE OR REPLACE FUNCTION arrange_overdue_followup(p_case_id TEXT, p_worker_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE c cases%ROWTYPE; w workers%ROWTYPE; at_time TIMESTAMPTZ := clock_timestamp();
  visit_count INTEGER; target_pending BOOLEAN;
BEGIN
  SELECT * INTO w FROM workers WHERE id = p_worker_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown worker'; END IF;
  SELECT * INTO c FROM cases WHERE id = p_case_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown case'; END IF;
  IF c.handoff_state <> 'acknowledged' OR c.owner_worker_id IS DISTINCT FROM w.id
     OR c.station_id IS DISTINCT FROM w.station_id THEN
    RAISE EXCEPTION 'Only the responsible BHW can mark this arranged.';
  END IF;
  target_pending := c.due_at < at_time AND c.overdue_arranged_at IS NULL
    AND NOT EXISTS(SELECT 1 FROM visits WHERE case_id = c.id AND state = 'completed')
    AND NOT EXISTS(SELECT 1 FROM contact_attempts WHERE case_id = c.id AND outcome = 'reached');
  UPDATE visits SET arranged_at = at_time, arranged_by = replace(w.name, 'Demo worker ', '')
    WHERE case_id = c.id AND state = 'scheduled' AND scheduled_for <= at_time AND arranged_at IS NULL;
  GET DIAGNOSTICS visit_count = ROW_COUNT;
  IF visit_count = 0 AND NOT target_pending THEN RETURN; END IF;
  IF target_pending THEN
    UPDATE cases SET overdue_arranged_at = at_time, overdue_arranged_by = replace(w.name, 'Demo worker ', '') WHERE id = c.id;
  END IF;
  INSERT INTO events(case_id, at, type, actor, detail)
    VALUES(c.id, at_time, 'followup_arranged', replace(w.name, 'Demo worker ', ''),
      to_jsonb('Arranged with mother. Visit outcomes remain separate. Overdue visits: ' || visit_count::text));
END; $$;
REVOKE ALL ON FUNCTION arrange_overdue_followup(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION arrange_overdue_followup(TEXT, TEXT) TO service_role;
