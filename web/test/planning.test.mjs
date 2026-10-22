// Coordinator planning helpers: formatting never invents a value, and the
// difference axis always covers every shown range. Run with `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  COMPARISONS,
  DEFAULT_SCENARIO,
  differenceLimit,
  findScenario,
  groupScenarios,
  pct,
  pp,
  minutes,
  clock,
} from "../src/lib/planning.js";

const results = JSON.parse(readFileSync(new URL("../src/data/planning_v1.json", import.meta.url), "utf8"));

test("missing values read as Unavailable, never zero", () => {
  assert.equal(pct(null), "Unavailable");
  assert.equal(pp(null), "Unavailable");
  assert.equal(minutes(null), "Unavailable");
  assert.equal(pct(0), "0.0%");
});

test("paired differences carry an explicit sign", () => {
  assert.equal(pp(7.290511), "+7.29 pp");
  assert.equal(pp(-0.99), "−0.99 pp");
  assert.equal(pp(0.001), "0.00 pp");
});

test("shift minutes format as a 24-hour clock", () => {
  assert.equal(clock(540), "09:00");
  assert.equal(clock(780), "13:00");
});

test("the default scenario exists and an unknown ID is not substituted", () => {
  assert.equal(findScenario(results, DEFAULT_SCENARIO).label, "8 cases/day · Base assumptions");
  assert.equal(findScenario(results, "demand_9_base"), null);
});

test("the selector keeps every scenario once, in exported order", () => {
  const ids = groupScenarios(results.scenarios).flatMap((g) => g.scenarios.map((s) => s.id));
  assert.equal(ids.length, results.scenarios.length);
  assert.deepEqual([...ids].sort(), results.scenarios.map((s) => s.id).sort());
});

test("the difference axis covers every range in every scenario", () => {
  for (const s of results.scenarios) {
    const rows = COMPARISONS.map((c) => s.comparisons[c.key]);
    const limit = differenceLimit(rows);
    assert.ok(limit >= 5 && limit % 5 === 0, s.id);
    for (const r of rows) {
      for (const v of [r.mean, r.lo, r.hi]) if (v != null) assert.ok(Math.abs(v) <= limit, `${s.id} ${v}`);
    }
  }
});

test("the published base finding is what the view shows", () => {
  const s = findScenario(results, "demand_8_base");
  assert.equal(pct(s.policies.A.on_time_rate.mean), "46.0%");
  assert.equal(pp(s.comparisons.C_minus_B.mean), "+7.29 pp");
  assert.equal(s.comparisons.C_minus_B.worse, 0.08);
});
