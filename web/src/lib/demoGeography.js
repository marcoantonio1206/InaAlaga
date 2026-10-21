export const TANZA = "Tanza BHS (demo station)";
export const LINAO = "Linao West BHS (demo station)";
export const OTHER_BARANGAY = "Other barangay (outside demo area)";

export const BARANGAYS = [
  { name: "Caritan Norte", station: TANZA },
  { name: "Libag Sur", station: TANZA },
  { name: "Linao West", station: LINAO },
  { name: "Atulayan Norte", station: LINAO },
  { name: "Pallua Sur", station: LINAO },
];

export function lookupStation(barangay) {
  const found = BARANGAYS.find((b) => b.name === barangay);
  return found ? found.station : null;
}