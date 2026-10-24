import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { TANZA, LINAO } from "../src/lib/demoGeography.js";

const storage = new Map();
globalThis.window = { localStorage: {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
} };
const hospital = await import("../src/lib/data/mock.js?assignment-hospital");
const bhw = await import("../src/lib/data/mock.js?assignment-bhw");
beforeEach(async () => { storage.clear(); await hospital.resetDemoData(); });

test("facilitator assignment persists worker and station, without accepting or scheduling", async () => {
  const before = Date.now();
  const saved = await hospital.assignCase("IA-0047", { worker_id: "bea" });
  assert.equal(saved.assigned_worker, "Bea");
  assert.equal(saved.station_name, LINAO);
  assert.equal(saved.handoff_state, "pending");
  assert.equal(saved.owner_worker, null);
  assert.equal(saved.acknowledged_at, null);
  assert.equal(saved.visits.length, 0);
  assert.ok(Date.parse(saved.assigned_at) >= before && Date.parse(saved.assigned_at) <= Date.now());
  assert.equal(saved.events.at(-1).actor, "Facility staff");
  assert.equal(saved.events.at(-1).type, "case_assigned");
  assert.equal(saved.events.at(-1).at, saved.assigned_at);
  const inbox = await bhw.listStationCases(LINAO);
  assert.equal(inbox.find((c) => c.id === saved.id).assigned_worker, "Bea");
  assert.equal((await bhw.listStationCases(TANZA)).some((c) => c.id === saved.id), false);
  const reloaded = await import(`../src/lib/data/mock.js?reload-${Date.now()}`);
  assert.equal((await reloaded.getCaseById(saved.id)).assigned_worker, "Bea");
  await assert.rejects(bhw.acknowledgeCase(saved.id, { worker_name: "Ana" }), /another station/);
  const accepted = await bhw.acknowledgeCase(saved.id, { worker_name: "Bea" });
  assert.equal(accepted.owner_worker, "Bea");
  assert.equal(accepted.handoff_state, "acknowledged");
});

test("duplicate assignment is harmless and existing station/owner cannot be overwritten", async () => {
  await hospital.assignCase("IA-0047", { worker_id: "ana" });
  const duplicate = await hospital.assignCase("IA-0047", { worker_id: "ana" });
  assert.equal(duplicate.events.filter((e) => e.type === "case_assigned").length, 1);
  await assert.rejects(hospital.assignCase("IA-0047", { worker_id: "bea" }), /already assigned/);
  await bhw.acknowledgeCase("IA-0047", { worker_name: "Ana" });
  await assert.rejects(hospital.assignCase("IA-0047", { worker_id: "bea" }), /already assigned/);
  await assert.rejects(hospital.assignCase("IA-0042", { worker_id: "bea" }), /already assigned/);
  assert.equal((await bhw.getCaseById("IA-0047")).owner_worker, "Ana");
});

test("invalid workers and missing cases leave unassigned records unchanged", async () => {
  for (const worker_id of ["", "unknown", "constructor", null]) {
    await assert.rejects(hospital.assignCase("IA-0047", { worker_id }), /available BHW/);
  }
  await assert.rejects(hospital.assignCase("IA-9999", { worker_id: "ana" }), /Unknown case/);
  const record = await hospital.getCaseById("IA-0047");
  assert.equal(record.station_name, null);
  assert.equal(record.handoff_state, "unassigned");
  assert.equal(record.events.length, 0);
  const workers = await hospital.listAssignableWorkers();
  workers[0].name = "Changed";
  assert.equal((await hospital.listAssignableWorkers())[0].name, "Ana");
});

test("competing facilitator assignments preserve a single worker and audit event", async () => {
  const results = await Promise.allSettled([
    hospital.assignCase("IA-0047", { worker_id: "ana" }),
    bhw.assignCase("IA-0047", { worker_id: "bea" }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.filter((r) => r.status === "rejected").length, 1);
  const record = await hospital.getCaseById("IA-0047");
  assert.equal(record.events.filter((e) => e.type === "case_assigned").length, 1);
  assert.equal(record.station_name, record.assigned_worker === "Ana" ? TANZA : LINAO);
});

test("all seeded pending station cases name the supported BHW without accepting", async () => {
  const records = await hospital.listCases();
  for (const c of records.filter((c) => c.handoff_state === "pending")) {
    assert.equal(c.assigned_worker, c.station_name === TANZA ? "Ana" : "Bea");
    assert.equal(c.owner_worker, null);
    assert.equal(c.acknowledged_at, null);
  }
  assert.equal(records.find((c) => c.id === "IA-0047").assigned_worker, null);
});

test("older stored station-only cases gain a worker once, preserving explicit assignments and owners", async () => {
  const key = "inaalaga-mock-store-v2";
  const saved = JSON.parse(storage.get(key));
  saved.cases["ia-0042"].assigned_worker = null;
  delete saved.cases["ia-0044"].assigned_worker;
  saved.cases["ia-0043"].assigned_worker = "Explicit worker";
  saved.cases["ia-0045"].handoff_state = "acknowledged";
  saved.cases["ia-0045"].owner_worker = "Existing owner";
  saved.cases["ia-0045"].assigned_worker = null;
  const priorStationTime = saved.cases["ia-0042"].assigned_at;
  storage.set(key, JSON.stringify(saved));
  const before = Date.now();
  const first = await hospital.getCaseById("IA-0042");
  assert.equal(first.assigned_worker, "Ana");
  assert.equal(first.assigned_at, priorStationTime);
  assert.equal(first.handoff_state, "pending");
  assert.ok(Date.parse(first.events.at(-1).at) >= before);
  assert.equal((await bhw.getCaseById("IA-0044")).assigned_worker, "Bea");
  assert.equal((await bhw.getCaseById("IA-0043")).assigned_worker, "Explicit worker");
  assert.equal((await bhw.getCaseById("IA-0045")).owner_worker, "Existing owner");
  const again = await hospital.getCaseById("IA-0042");
  assert.equal(again.events.filter((e) => e.type === "case_assigned").length, 1);
  assert.equal(JSON.parse(storage.get(key)).cases["ia-0042"].assigned_worker, "Ana");
});

test("new station-routed discharges include the pending BHW assignment", async () => {
  const saved = await hospital.createDischarge({
    alias: "Worker assignment check", barangay: "Linao West",
    birth_at: "2026-10-18T09:00:00+08:00", discharge_at: "2026-10-19T09:00:00+08:00",
    due_at: "2026-10-21T09:00:00+08:00", idempotency_key: "default-bhw-check",
  });
  assert.equal(saved.case.assigned_worker, "Bea");
  assert.equal(saved.case.handoff_state, "pending");
  assert.equal(saved.case.owner_worker, null);
  assert.equal((await bhw.getCaseById(saved.case.id)).assigned_worker, "Bea");
});
