const DEMO_NOW = "2026-10-19T12:00:00+08:00";
import { lookupStation, TANZA, LINAO } from "@/lib/demoGeography";
import { formatDot } from "@/lib/format";

function makeCase(fields) {
  return {
    handoff_state: "pending",
    request_state: "none",
    owner_worker: null,
    acknowledged_at: null,
    visits: [],
    contact_attempts: [],
    events: [],
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

// Per-browser persistence so saved demo actions survive a reload or a typed URL.
// Browser storage is a convenience only: it may be empty or throw (private
// windows, cleared site data), and the app must work without it.
const submitted = new Map();
const STORAGE_KEY = "inaalaga-mock-store-v1";
const SEED = structuredClone(store);
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.keys(store).forEach((k) => delete store[k]);
    Object.assign(store, saved);
  } catch {
    // ignore: fall back to the in-memory seed
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore: storage unavailable
  }
}

export async function resetDemoData() {
  await wait(200);
  Object.keys(store).forEach((k) => delete store[k]);
  Object.assign(store, structuredClone(SEED));
  submitted.clear();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getDemoNow() {
  return DEMO_NOW;
}

export async function getCaseByToken(token) {
  await wait(250);
  hydrate();
  const found = store[token];
  return found ? structuredClone(found) : null;
}

function pushEvent(c, type, actor, detail) {
  c.events.push({ at: DEMO_NOW, type, actor, detail: detail ?? null });
}

export async function createContactRequest(token) {
  await wait(400);
  hydrate();
  const found = store[token];
  if (!found) throw new Error("Unknown link");
  if (found.request_state === "none") {
    found.request_state = "recorded";
    found.request_recorded_at = DEMO_NOW;
    pushEvent(found, "request_recorded", "Mother", "Please contact me");
    persist();
  }
  return structuredClone(found);
}

// ---- BHW workspace actions -------------------------------------------------

function findCase(caseId) {
  const found = Object.values(store).find(
    (c) => c.id.toLowerCase() === String(caseId).toLowerCase()
  );
  if (!found) throw new Error("Unknown case");
  return found;
}

export async function listStationCases(stationName) {
  await wait(200);
  hydrate();
  return Object.values(store)
    .filter((c) => c.id.startsWith("IA-") && c.station_name === stationName)
    .sort(
      (a, b) =>
        new Date(a.due_at) - new Date(b.due_at) ||
        new Date(a.recorded_at ?? a.discharge_at) - new Date(b.recorded_at ?? b.discharge_at) ||
        a.id.localeCompare(b.id)
    )
    .map((c) => structuredClone(c));
}

export async function listWorkerSchedule(workerName) {
  await wait(200);
  hydrate();
  const rows = [];
  Object.values(store)
    .filter((c) => c.id.startsWith("IA-"))
    .forEach((c) => {
      c.visits
        .filter((v) => v.state === "scheduled" && v.worker_name === workerName)
        .forEach((v) => rows.push({ case: structuredClone(c), visit: structuredClone(v) }));
    });
  return rows.sort((a, b) => new Date(a.visit.scheduled_for) - new Date(b.visit.scheduled_for));
}

export async function acknowledgeCase(caseId, { worker_name }) {
  await wait(400);
  hydrate();
  const c = findCase(caseId);
  if (c.handoff_state === "unassigned") throw new Error("No station assigned");
  if (c.handoff_state === "acknowledged") {
    if (c.owner_worker !== worker_name) throw new Error("Owner conflict");
    return structuredClone(c);
  }
  c.handoff_state = "acknowledged";
  c.owner_worker = worker_name;
  c.acknowledged_at = DEMO_NOW;
  pushEvent(c, "accepted", worker_name, "Accepted responsibility");
  persist();
  return structuredClone(c);
}

export async function scheduleVisit(caseId, { scheduled_for, worker_name }) {
  await wait(400);
  hydrate();
  const c = findCase(caseId);
  if (c.handoff_state !== "acknowledged") throw new Error("Case not accepted");
  if (new Date(scheduled_for) < new Date(c.discharge_at)) throw new Error("Before discharge");
  if (c.visits.some((v) => v.state === "scheduled")) throw new Error("Visit already scheduled");
  const visit = {
    id: `v${c.visits.length + 1}`,
    state: "scheduled",
    scheduled_for,
    location_type: "home",
    worker_name,
    scheduled_at: DEMO_NOW,
  };
  c.visits.push(visit);
  pushEvent(c, "visit_scheduled", worker_name, `Home follow-up · ${formatDot(scheduled_for)}`);
  persist();
  return structuredClone(c);
}

export async function recordVisitOutcome(caseId, visitId, { started_at, ended_at, outcome }) {
  await wait(500);
  hydrate();
  const c = findCase(caseId);
  const v = c.visits.find((x) => x.id === visitId);
  if (!v || v.state !== "scheduled") throw new Error("No open visit");
  if (outcome !== "completed") throw new Error("Unsupported outcome");
  if (new Date(started_at) < new Date(c.discharge_at)) throw new Error("Before discharge");
  if (new Date(ended_at) < new Date(started_at)) throw new Error("Ended before started");
  v.state = "completed";
  v.started_at = started_at;
  v.ended_at = ended_at;
  v.outcome = outcome;
  v.completed_recorded_at = DEMO_NOW;
  pushEvent(c, "visit_completed", v.worker_name, "Completed home visit outcome saved");
  persist();
  return structuredClone(c);
}

export async function acknowledgeRequest(caseId, { worker_name }) {
  await wait(400);
  hydrate();
  const c = findCase(caseId);
  if (c.request_state !== "recorded") throw new Error("No open request");
  c.request_state = "acknowledged";
  c.request_acknowledged_by = worker_name;
  c.request_acknowledged_at = DEMO_NOW;
  pushEvent(c, "request_acknowledged", worker_name, "Contact request acknowledged");
  persist();
  return structuredClone(c);
}

export async function recordContactAttempt(caseId, { method, started_at, ended_at, outcome, worker_name }) {
  await wait(400);
  hydrate();
  const c = findCase(caseId);
  if (!["not_reached", "reached"].includes(outcome)) throw new Error("Unsupported outcome");
  if (new Date(ended_at) < new Date(started_at)) throw new Error("Ended before started");
  const attempt = {
    id: `a${c.contact_attempts.length + 1}`,
    method,
    started_at,
    ended_at,
    outcome,
    worker_name,
    recorded_at: DEMO_NOW,
  };
  c.contact_attempts.push(attempt);
  pushEvent(
    c,
    "contact_attempt",
    worker_name,
    outcome === "reached" ? `Reached by ${method}` : `Not reached (${method})`
  );
  persist();
  return structuredClone(c);
}

export async function listCases() {
  await wait(200);
  hydrate();
  return Object.values(store)
    .filter((c) => c.id.startsWith("IA-"))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((c) => structuredClone(c));
}

export async function getCaseById(id) {
  await wait(200);
  hydrate();
  const found = Object.values(store).find(
    (c) => c.id.startsWith("IA-") && c.id.toLowerCase() === String(id).toLowerCase()
  );
  return found ? structuredClone(found) : null;
}

export async function createDischarge(input) {
  await wait(500);
  hydrate();
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
  persist();
  return { case: structuredClone(created), duplicate: false };
}