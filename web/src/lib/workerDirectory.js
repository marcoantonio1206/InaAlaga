import { TANZA, LINAO } from "@/lib/demoGeography";

// The workers available in the role switcher and facilitator assignment flow.
export const WORKERS = [
  { id: "ana", name: "Ana", station: TANZA, short: "Tanza BHS" },
  { id: "bea", name: "Bea", station: LINAO, short: "Linao West BHS" },
];

// Assign automatically only where the supported station has one clear worker.
export function defaultWorkerForStation(station) {
  const matches = WORKERS.filter((w) => w.station === station);
  return matches.length === 1 ? matches[0] : null;
}
