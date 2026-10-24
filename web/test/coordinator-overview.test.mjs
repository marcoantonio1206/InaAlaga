// Coordinator overview groups come only from saved case fields. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { groupOverview } from "../src/lib/coordinatorOverview.js";

const base = { barangay: "Caritan Norte", station_name: "Tanza BHS (demo station)", handoff_state: "acknowledged", request_state: "none", visits: [], contact_attempts: [] };
const now = "2026-10-24T04:00:00.000Z";
const cases = [
  { ...base, id: "IA-0001", alias: "A", due_at: "2026-10-25T00:00:00Z", handoff_state: "unassigned", station_name: null },
  { ...base, id: "IA-0002", alias: "B", due_at: "2026-10-23T00:00:00Z", handoff_state: "pending", assigned_worker: "Ana" },
  { ...base, id: "IA-0003", alias: "C", due_at: "2026-10-22T00:00:00Z", request_state: "recorded",
    visits: [{ id: "v1", state: "scheduled", scheduled_for: "2026-10-23T01:00:00Z", worker_name: "Ana" }] },
  { ...base, id: "IA-0004", alias: "D", due_at: "2026-10-22T00:00:00Z",
    visits: [{ id: "v1", state: "scheduled", scheduled_for: "2026-10-23T01:00:00Z", worker_name: "Ana", arranged_at: "2026-10-23T02:00:00Z" },
             { id: "v2", state: "scheduled", scheduled_for: "2026-10-26T01:00:00Z", worker_name: "Ana" }] },
  { ...base, id: "IA-0005", alias: "E", due_at: "2026-10-22T00:00:00Z", request_state: "acknowledged",
    visits: [{ id: "v1", state: "completed", scheduled_for: "2026-10-23T01:00:00Z", worker_name: "Ana" }] },
];

test("each group lists only the matching saved records", () => {
  const ids = Object.fromEntries(groupOverview(cases, now).map((g) => [g.key, g.items.map((c) => c.id)]));
  assert.deepEqual(ids, { unassigned: ["IA-0001"], pending: ["IA-0002"], visits: ["IA-0003"], requests: ["IA-0003"] });
});

test("arranged, future and completed visits do not need an update", () => {
  const visits = groupOverview(cases, now).find((g) => g.key === "visits");
  assert.equal(visits.items.some((c) => c.id === "IA-0004" || c.id === "IA-0005"), false);
});

test("detail lines name the station, worker or request time without inventing values", () => {
  const groups = groupOverview(cases, now);
  assert.equal(groups[0].detail(cases[0], now), "Caritan Norte · no coordinating station");
  assert.equal(groups[1].detail(cases[1], now), "Tanza BHS · Ana has not accepted");
  assert.match(groups[3].detail(cases[2], now), /request time not recorded/);
});
