const DEMO_NOW = "2026-10-19T12:00:00+08:00";
import { lookupStation, TANZA, LINAO } from "@/lib/demoGeography";

function makeCase(fields) {
  return {
    handoff_state: "pending",
    request_state: "none",
    visits: [],
    ...fields,
  };
}

const store = {
  "ia-0042": makeCase({
    id: "IA-0042",
    alias: "Maria Santos",
    barangay: "Caritan Norte",
    station_name: TANZA,
    birth_at: "2026-10-18T09:40:00+08:00",
    discharge_at: "2026-10-19T11:15:00+08:00",
    due_at: "2026-10-20T10:00:00+08:00",
  }),
  "ia-0043": makeCase({
    id: "IA-0043",
    alias: "Rosa Dela Cruz",
    barangay: "Libag Sur",
    station_name: TANZA,
    birth_at: "2026-10-18T14:00:00+08:00",
    discharge_at: "2026-10-19T10:30:00+08:00",
    due_at: "2026-10-20T13:00:00+08:00",
  }),
  "ia-0044": makeCase({
    id: "IA-0044",
    alias: "Grace Villanueva",
    barangay: "Atulayan Norte",
    station_name: LINAO,
    birth_at: "2026-10-19T02:00:00+08:00",
    discharge_at: "2026-10-19T09:00:00+08:00",
    due_at: "2026-10-22T06:00:00+08:00",
  }),
  "ia-0045": makeCase({
    id: "IA-0045",
    alias: "Liza Mercado",
    barangay: "Linao West",
    station_name: LINAO,
    birth_at: "2026-10-17T08:00:00+08:00",
    discharge_at: "2026-10-18T09:00:00+08:00",
    due_at: "2026-10-19T09:00:00+08:00",
  }),
  "ia-0046": makeCase({
    id: "IA-0046",
    alias: "Angelica Bautista",
    barangay: "Pallua Sur",
    station_name: LINAO,
    birth_at: "2026-10-18T20:00:00+08:00",
    discharge_at: "2026-10-19T10:00:00+08:00",
    due_at: "2026-10-21T07:30:00+08:00",
  }),
  "ia-0047": makeCase({
    id: "IA-0047",
    alias: "Carmela Tolentino",
    barangay: "Outside demo area",
    station_name: null,
    handoff_state: "unassigned",
    birth_at: "2026-10-18T11:00:00+08:00",
    discharge_at: "2026-10-19T10:45:00+08:00",
    due_at: "2026-10-21T09:00:00+08:00",
  }),
  "preview-acknowledged": makeCase({
    id: "PV-1",
    alias: "Sample mother",
    barangay: "Caritan Norte",
    station_name: TANZA,
    birth_at: "2026-10-16T09:00:00+08:00",
    discharge_at: "2026-10-17T10:00:00+08:00",
    due_at: "2026-10-20T10:00:00+08:00",
    handoff_state: "acknowledged",
  }),
  "preview-scheduled": makeCase({
    id: "PV-2",
    alias: "Sample mother",
    barangay: "Caritan Norte",
    station_name: TANZA,
    birth_at: "2026-10-16T09:00:00+08:00",
    discharge_at: "2026-10-17T10:00:00+08:00",
    due_at: "2026-10-20T09:00:00+08:00",
    handoff_state: "acknowledged",
    visits: [
      { id: "v1", state: "scheduled", scheduled_for: "2026-10-20T09:00:00+08:00", location_type: "home", worker_name: "Demo worker Ana" },
    ],
  }),
  "preview-overdue": makeCase({
    id: "PV-3",
    alias: "Sample mother",
    barangay: "Caritan Norte",
    station_name: TANZA,
    birth_at: "2026-10-15T09:00:00+08:00",
    discharge_at: "2026-10-16T10:00:00+08:00",
    due_at: "2026-10-19T09:00:00+08:00",
    handoff_state: "acknowledged",
    visits: [
      { id: "v1", state: "scheduled", scheduled_for: "2026-10-19T09:00:00+08:00", location_type: "home", worker_name: "Demo worker Ana" },
    ],
  }),
  "preview-completed": makeCase({
    id: "PV-4",
    alias: "Sample mother",
    barangay: "Caritan Norte",
    station_name: TANZA,
    birth_at: "2026-10-15T09:00:00+08:00",
    discharge_at: "2026-10-16T10:00:00+08:00",
    due_at: "2026-10-19T09:00:00+08:00",
    handoff_state: "acknowledged",
    request_state: "acknowledged",
    visits: [
      { id: "v1", state: "completed", scheduled_for: "2026-10-19T08:30:00+08:00", location_type: "home", worker_name: "Demo worker Ana" },
    ],
  }),
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function getDemoNow() {
  return DEMO_NOW;
}

export async function getCaseByToken(token) {
  await wait(250);
  const found = store[token];
  return found ? structuredClone(found) : null;
}

export async function createContactRequest(token) {
  await wait(400);
  const found = store[token];
  if (!found) throw new Error("Unknown link");
  if (found.request_state === "none") found.request_state = "recorded";
  return structuredClone(found);
}

const submitted = new Map();

export async function listCases() {
  await wait(200);
  return Object.values(store)
    .filter((c) => c.id.startsWith("IA-"))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((c) => structuredClone(c));
}

export async function getCaseById(id) {
  await wait(200);
  const found = Object.values(store).find(
    (c) => c.id.startsWith("IA-") && c.id.toLowerCase() === String(id).toLowerCase()
  );
  return found ? structuredClone(found) : null;
}

export async function createDischarge(input) {
  await wait(500);
  if (submitted.has(input.idempotency_key)) {
    return { case: structuredClone(submitted.get(input.idempotency_key)), duplicate: true };
  }
  if (!input.alias || !input.barangay || !input.birth_at || !input.discharge_at || !input.due_at) {
    throw new Error("Missing fields");
  }
  if (new Date(input.discharge_at) < new Date(input.birth_at)) throw new Error("Discharge before birth");
  if (new Date(input.due_at) < new Date(input.discharge_at)) throw new Error("Target before discharge");

  const count = Object.values(store).filter((c) => c.id.startsWith("IA-")).length;
  const id = `IA-${String(42 + count).padStart(4, "0")}`;
  const station = lookupStation(input.barangay);
  const created = makeCase({
    id,
    alias: input.alias,
    barangay: input.barangay,
    station_name: station,
    handoff_state: station ? "pending" : "unassigned",
    birth_at: input.birth_at,
    discharge_at: input.discharge_at,
    due_at: input.due_at,
    recorded_at: DEMO_NOW,
    assigned_at: station ? DEMO_NOW : null,
  });
  store[id.toLowerCase()] = created;
  submitted.set(input.idempotency_key, created);
  return { case: structuredClone(created), duplicate: false };
}