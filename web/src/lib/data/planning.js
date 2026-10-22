import { parseCsv } from "@/lib/csv";

// Precomputed factorial simulation results, served as a static file copied
// from simulation/results/factorial_v1/scenario_summary.csv. Read the same way
// in mock and Supabase modes: planning numbers never come from demo records
// (PRD D01), so this is not part of the mock/supabase switch.
const TEXT_COLUMNS = new Set(["scenario_id", "reference_delay_hours"]);

export async function getScenarioSummary() {
  const res = await fetch("/scenario_summary.csv");
  if (!res.ok) throw new Error(`Scenario summary unavailable (${res.status})`);
  return parseCsv(await res.text()).map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, TEXT_COLUMNS.has(k) ? v : v === "" ? null : Number(v)])
    )
  );
}
