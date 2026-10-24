import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { TANZA, LINAO } from "../src/lib/demoGeography.js";
import { normalizeVisitLocation, stationForVisit } from "../src/lib/visitLocation.js";
import { getStatus, getCardVisit } from "../src/lib/status.js";
import { bhwState, visitLine } from "../src/lib/bhwStatus.js";
import { visitSummary } from "../src/lib/hospitalStatus.js";
import { visitCountdown } from "../src/lib/countdown.js";
import { groupVisits } from "../src/lib/visits.js";

const storage = new Map();
globalThis.window = { localStorage: {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
} };
const worker = await import("../src/lib/data/mock.js?worker-tab");
const mother = await import("../src/lib/data/mock.js?mother-tab");
const schedule = { scheduled_for: "2026-10-20T09:00:00+08:00", worker_name: "Ana" };

beforeEach(async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-10-19T04:00:00Z") });
  storage.clear();
  await worker.resetDemoData();
  await worker.acknowledgeCase("IA-0042", { worker_name: "Ana" });
});

test("station destination persists across tabs without changing case assignment", async () => {
  await worker.scheduleVisit("IA-0042", { ...schedule, location_type: "station", station_name: LINAO });
  const c = await mother.getCaseByToken(mother.getDemoMotherToken());
  assert.equal(c.station_name, TANZA);
  assert.equal(c.visits[0].station_name, LINAO);
  assert.equal(c.visits[0].location_type, "station");
  assert.equal(stationForVisit(c, c.visits[0].id).lat, 17.6502689);
  assert.match(c.events.at(-1).detail ?? JSON.stringify(c.events.at(-1)), /Station check-up/);
  assert.equal(stationForVisit(c, "another-cases-visit"), null);
});

test("existing home scheduling remains compatible and clears station destination", async () => {
  const c = await worker.scheduleVisit("IA-0042", { ...schedule, station_name: LINAO });
  assert.equal(c.visits[0].location_type, "home");
  assert.equal(c.visits[0].station_name, null);
  assert.equal(stationForVisit(c, c.visits[0].id), null);
});

test("invalid stations, visit types and dates do not save a visit", async () => {
  for (const change of [
    { location_type: "station" },
    { location_type: "station", station_name: "Unknown station" },
    { location_type: "hospital" },
    { scheduled_for: "invalid date" },
  ]) await assert.rejects(worker.scheduleVisit("IA-0042", { ...schedule, ...change }));
  assert.equal((await worker.getCaseById("IA-0042")).visits.length, 0);
  assert.throws(() => normalizeVisitLocation({ location_type: "station", station_name: "constructor" }));
});

test("a second visit can be scheduled after completion and becomes the active visit everywhere", async () => {
  const first = await worker.scheduleVisit("IA-0042", schedule);
  await worker.recordVisitOutcome("IA-0042", first.visits[0].id, {
    started_at: schedule.scheduled_for, ended_at: "2026-10-20T09:30:00+08:00", outcome: "completed",
  });
  const completed = await mother.getCaseByToken(mother.getDemoMotherToken());
  assert.equal(getCardVisit(completed, getStatus(completed, worker.getDemoNow())), null);
  const next = await worker.scheduleVisit("IA-0042", {
    ...schedule, scheduled_for: "2026-10-21T09:00:00+08:00", location_type: "station", station_name: TANZA,
  });
  assert.equal(next.visits.length, 2);
  assert.equal(next.visits[0].state, "completed");
  assert.equal(getStatus(next, worker.getDemoNow()), "scheduled");
  assert.equal(bhwState(next, worker.getDemoNow()), "scheduled");
  assert.equal(getCardVisit(next, "scheduled").id, "v2");
  assert.match(visitLine(next), /Station check-up/);
  assert.match(visitSummary(next), /Scheduled/);
  await assert.rejects(worker.scheduleVisit("IA-0042", schedule), /already scheduled/);
});

test("acknowledged requests can be repeated without duplicating an open request or losing history", async () => {
  const token = mother.getDemoMotherToken();
  await mother.createContactRequest(token);
  await worker.acknowledgeRequest("IA-0042", { worker_name: "Ana" });
  const next = await mother.createContactRequest(token);
  assert.equal(next.request_state, "recorded");
  assert.equal(next.request_acknowledged_by, null);
  assert.equal(next.request_acknowledged_at, null);
  assert.equal(next.events.filter((e) => e.type === "request_recorded").length, 2);
  assert.equal(next.events.filter((e) => e.type === "request_acknowledged").length, 1);
  await mother.createContactRequest(token);
  assert.equal((await worker.getCaseById("IA-0042")).events.filter((e) => e.type === "request_recorded").length, 2);
  assert.equal((await worker.acknowledgeRequest("IA-0042", { worker_name: "Ana" })).request_state, "acknowledged");
});

