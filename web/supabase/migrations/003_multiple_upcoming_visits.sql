-- Multiple scheduled appointments are supported; exact-start duplicates are not.
-- These do not assert availability across a visit's full duration or travel time.
CREATE UNIQUE INDEX visits_one_mother_per_start
ON visits (case_id, scheduled_for) WHERE state <> 'cancelled';
CREATE UNIQUE INDEX visits_one_worker_per_start
ON visits (worker_name, scheduled_for) WHERE state = 'scheduled';
