import { TANZA, LINAO } from "@/lib/demoGeography";

// Reference POIs from data/geography/pilot_v2/stations.csv, not verified entrances.
export const VISIT_STATIONS = [
  { name: TANZA, area: "Tanza · Tuguegarao City", category: "Barangay health station", lat: 17.6274872, lon: 121.7365289, approximate: false },
  { name: LINAO, area: "Linao West · Tuguegarao City", category: "Barangay health station", lat: 17.6502689, lon: 121.7169282, approximate: true },
];

export function normalizeVisitLocation({ location_type = "home", station_name } = {}) {
  if (location_type !== "home" && location_type !== "station") throw new Error("Choose a home visit or station check-up.");
  if (location_type === "home") return { location_type, station_name: null };
  if (!VISIT_STATIONS.some((s) => s.name === station_name)) throw new Error("Choose an available demo station.");
  return { location_type, station_name };
}

export function visitTypeLabel(visit) {
  return visit.location_type === "station" ? "Station check-up" : "Home visit";
}

export function visitDestination(visit) {
  return visit.location_type === "station" ? visit.station_name || "Station not recorded" : "Your home";
}

// Resolve only a visit belonging to the mother's scoped case. Never accept
// coordinates or an arbitrary destination from the query string.
export function stationForVisit(caseData, visitId) {
  const visit = caseData.visits?.find((v) => v.id === visitId);
  if (!visit || visit.location_type !== "station") return null;
  return VISIT_STATIONS.find((s) => s.name === visit.station_name) ?? null;
}
