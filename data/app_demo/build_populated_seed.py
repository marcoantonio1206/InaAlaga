"""Build an independently fictional, deterministic populated app snapshot."""

import copy
import csv
import json
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path


HERE = Path(__file__).resolve().parent


def timestamp(value):
    return value.isoformat(timespec="seconds").replace("+00:00", "Z")


def build():
    original = json.loads((HERE / "seed_v1.json").read_text())
    data = copy.deepcopy(original)
    data.update(
        schema_version="1.1.0",
        dataset_id="inaalaga-app-demo-populated-v1",
        snapshot_kind="prepopulated_fictional_history",
        description="20 fictional app cases and four fictional workers. Historical fixture events are not real server audit events or simulation outputs.",
    )
    data["workers"] += [
        {"worker_id": "demo_worker_carlo", "display_name": "Carlo", "station_id": "demo_tanza", "fictional": True},
        {"worker_id": "demo_worker_dina", "display_name": "Dina", "station_id": "demo_linao_west", "fictional": True},
    ]
    with (HERE.parent / "geography/pilot_v2/barangays.csv").open(newline="") as handle:
        barangays = list(csv.DictReader(handle))
    aliases = [
        "Camille Navarro", "Isabel Mendoza", "Patricia Ramos", "Elena Castillo",
        "Sofia Garcia", "Teresa Aquino", "Mikaela Flores", "Nina Soriano",
        "Andrea Valdez", "Julia Fernandez", "Lea Domingo", "Clara Reyes",
        "Diana Cruz", "Mara Santiago",
    ]
    clock = datetime.fromisoformat(data["demo_clock_at"].replace("Z", "+00:00"))
    for offset, alias in enumerate(aliases):
        index = offset + 6
        discharge = clock - timedelta(days=2 + offset % 2, hours=offset % 4)
        barangay = barangays[offset % len(barangays)]
        unmapped = index == 19
        data["cases"].append({
            "case_id": f"IA-{42 + index:04d}", "mother_alias": alias,
            "barangay_name": "Demo barangay outside lookup" if unmapped else barangay["name"],
            "barangay_psgc": None if unmapped else barangay["psgc"],
            "facility_id": "demo_cvmc",
            "birth_at": timestamp(discharge - timedelta(hours=24)),
            "discharge_at": timestamp(discharge),
            "due_at": timestamp(discharge + timedelta(hours=[24, 48, 72][offset % 3])),
            "station_id": None if unmapped else barangay["nearest_station_id"],
            "assignment_reason": "no_demo_lookup_match" if unmapped else "pilot_v2_demo_lookup",
            "routed_at": None if unmapped else timestamp(discharge + timedelta(minutes=1)),
            "handoff_status": "unassigned" if unmapped else "pending",
            "owner_worker_id": None, "acknowledged_at": None,
        })
    scenarios = [
        "scheduled", "accepted", "scheduled", "attempted", "completed", "unassigned",
        "pending", "scheduled", "completed", "attempted", "accepted", "pending",
        "scheduled", "completed", "accepted", "pending", "scheduled", "completed",
        "pending", "unassigned",
    ]
    data["fixture_events"] = []
    data["demo_scenarios"] = []

    def event(case, event_type, when, actor_role, actor_id, payload):
        data["fixture_events"].append({
            "event_id": f"FIX-{len(data['fixture_events']) + 1:04d}",
            "case_id": case["case_id"], "event_type": event_type,
            "occurred_at": timestamp(when), "actor_role": actor_role,
            "actor_id": actor_id, "fixture_only": True, "payload": payload,
        })

    worker_counts = Counter()
    for index, (case, scenario) in enumerate(zip(data["cases"], scenarios)):
        discharge = datetime.fromisoformat(case["discharge_at"].replace("Z", "+00:00"))
        event(case, "discharge_recorded", discharge, "hospital", "demo_hospital_facilitator", {"facility_id": case["facility_id"]})
        if case["station_id"] is None:
            event(case, "assignment_unresolved", discharge + timedelta(minutes=1), "system", "demo_assignment_lookup", {"reason": "no_demo_lookup_match"})
        else:
            event(case, "station_assigned", discharge + timedelta(minutes=1), "system", "demo_assignment_lookup", {"station_id": case["station_id"], "lookup_version": "pilot_v2"})
        if scenario not in ("pending", "unassigned"):
            pool = ["demo_worker_ana", "demo_worker_carlo"] if case["station_id"] == "demo_tanza" else ["demo_worker_bea", "demo_worker_dina"]
            owner = pool[worker_counts[case["station_id"]] % 2]
            worker_counts[case["station_id"]] += 1
            accepted = discharge + timedelta(minutes=5)
            case.update(handoff_status="acknowledged", owner_worker_id=owner, acknowledged_at=timestamp(accepted))
            event(case, "responsibility_accepted", accepted, "worker", owner, {"owner_worker_id": owner})
            if scenario in ("scheduled", "attempted", "completed"):
                followup_id = f"FU-{42 + index:04d}"
                scheduled_for = clock + timedelta(days=1, hours=index, minutes=0)
                if scenario in ("attempted", "completed"):
                    scheduled_for = discharge + timedelta(hours=2)
                booked = discharge + timedelta(minutes=10)
                followup = {
                    "followup_id": followup_id, "case_id": case["case_id"],
                    "visit_type": "home_followup", "location_label": "Your home",
                    "worker_id": owner, "status": "scheduled",
                    "scheduled_at": timestamp(booked), "scheduled_for": timestamp(scheduled_for),
                    "contact_started_at": None, "contact_completed_at": None,
                }
                data["followups"].append(followup)
                event(case, "visit_scheduled", booked, "worker", owner, {"followup_id": followup_id, "scheduled_for": followup["scheduled_for"], "visit_type": "home_followup"})
                if scenario in ("attempted", "completed"):
                    start = scheduled_for
                    end = start + timedelta(minutes=20)
                    completed = scenario == "completed"
                    followup["status"] = "completed" if completed else "attempted"
                    followup["contact_started_at"] = timestamp(start)
                    followup["contact_completed_at"] = timestamp(end) if completed else None
                    outcome_id = f"OUT-{42 + index:04d}"
                    data["contact_outcomes"].append({
                        "outcome_id": outcome_id, "case_id": case["case_id"],
                        "followup_id": followup_id, "worker_id": owner,
                        "outcome": "contact_completed" if completed else "not_reached",
                        "started_at": timestamp(start), "ended_at": timestamp(end),
                        "recorded_at": timestamp(end + timedelta(minutes=1)),
                    })
                    event(case, "contact_started", start, "worker", owner, {"followup_id": followup_id})
                    event(case, "contact_completed" if completed else "contact_not_reached", end, "worker", owner, {"followup_id": followup_id, "outcome_id": outcome_id})
            if index in (0, 2, 7, 12):
                requested = discharge + timedelta(minutes=15)
                acknowledged = requested + timedelta(minutes=5) if index in (2, 12) else None
                request_id = f"REQ-{42 + index:04d}"
                data["contact_requests"].append({
                    "request_id": request_id, "case_id": case["case_id"],
                    "request_type": "please_contact_me", "created_at": timestamp(requested),
                    "status": "acknowledged" if acknowledged else "open",
                    "acknowledged_at": timestamp(acknowledged) if acknowledged else None,
                    "acknowledged_by_worker_id": owner if acknowledged else None,
                })
                event(case, "contact_requested", requested, "mother", case["case_id"], {"request_id": request_id})
                if acknowledged:
                    event(case, "contact_request_acknowledged", acknowledged, "worker", owner, {"request_id": request_id})
        data["demo_scenarios"].append({"case_id": case["case_id"], "scenario": scenario})
    data["fixture_events"].sort(key=lambda item: (item["occurred_at"], item["event_id"]))
    return data


if __name__ == "__main__":
    output = HERE / "seed_populated_v1.json"
    output.write_text(json.dumps(build(), indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {output.name}: 20 cases, four workers.")
