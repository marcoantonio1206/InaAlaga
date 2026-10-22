// Coordinator planning: CSV reading, scenario matching and wording rules,
// checked against the real web/public/scenario_summary.csv. Run with `npm test`.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCsv } from "../src/lib/csv.js";
import { DEFAULTS, FILTERS, deadlineAddsLittle, matchScenario, optionFor, pct, signed } from "../src/lib/planning.js";

const csvText = readFileSync(new URL("../public/scenario_summary.csv", import.meta.url), "utf8");
let rows;

before(async () => {
  // The data layer fetches /scenario_summary.csv; serve the real file.
  globalThis.fetch = async (url) => {
    assert.equal(url, "/scenario_summary.csv");
    return new Response(csvText);
  };
  const { getScenarioSummary } = await import("../src/lib/data/planning.js");
  rows = await getScenarioSummary();
});

test("parser handles quotes, doubled quotes, CRLF and a trailing newline", () => {
  const out = parseCsv('a,b,c\r\n"x, y","say ""hi""",3\r\n');
  assert.deepEqual(out, [{ a: "x, y", b: 'say "hi"', c: "3" }]);
  assert.deepEqual(parseCsv("a\n1\n2"), [{ a: "1" }, { a: "2" }]);
});

test("the summary loads all 162 settings with numeric columns", () => {
  assert.equal(rows.length, 162);
  assert.equal(typeof rows[0].demand_per_day, "number");
  assert.equal(typeof rows[0].A_on_time_rate_mean, "number");
  assert.equal(typeof rows[0].reference_delay_hours, "string");
});

test("defaults select the 8/day, 1 worker, 30 min, ×1, 12–48 h row", () => {
  assert.equal(matchScenario(rows, DEFAULTS).scenario_id, "d8_w1_s30_t1_h12-48");
});

test("every selector combination matches exactly one row", () => {
  const combos = FILTERS.reduce((acc, f) => acc.flatMap((c) => f.options.map((o) => ({ ...c, [f.key]: o }))), [{}]);
  assert.equal(combos.length, 162);
  for (const c of combos) {
    assert.equal(rows.filter((r) => FILTERS.every((f) => r[f.key] === c[f.key])).length, 1, JSON.stringify(c));
  }
});

test("an unknown combination has no match", () => {
  assert.equal(matchScenario(rows, { ...DEFAULTS, demand_per_day: 9 }), null);
});

test("select strings map back to option types", () => {
  const travel = FILTERS.find((f) => f.key === "travel_multiplier");
  assert.equal(optionFor(travel, "0.5"), 0.5);
  const delay = FILTERS.find((f) => f.key === "reference_delay_hours");
  assert.equal(optionFor(delay, "24-72"), "24-72");
});

test("the 'adds little' sentence appears at or below 0.5 pp", () => {
  assert.equal(deadlineAddsLittle({ C_minus_B_mean_pp: 0.5 }), true);
  assert.equal(deadlineAddsLittle({ C_minus_B_mean_pp: -1.2 }), true);
  assert.equal(deadlineAddsLittle({ C_minus_B_mean_pp: 0.51 }), false);
  assert.equal(deadlineAddsLittle({ C_minus_B_mean_pp: null }), false);
});

test("formatting: percentages and signed points, missing values never shown as zero", () => {
  assert.equal(pct(0.8932), "89.3%");
  assert.equal(pct(null), "Unavailable");
  assert.equal(signed(7.29), "+7.3");
  assert.equal(signed(-3.46), "−3.5");
  assert.equal(signed(0.01), "0.0");
});
