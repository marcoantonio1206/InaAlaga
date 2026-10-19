"""Validate the initial app fixture without changing simulation or app state."""

import csv
import json
from datetime import datetime
from pathlib import Path


HERE = Path(__file__).resolve().parent


def require(condition, message):
    if not condition:
        raise ValueError(message)


def utc_timestamp(value):
    require(isinstance(value, str) and value.endswith("Z"), f"Expected UTC timestamp: {value!r}")
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def unique_records(records, key):
    result = {}
    for record in records:
        value = record[key]
        require(isinstance(value, str) and value, f"Missing {key}")
        require(value not in result, f"Duplicate {key}: {value}")
        result[value] = record
    return result


def validate(data):
    require(data["schema_version"] == "1.0.0", "Unsupported schema version")
    require(data["fictional_data_only"] is True, "Fictional-data label required")
    require(data["display_timezone"] == "Asia/Manila", "Unexpected display timezone")
    require(data["assignment_lookup_version"] == "pilot_v2", "Unexpected assignment lookup")
    clock = utc_timestamp(data["demo_clock_at"])
    facilities = unique_records(data["facilities"], "facility_id")
    stations = unique_records(data["stations"], "station_id")
    workers = unique_records(data["workers"], "worker_id")
    cases = unique_records(data["cases"], "case_id")
    require(len(cases) == 6, "v1 should contain six initial cases")
    for station in stations.values():
        require(station["demo_station"] is True, "Station must be labeled demo")
    for worker in workers.values():
        require(worker["fictional"] is True, "Worker must be fictional")
        require(worker["station_id"] in stations, "Worker references unknown station")
    with (HERE.parent / "geography/pilot_v2/barangays.csv").open(newline="") as handle:
        pilot = {row["psgc"]: row for row in csv.DictReader(handle)}
    assigned_codes = []
    overdue = []
    unassigned = 0
    for case_id, case in cases.items():
        require(case["mother_alias"].strip(), f"{case_id}: mother alias required")
        require(case["facility_id"] in facilities, f"{case_id}: unknown facility")
        birth = utc_timestamp(case["birth_at"])
        discharge = utc_timestamp(case["discharge_at"])
        due = utc_timestamp(case["due_at"])
        require(birth <= discharge <= due, f"{case_id}: invalid timestamp order")
        require(discharge <= clock, f"{case_id}: discharge is after the demo clock")
        require(case["owner_worker_id"] is None, f"{case_id}: initial owner must be null")
        require(case["acknowledged_at"] is None, f"{case_id}: initial acknowledgment must be null")
        if case["station_id"] is None:
            unassigned += 1
            require(case["handoff_status"] == "unassigned", f"{case_id}: incorrect unassigned state")
            require(case["barangay_psgc"] is None, f"{case_id}: unmapped fixture needs null PSGC")
            require(case["routed_at"] is None, f"{case_id}: unassigned record cannot be routed")
            require(case["assignment_reason"] == "no_demo_lookup_match", f"{case_id}: invalid exception reason")
        else:
            require(case["station_id"] in stations, f"{case_id}: unknown station")
            code = case["barangay_psgc"]
            require(isinstance(code, str) and code in pilot, f"{case_id}: unknown PSGC string")
            require(case["barangay_name"] == pilot[code]["name"], f"{case_id}: barangay name mismatch")
            require(case["station_id"] == pilot[code]["nearest_station_id"], f"{case_id}: assignment mismatch")
            require(case["handoff_status"] == "pending", f"{case_id}: assignment is not acceptance")
            require(case["assignment_reason"] == "pilot_v2_demo_lookup", f"{case_id}: invalid assignment reason")
            require(discharge <= utc_timestamp(case["routed_at"]) <= clock, f"{case_id}: invalid assignment time")
            assigned_codes.append(code)
        if due < clock:
            overdue.append(case_id)
    require(unassigned == 1, "Expected one unmapped fixture")
    require(len(assigned_codes) == len(set(assigned_codes)) == 5, "Expected five distinct pilot barangays")
    require(set(assigned_codes) == set(pilot), "Seed must cover the canonical pilot")
    for collection in ("followups", "contact_requests", "contact_outcomes"):
        require(data[collection] == [], f"Initial {collection} must be empty")
    require(overdue == ["IA-0045"], "Expected only Liza's demo target overdue at the frozen clock")
    return f"Valid: {len(cases)} cases, {len(stations)} stations, {len(workers)} workers; one unassigned; overdue target: {overdue[0]}."


if __name__ == "__main__":
    with (HERE / "seed_v1.json").open() as handle:
        seed = json.load(handle)
    print(validate(seed))