test("countdown ticks through day boundaries and never becomes negative", () => {
  assert.equal(visitCountdown("2026-10-20T09:00:00+08:00", "2026-10-19T12:00:00+08:00").text, "21h 00m 00s");
  assert.equal(visitCountdown("2026-10-20T09:00:00+08:00", "2026-10-19T12:00:01+08:00").text, "20h 59m 59s");
  assert.equal(visitCountdown("2026-10-21T09:00:00+08:00", "2026-10-19T12:00:00+08:00").text, "1d 21h 00m 00s");
  assert.equal(visitCountdown("2026-10-19T12:00:00+08:00", "2026-10-19T12:00:00+08:00").passed, true);
  assert.equal(visitCountdown("2026-10-18T12:00:00+08:00", "2026-10-19T12:00:00+08:00").text, "Awaiting visit update");
  assert.equal(visitCountdown("invalid", "2026-10-19T12:00:00+08:00"), null);
});

test("multiple upcoming visits sort by appointment time, not creation order, and promote after completion", async () => {
  await worker.scheduleVisit("IA-0042", { ...schedule, scheduled_for: "2026-10-24T09:00:00+08:00" });
  await worker.scheduleVisit("IA-0042", { ...schedule, scheduled_for: "2026-10-22T09:00:00+08:00", location_type: "station", station_name: TANZA });
  await worker.scheduleVisit("IA-0042", { ...schedule, scheduled_for: "2026-10-26T09:00:00+08:00" });
  let c = await mother.getCaseByToken(mother.getDemoMotherToken());
  assert.equal(groupVisits(c.visits).next.id, "v2");
  assert.deepEqual(groupVisits(c.visits).future.map((v) => v.id), ["v1", "v3"]);
  assert.equal(getCardVisit(c, "scheduled").id, "v2");
  assert.match(visitLine(c), /Station check-up/);
  await worker.recordVisitOutcome("IA-0042", "v2", { started_at: "2026-10-22T09:00:00+08:00", ended_at: "2026-10-22T09:30:00+08:00", outcome: "completed" });
  c = await mother.getCaseByToken(mother.getDemoMotherToken());
  assert.equal(groupVisits(c.visits).next.id, "v1");
  assert.deepEqual(groupVisits(c.visits).future.map((v) => v.id), ["v3"]);
  assert.equal(groupVisits(c.visits).previous[0].id, "v2");
  assert.equal(getCardVisit(c, "scheduled").id, "v1");
  assert.equal(bhwState(c, worker.getDemoNow()), "scheduled");
});

test("duplicate mother or worker start times are rejected without blocking different times", async () => {
  await worker.acknowledgeCase("IA-0043", { worker_name: "Ana" });
  await worker.scheduleVisit("IA-0042", schedule);
  await assert.rejects(worker.scheduleVisit("IA-0042", { ...schedule, scheduled_for: "2026-10-20T01:00:00Z" }), /mother at that time/);
  await assert.rejects(worker.scheduleVisit("IA-0043", schedule), /worker already/);
  const saved = await worker.scheduleVisit("IA-0043", { ...schedule, scheduled_for: "2026-10-20T10:00:00+08:00" });
  assert.equal(saved.visits.length, 1);
});

test("a passed appointment stays next until its outcome is recorded", () => {
  const visits = [
    { id: "later", state: "scheduled", scheduled_for: "2026-10-26T09:00:00+08:00" },
    { id: "pending-update", state: "scheduled", scheduled_for: "2026-10-18T09:00:00+08:00" },
    { id: "done", state: "completed", scheduled_for: "2026-10-17T09:00:00+08:00" },
  ];
  const before = JSON.stringify(visits);
  assert.equal(groupVisits(visits).next.id, "pending-update");
  assert.equal(groupVisits(visits).future[0].id, "later");
  assert.equal(groupVisits(visits).previous.length, 1);
  assert.equal(JSON.stringify(visits), before);
  assert.equal(groupVisits([]).next, null);
});
