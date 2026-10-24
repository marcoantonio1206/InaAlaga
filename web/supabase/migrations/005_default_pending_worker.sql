-- Apply after 004. Fill station-only pending cases using the two workers
-- supported by the role switcher, without changing acceptance or ownership.
-- Also covers future discharges/imports; no default if the match is ambiguous.
CREATE OR REPLACE FUNCTION fill_pending_station_worker()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  default_id TEXT;
  default_name TEXT;
  station_label TEXT;
  matches INTEGER;
BEGIN
  IF NEW.handoff_state <> 'pending' OR NEW.assigned_worker_id IS NOT NULL
     OR NEW.owner_worker_id IS NOT NULL OR NEW.station_id IS NULL THEN RETURN NEW; END IF;
  SELECT count(*), min(w.id), min(replace(w.name, 'Demo worker ', '')), min(s.name)
    INTO matches, default_id, default_name, station_label
    FROM workers w JOIN stations s ON s.id = w.station_id
    WHERE w.station_id = NEW.station_id
      AND ((w.id = 'ana' AND w.name IN ('Ana', 'Demo worker Ana') AND s.name = 'Tanza BHS (demo station)')
        OR (w.id = 'bea' AND w.name IN ('Bea', 'Demo worker Bea') AND s.name = 'Linao West BHS (demo station)'));
  IF matches <> 1 THEN RETURN NEW; END IF;

  UPDATE cases SET assigned_worker_id = default_id WHERE id = NEW.id
    AND handoff_state = 'pending' AND assigned_worker_id IS NULL AND owner_worker_id IS NULL;
  IF FOUND THEN
    INSERT INTO events(case_id, at, type, actor, detail)
      VALUES(NEW.id, clock_timestamp(), 'case_assigned', 'Station lookup',
        to_jsonb('Assigned to ' || default_name || ' · ' || replace(station_label, ' (demo station)', '')));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER fill_pending_station_worker
AFTER INSERT OR UPDATE OF station_id, handoff_state, assigned_worker_id ON cases
FOR EACH ROW EXECUTE FUNCTION fill_pending_station_worker();
REVOKE ALL ON FUNCTION fill_pending_station_worker() FROM PUBLIC, anon, authenticated;

-- Fire the same guarded path once for existing pending station-only records.
-- Keep the original station assignment and acknowledgment timestamps intact.
UPDATE cases SET assigned_worker_id = assigned_worker_id
WHERE handoff_state = 'pending' AND station_id IS NOT NULL
  AND assigned_worker_id IS NULL AND owner_worker_id IS NULL;
