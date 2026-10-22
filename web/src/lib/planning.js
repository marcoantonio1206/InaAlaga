// Labels and formatting for the coordinator planning view. Values come from
// the exported simulation slice; nothing here recomputes a result.

export const DEFAULT_SCENARIO = "demand_8_base";

export const POLICIES = [
  { key: "A", name: "A · Reference workflow", detail: "Assumed delayed handoff · first received, first served" },
  { key: "B", name: "B · Faster handoff", detail: "Shorter handoff · first received, first served" },
  { key: "C", name: "C · Faster handoff + deadlines", detail: "Shorter handoff · earliest target first" },
  { key: "D", name: "D · Reference + deadlines", detail: "Delayed handoff · earliest target first · diagnostic" },
];

export const COMPARISONS = [
  { key: "B_minus_A", name: "B − A", detail: "Faster handoff, same arrival-order queue" },
  { key: "C_minus_B", name: "C − B", detail: "Deadline order, same faster handoff" },
  { key: "C_minus_A", name: "C − A", detail: "Both changes together" },
  { key: "D_minus_A", name: "D − A", detail: "Deadline order with the reference handoff" },
  { key: "C_minus_D", name: "C − D", detail: "Faster handoff, both in deadline order" },
];

export function findScenario(results, id) {
  return results.scenarios.find((s) => s.id === id) ?? null;
}

// Group scenarios for the selector, keeping the exported order.
export function groupScenarios(scenarios) {
  const groups = [];
  scenarios.forEach((s) => {
    const g = groups.find((x) => x.name === s.group);
    if (g) g.scenarios.push(s);
    else groups.push({ name: s.group, scenarios: [s] });
  });
  return groups;
}

export function pct(value) {
  return value == null ? "Unavailable" : `${(value * 100).toFixed(1)}%`;
}

export function share(value) {
  return value == null ? "Unavailable" : `${Math.round(value * 100)}%`;
}

export function pp(value) {
  if (value == null) return "Unavailable";
  const rounded = Number(value.toFixed(2));
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${Math.abs(rounded).toFixed(2)} pp`;
}

export function minutes(value) {
  return value == null ? "Unavailable" : `${Math.round(value)} min`;
}

export function clock(minuteOfDay) {
  const h = String(Math.floor(minuteOfDay / 60)).padStart(2, "0");
  const m = String(minuteOfDay % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// Symmetric axis limit for paired differences: covers every shown range,
// rounded up to a multiple of 5 pp, never below 5.
export function differenceLimit(rows) {
  const extent = Math.max(
    0,
    ...rows.flatMap((r) => [r.mean, r.lo, r.hi]).filter((v) => v != null).map(Math.abs)
  );
  return Math.max(5, Math.ceil(extent / 5) * 5);
}
