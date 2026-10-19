"""Check populated fixture chronology, ownership, state and matching history."""

import json
from collections import Counter

from validate_seed import HERE, require, unique_records, utc_timestamp
import csv


def validate(data):
    require(data["schema_version"] == "1.1.0", "Unexpected snapshot schema")
    require(data["fictional_data_only"] is True, "Fictional label required")
    require(data["display_timezone"] == "Asia/Manila", "Unexpected timezone")
    require(data["snapshot_kind"] == "prepopulated_fictional_history", "Snapshot label required")
    clock = utc_timestamp(data["demo_clock_at"])
    cases = unique_records(data["cases"], "case_id")
    workers = unique_records(data["workers"], "worker_id")
    stations = unique_records(data["stations"], "station_id")
    facilities = unique_records(data["facilities"], "facility_id")
    visits = unique_records(data["followups"], "followup_id")
    requests = unique_records(data["contact_requests"], "request_id")
    outcomes = unique_records(data["contact_outcomes"], "outcome_id")
    events = unique_records(data["fixture_events"], "event_id")
    scenarios = unique_records(data["demo_scenarios"], "case_id")
    require(len(cases) == 20 and len(workers) == 4, "Expected 20 cases and four workers")
    require(set(scenarios) == set(cases), "Each case needs one scenario")
    require(Counter(w["station_id"] for w in workers.values()) == {s: 2 for s in stations}, "Expected two workers per station")
    for worker in workers.values():
        require(worker["fictional"] is True, "Fictional worker label required")
    with (HERE.parent / "geography/pilot_v2/barangays.csv").open(newline="") as handle:
        lookup = {row["psgc"]: row for row in csv.DictReader(handle)}

    def history(case_id, kind, reference=None):
        matches = [e for e in events.values() if e["case_id"] == case_id and e["event_type"] == kind
                   and (reference is None or reference in e["payload"].values())]
        require(len(matches) == 1, f"{case_id}: expected one {kind} event for {reference}")
        return matches[0]

    def owner(case, worker_id):
        require(worker_id in workers, "Unknown worker")
        require(workers[worker_id]["station_id"] == case["station_id"], "Worker outside case station")
        require(worker_id == case["owner_worker_id"], "Worker must match accepted owner in this fixture")

    for e in events.values():
        require(e["case_id"] in cases and e["fixture_only"] is True, "Invalid fixture event")
        require(utc_timestamp(e["occurred_at"]) <= clock, "History cannot occur after snapshot")
        if e["actor_role"] == "worker":
            owner(cases[e["case_id"]], e["actor_id"])
        if e["actor_role"] == "mother":
            require(e["actor_id"] == e["case_id"], "Incorrect mother actor")
    for case in cases.values():
        cid = case["case_id"]
        birth, discharge, due = (utc_timestamp(case[k]) for k in ("birth_at", "discharge_at", "due_at"))
        require(birth <= discharge <= due and discharge <= clock, f"{cid}: invalid dates")
        require(case["facility_id"] in facilities and case["mother_alias"].strip(), "Invalid case identity")
        require(history(cid, "discharge_recorded")["occurred_at"] == case["discharge_at"], "Discharge history mismatch")
        if case["station_id"] is None:
            require(case["handoff_status"] == "unassigned" and case["barangay_psgc"] is None and case["routed_at"] is None, "Invalid unmapped state")
            history(cid, "assignment_unresolved")
        else:
            row = lookup[case["barangay_psgc"]]
            require((case["barangay_name"], case["station_id"]) == (row["name"], row["nearest_station_id"]), "Lookup mismatch")
            routed = utc_timestamp(case["routed_at"])
            require(discharge <= routed <= clock, "Invalid routing time")
            require(history(cid, "station_assigned")["occurred_at"] == case["routed_at"], "Routing history mismatch")
        if case["handoff_status"] == "acknowledged":
            owner(case, case["owner_worker_id"])
            require(utc_timestamp(case["routed_at"]) <= utc_timestamp(case["acknowledged_at"]) <= clock, "Invalid acceptance time")
            require(history(cid, "responsibility_accepted")["occurred_at"] == case["acknowledged_at"], "Acceptance history mismatch")
        else:
            require(case["owner_worker_id"] is None and case["acknowledged_at"] is None, "Pending is not accepted")
    for visit in visits.values():
        case = cases[visit["case_id"]]
        owner(case, visit["worker_id"])
        booked, scheduled = (utc_timestamp(visit[k]) for k in ("scheduled_at", "scheduled_for"))
        require(utc_timestamp(case["acknowledged_at"]) <= booked <= clock and booked <= scheduled, "Invalid schedule order")
        require(visit["visit_type"] == "home_followup", "Snapshot should use core home visits")
        event = history(case["case_id"], "visit_scheduled", visit["followup_id"])
        require(event["occurred_at"] == visit["scheduled_at"] and event["payload"]["scheduled_for"] == visit["scheduled_for"], "Schedule history mismatch")
        related = [o for o in outcomes.values() if o["followup_id"] == visit["followup_id"]]
        if visit["status"] == "scheduled":
            require(scheduled > clock and not related, "Scheduled snapshot visit needs future time and no outcome")
            require(visit["contact_started_at"] is None and visit["contact_completed_at"] is None, "Scheduled is not contacted")
        else:
            require(len(related) == 1, "Attempted/completed visit needs one recorded outcome")
            outcome = related[0]
            require(visit["contact_started_at"] == outcome["started_at"], "Contact start mismatch")
            expected = "contact_completed" if visit["status"] == "completed" else "not_reached"
            require(outcome["outcome"] == expected, "Visit and outcome disagree")
            require(visit["contact_completed_at"] == (outcome["ended_at"] if expected == "contact_completed" else None), "Failed contact must not be completed")
    for outcome in outcomes.values():
        visit = visits[outcome["followup_id"]]
        case = cases[outcome["case_id"]]
        require(visit["case_id"] == case["case_id"], "Outcome case mismatch")
        owner(case, outcome["worker_id"])
        require(utc_timestamp(visit["scheduled_at"]) <= utc_timestamp(outcome["started_at"]) <= utc_timestamp(outcome["ended_at"]) <= utc_timestamp(outcome["recorded_at"]) <= clock, "Invalid outcome chronology")
        require(history(case["case_id"], "contact_started", visit["followup_id"])["occurred_at"] == outcome["started_at"], "Start history mismatch")
        kind = "contact_completed" if outcome["outcome"] == "contact_completed" else "contact_not_reached"
        require(history(case["case_id"], kind, outcome["outcome_id"])["occurred_at"] == outcome["ended_at"], "Outcome history mismatch")
    for request in requests.values():
        case = cases[request["case_id"]]
        created = utc_timestamp(request["created_at"])
        require(utc_timestamp(case["discharge_at"]) <= created <= clock, "Invalid request time")
        require(history(case["case_id"], "contact_requested", request["request_id"])["occurred_at"] == request["created_at"], "Request history mismatch")
        if request["status"] == "open":
            require(request["acknowledged_at"] is None and request["acknowledged_by_worker_id"] is None, "Saved request must not imply acknowledgment")
        else:
            require(request["status"] == "acknowledged", "Unknown request state")
            owner(case, request["acknowledged_by_worker_id"])
            require(created <= utc_timestamp(request["acknowledged_at"]) <= clock, "Invalid acknowledgment chronology")
            require(history(case["case_id"], "contact_request_acknowledged", request["request_id"])["occurred_at"] == request["acknowledged_at"], "Request acknowledgment history mismatch")
    require(set(c["owner_worker_id"] for c in cases.values() if c["owner_worker_id"]) == set(workers), "All four demo workers should have examples")
    return {"cases": len(cases), "workers": len(workers), "handoffs": dict(Counter(c["handoff_status"] for c in cases.values())), "visits": dict(Counter(v["status"] for v in visits.values())), "requests": dict(Counter(r["status"] for r in requests.values())), "fixture_events": len(events)}


if __name__ == "__main__":
    print(json.dumps(validate(json.loads((HERE / "seed_populated_v1.json").read_text())), indent=2))
