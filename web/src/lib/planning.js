// Selector options, labels and formatting for the coordinator planning view.
// Values come from the factorial scenario summary; nothing here recomputes a result.

export const FILTERS = [
  { key: "demand_per_day", label: "Demand per day", options: [4, 8, 12], format: (v) => `${v} cases` },
  { key: "workers_per_station", label: "Workers per station", options: [1, 2], format: (v) => `${v}` },
  { key: "service_minutes", label: "Service minutes", options: [15, 30, 60], format: (v) => `${v} min` },
  { key: "travel_multiplier", label: "Travel multiplier", options: [0.5, 1, 2], format: (v) => `×${v}` },
  {
    key: "reference_delay_hours",
    label: "Reference handoff delay",
    options: ["6-24", "12-48", "24-72"],
    format: (v) => `${v.replace("-", "–")} h`,
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
  { key: "A", label: "A Reference workflow" },
  { key: "B", label: "B Faster handoff" },
  { key: "C", label: "C Faster handoff + earliest deadline first" },
  { key: "D", label: "D Reference delay + earliest deadline first" },
];

// At or below this mean C−B gain, deadline ordering is described as adding little.
export const LITTLE_GAIN_PP = 0.5;

// <select> values are strings; map back to the option's own type.
export function optionFor(filter, value) {
  return filter.options.find((o) => String(o) === value);
}

export function matchScenario(rows, selected) {
  return rows.find((r) => FILTERS.every((f) => r[f.key] === selected[f.key])) ?? null;
}

export function deadlineAddsLittle(row) {
  return row.C_minus_B_mean_pp != null && row.C_minus_B_mean_pp <= LITTLE_GAIN_PP;
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
