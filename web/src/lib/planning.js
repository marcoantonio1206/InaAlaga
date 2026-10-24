// Selector options, labels and formatting for the coordinator planning view.
// Values come from the factorial scenario summary; nothing here recomputes a result.

export const FILTERS = [
  {
    key: "demand_per_day",
    label: "Demand (whole pilot)",
    options: [4, 8, 12],
    format: (v) => `${v} per day`,
    describe: (v) => `${v} new cases per day across all five pilot barangays combined`,
  },
  {
    key: "workers_per_station",
    label: "Workers per station",
    options: [1, 2],
    format: (v) => `${v}`,
    describe: (v) => `${v} worker${v === 1 ? "" : "s"} at each of the two stations`,
  },
  {
    key: "service_minutes",
    label: "Visit length",
    options: [15, 30, 60],
    format: (v) => `${v} min`,
    describe: (v) => `${v} minutes per home visit, plus travel both ways`,
  },
  {
    key: "travel_multiplier",
    label: "Travel time",
    options: [0.5, 1, 2],
    format: (v) => (v === 1 ? "×1 (baseline)" : v < 1 ? `×${v} (faster)` : `×${v} (slower)`),
    describe: (v) => `Approximate travel times ×${v} (straight-line estimates, not measured journeys)`,
  },
  {
    key: "reference_delay_hours",
    label: "Reference delay (A, D)",
    options: ["6-24", "12-48", "24-72"],
    format: (v) => `${v.replace("-", "–")} h`,
    describe: (v) => `Reference workflow (A, D): ${v.replace("-", "–")} hours from discharge until the station receives the case`,
  },
];

export const DEFAULTS = {
  demand_per_day: 8,
  workers_per_station: 1,
  service_minutes: 30,
  travel_multiplier: 1,
  reference_delay_hours: "12-48",
};

export const POLICIES = [
  { key: "A", name: "Reference workflow", short: "Reference workflow" },
  { key: "B", name: "Faster handoff", short: "Faster handoff" },
  { key: "C", name: "Faster handoff + earliest deadline first", short: "Faster handoff + deadline ordering" },
  { key: "D", name: "Reference delay + earliest deadline first", short: "Reference delay + deadline ordering" },
].map((p) => ({ ...p, label: `${p.key} ${p.name}` }));

// Comparisons in the order they are explained. `key` is the CSV column prefix.
export const COMPARISONS = [
  { key: "B_minus_A", label: "B vs A", question: "Effect of faster handoff (same first-come ordering)", primary: true },
  { key: "C_minus_B", label: "C vs B", question: "Effect of deadline ordering (same faster handoff)", primary: true },
  { key: "C_minus_A", label: "C vs A", question: "Both changes together" },
  { key: "D_minus_A", label: "D vs A", question: "Deadline ordering with the reference delay" },
  { key: "C_minus_D", label: "C vs D", question: "Faster handoff with deadline ordering" },
];

// Settings that hold in every scenario (simulation/reports/factorial_v1/FINDINGS.md).
export const FIXED_ASSUMPTIONS = [
  "Faster handoff (B, C): 0–6 hours from discharge until the station receives the case",
  "Follow-up targets: 24, 48 or 72 hours after discharge, in equal shares",
  "Shifts 09:00–13:00 every day, including weekends",
  "14 days of new cases, then 7 more days to finish remaining visits",
  "Cases spread equally across five barangays (about 60% Linao West, 40% Tanza)",
  "Every visit that is made reaches the mother; no-shows are not modelled",
];

export const MODEL_VERSION = "1.0.0";
export const RESULTS_VERSION = "factorial_v1";

// Mean differences within ±0.5 pp (rounded to one decimal) are described as
// little difference; anything that rounds below zero is reported as lower.
export const LITTLE_GAIN_PP = 0.5;

// <select> values are strings; map back to the option's own type.
export function optionFor(filter, value) {
  return filter.options.find((o) => String(o) === value);
}

export function matchScenario(rows, selected) {
  return rows.find((r) => FILTERS.every((f) => r[f.key] === selected[f.key])) ?? null;
}

export function isDefault(selected) {
  return FILTERS.every((f) => selected[f.key] === DEFAULTS[f.key]);
}

// "higher" | "little" | "lower" | "tied" | null for one comparison of a row.
export function verdict(row, key) {
  const mean = row[`${key}_mean_pp`];
  if (mean == null) return null;
  if (row[`${key}_fraction_tied`] === 1) return "tied";
  const rounded = Number(mean.toFixed(1));
  if (rounded < 0) return "lower";
  if (rounded > LITTLE_GAIN_PP) return "higher";
  return "little";
}

export const VERDICT_LABEL = {
  higher: { label: "Higher on average", tone: "ok", icon: "check" },
  little: { label: "Little difference", tone: "lilac", icon: "clock" },
  tied: { label: "Same result in every run", tone: "lilac", icon: "check" },
  lower: { label: "Lower on average", tone: "warn", icon: "alert" },
};

// "in 8% of runs"; null when the share is unavailable.
export function runShare(fraction) {
  return fraction == null ? null : `${Math.round(fraction * 100)}%`;
}

function points(value) {
  const n = Math.abs(Number(value.toFixed(1)));
  return `${n.toFixed(1)} percentage ${n === 1 ? "point" : "points"}`;
}

function worseClause(row, key, versus) {
  const share = row[`${key}_fraction_negative`];
  if (share == null || share === 0) return "";
  return ` It was lower than ${versus} in ${runShare(share)} of runs.`;
}

// Plain-language sentences for the two primary comparisons. Never names a
// universal best approach; worse results are stated as such.
export function summarize(row) {
  const out = [];
  const handoff = verdict(row, "B_minus_A");
  const mean = row.B_minus_A_mean_pp;
  if (handoff === "higher") out.push(`Faster handoff increased on-time contact by ${points(mean)} on average.${worseClause(row, "B_minus_A", "the reference workflow")}`);
  else if (handoff === "lower") out.push(`Faster handoff lowered on-time contact by ${points(mean)} on average.${worseClause(row, "B_minus_A", "the reference workflow")}`);
  else if (handoff === "tied") out.push("Faster handoff gave the same result as the reference workflow in every run.");
  else if (handoff === "little") out.push(`Faster handoff made little difference on average (${signed(mean)} points).${worseClause(row, "B_minus_A", "the reference workflow")}`);

  const order = verdict(row, "C_minus_B");
  const gain = row.C_minus_B_mean_pp;
  if (order === "higher") out.push(`Deadline ordering added another ${points(gain)} on average.${worseClause(row, "C_minus_B", "faster handoff alone")}`);
  else if (order === "lower") out.push(`Deadline ordering lowered on-time contact by ${points(gain)} on average compared with faster handoff alone.${worseClause(row, "C_minus_B", "faster handoff alone")}`);
  else if (order === "tied") out.push("Deadline ordering gave the same result as faster handoff alone in every run.");
  else if (order === "little") out.push(`Deadline ordering made little difference on average (${signed(gain)} points).${worseClause(row, "C_minus_B", "faster handoff alone")}`);
  return out;
}

export function pct(value) {
  return value == null ? "Unavailable" : `${(value * 100).toFixed(1)}%`;
}

// One decimal with an explicit sign: "+7.3", "−1.0", "0.0".
export function signed(value) {
  if (value == null) return "Unavailable";
  const rounded = Number(value.toFixed(1));
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${Math.abs(rounded).toFixed(1)}`;
}
