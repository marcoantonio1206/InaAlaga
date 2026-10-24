import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { assertFutureVisit, earliestVisitTime, visitNeedsUpdate, followupOverdueLabel, hasUnarrangedOverdue } from "../src/lib/visitTiming.js";
import { bhwState } from "../src/lib/bhwStatus.js";
import { getStatus } from "../src/lib/status.js";

const storage = new Map();
globalThis.window = { localStorage: {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
} };
const bhw = await import("../src/lib/data/mock.js?timing-bhw");
const facilitator = await import("../src/lib/data/mock.js?timing-hospital");
const instant = "2026-10-24T11:59:30.000Z";
const future = "2026-10-24T20:00:00+08:00";
beforeEach(async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse(instant) });
  storage.clear();
  await bhw.resetDemoData();
  await bhw.acknowledgeCase("IA-0042", { worker_name: "Ana" });
});

test("scheduling uses the real instant, including Philippine time and the minute boundary", async () => {
  assert.throws(() => assertFutureVisit("2026-10-24T19:59:00+08:00", instant), /future/);
  assert.throws(() => assertFutureVisit("2026-10-24T19:59:30+08:00", instant), /future/);
  assert.throws(() => assertFutureVisit("2026-10-24T20:00", instant), /time zone/);
  assert.throws(() => assertFutureVisit("invalid", instant), /valid/);
  assert.doesNotThrow(() => assertFutureVisit(future, instant));
  assert.equal(earliestVisitTime(instant), "2026-10-24T12:00:00.000Z");
  for (const scheduled_for of ["2026-10-24T19:59:00+08:00", "2026-10-20T09:00:00+08:00"]) {
    await assert.rejects(bhw.scheduleVisit("IA-0042", { scheduled_for, worker_name: "Ana" }), /future/);
  }
  assert.equal((await facilitator.getCaseById("IA-0042")).visits.length, 0);
  await bhw.scheduleVisit("IA-0042", { scheduled_for: future, worker_name: "Ana" });
  assert.equal((await facilitator.getCaseById("IA-0042")).visits[0].scheduled_for, future);
});

test("an arrangement persists, clears current warnings and never completes or reschedules a visit", async (t) => {
  await bhw.scheduleVisit("IA-0042", { scheduled_for: future, worker_name: "Ana" });
  t.mock.timers.tick(60000);
  const before = await facilitator.getCaseById("IA-0042");
  assert.equal(bhwState(before, new Date().toISOString()), "update_needed");
  const saved = await bhw.arrangeOverdue("IA-0042", { worker_name: "Ana" });
  const now = new Date().toISOString();
  assert.equal(saved.visits[0].state, "scheduled");
  assert.equal(saved.visits[0].scheduled_for, future);
  assert.equal(saved.visits[0].arranged_at, now);
  assert.equal(saved.visits[0].arranged_by, "Ana");
  assert.equal(saved.visits[0].ended_at, undefined);
  assert.equal(saved.overdue_arranged_at, now);
  assert.equal(visitNeedsUpdate(saved.visits[0], now), false);
  assert.equal(followupOverdueLabel(saved, now), null);
  assert.equal(hasUnarrangedOverdue(saved, now), false);
  assert.equal(bhwState(saved, now), "arranged");
  assert.equal(getStatus(saved, now), "scheduled");
  const reread = await facilitator.getCaseById(saved.id);
  assert.equal(reread.visits[0].arranged_at, now);
  const again = await bhw.arrangeOverdue(saved.id, { worker_name: "Ana" });
  assert.equal(again.events.filter((e) => e.type === "followup_arranged").length, 1);
  await assert.rejects(bhw.arrangeOverdue(saved.id, { worker_name: "Bea" }), /responsible BHW/);
});

test("later visits can become overdue after an earlier arrangement", async (t) => {
  await bhw.scheduleVisit("IA-0042", { scheduled_for: future, worker_name: "Ana" });
  await bhw.scheduleVisit("IA-0042", { scheduled_for: "2026-10-24T21:00:00+08:00", worker_name: "Ana" });
  t.mock.timers.tick(60000);
  const first = await bhw.arrangeOverdue("IA-0042", { worker_name: "Ana" });
  assert.equal(first.visits[1].arranged_at, undefined);
  t.mock.timers.tick(3600000);
  const now = new Date().toISOString();
  const later = await facilitator.getCaseById("IA-0042");
  assert.equal(hasUnarrangedOverdue(later, now), true);
  assert.equal(bhwState(later, now), "update_needed");
  const resolved = await bhw.arrangeOverdue("IA-0042", { worker_name: "Ana" });
  assert.equal(resolved.visits[1].arranged_at, now);
  assert.equal(resolved.visits[0].arranged_at, first.visits[0].arranged_at);
  assert.equal(resolved.events.filter((e) => e.type === "followup_arranged").length, 2);
});

test("arranging an overdue target never marks an upcoming visit arranged", async () => {
  await bhw.scheduleVisit("IA-0042", { scheduled_for: future, worker_name: "Ana" });
  const saved = await bhw.arrangeOverdue("IA-0042", { worker_name: "Ana" });
  assert.ok(saved.overdue_arranged_at);
  assert.equal(saved.visits[0].arranged_at, undefined);
});
