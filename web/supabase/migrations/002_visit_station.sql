-- Preserve the scheduled destination independently of the case assignment.
ALTER TABLE visits ADD COLUMN station_name TEXT;

-- Existing station visits, if any, used the case's station implicitly.
UPDATE visits v SET station_name = s.name
FROM cases c JOIN stations s ON s.id = c.station_id
WHERE v.case_id = c.id AND v.location_type = 'station';

ALTER TABLE visits ADD CONSTRAINT visits_station_destination
CHECK ((location_type = 'home' AND station_name IS NULL)
    OR (location_type = 'station' AND station_name IS NOT NULL));
