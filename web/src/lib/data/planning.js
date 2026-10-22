import results from "@/data/planning_v1.json";

// Precomputed simulation output, exported by `python3 -m simulation.export_planning`.
// Read the same way in mock and Supabase modes: planning numbers never come
// from demo records (PRD D01), so this is not part of the mock/supabase switch.
export async function getPlanningResults() {
  return structuredClone(results);
}
