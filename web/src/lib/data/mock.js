import { actionTimestamp } from "@/lib/actionTime";
import { assertNoDuplicateVisit } from "@/lib/visits";
import { normalizeVisitLocation, visitTypeLabel } from "@/lib/visitLocation";
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

// Mother access links (PRD M01): an opaque token maps to one case key and
// expires. A case ID is never a valid link. Seeded tokens are fixed so demo
// URLs stay stable; links issued by createDischarge are random.
const DEMO_MOTHER_TOKEN = "mQ7vX2rLp9TzK4dWb8NcYs";
const LINK_DAYS = 14;
const SEED_EXPIRY = "2026-11-02T12:00:00+08:00";

const links = {
  [DEMO_MOTHER_TOKEN]: { case_key: "ia-0042", expires_at: SEED_EXPIRY },
  Hc3Rt8VnQ1xZ6mBk0LwPa5: { case_key: "ia-0043", expires_at: SEED_EXPIRY },
  Za9Lf2Gq7Ws4Ne1Vy6Tk3R: { case_key: "ia-0044", expires_at: SEED_EXPIRY },
  Pb4Kx8Mj1Dq6Rz3Uf9Ln2S: { case_key: "ia-0045", expires_at: SEED_EXPIRY },
  Ww5Ty0Ec7Hr2Jn8Bm4Xq1V: { case_key: "ia-0046", expires_at: SEED_EXPIRY },
  Ne6Sa3Lu9Fk1Op7Ci2Zd5G: { case_key: "ia-0047", expires_at: SEED_EXPIRY },
  Rv2Xo8Qy4Mi6Tg0Bh3Kp7J: { case_key: "preview-acknowledged", expires_at: SEED_EXPIRY },
  Dt1Yw5Sn9Ce3Ak7Ux0Fr4L: { case_key: "preview-scheduled", expires_at: SEED_EXPIRY },
  Jq8Zm2Vb6Hx0Pe4Ng1Wt9C: { case_key: "preview-overdue", expires_at: SEED_EXPIRY },
  Gk3Ua7Rf1Lo5Ys9Dj2Mv6E: { case_key: "preview-completed", expires_at: SEED_EXPIRY },
  // An older link for Maria that has already expired, for the "link can't be used" state.
  Xs0Ib4Nh8Tc2Ek6Qa9Wz3P: { case_key: "ia-0042", expires_at: "2026-10-18T12:00:00+08:00" },
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Per-browser persistence so saved demo actions survive a reload or a typed URL.
// Browser storage is a convenience only: it may be empty or throw (private
// windows, cleared site data), and the app must work without it.
const submitted = new Map();
const STORAGE_KEY = "inaalaga-mock-store-v2";
const SEED = structuredClone(store);
const SEED_LINKS = structuredClone(links);

function replace(target, source) {
  Object.keys(target).forEach((k) => delete target[k]);
  Object.assign(target, source);
}

// Re-read on every call so a tab opened later (e.g. a mother link opened from
// the hospital view) and the tab that opened it see each other's saves.
function hydrate() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved.cases || !saved.links) return;
    replace(store, saved.cases);
    replace(links, saved.links);
  } catch {
    // ignore: keep the in-memory state
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ cases: store, links }));
  } catch {
    // ignore: storage unavailable
  }
}

export async function resetDemoData() {
  await wait(200);
  replace(store, structuredClone(SEED));
  replace(links, structuredClone(SEED_LINKS));
  submitted.clear();
  // Store the restored seed so other open tabs hydrate the reset too.
  // Removing the key leaves those tabs with stale in-memory records.
  persist();
}

export function getDemoNow() {
  return DEMO_NOW;
}

export function getDemoMotherToken() {
  return DEMO_MOTHER_TOKEN;
}

function linkFor(token) {
  return typeof token === "string" && Object.hasOwn(links, token) ? links[token] : null;
}

function isLive(link) {
  return new Date(link.expires_at) > new Date(DEMO_NOW);
}

// Unknown and expired tokens resolve to nothing, so they reveal no case details.
function caseForToken(token) {
  const link = linkFor(token);
  if (!link || !isLive(link)) return null;
  return store[link.case_key] ?? null;
}

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function issueLink(caseKey) {
  const token = newToken();
  const expires_at = new Date(new Date(DEMO_NOW).getTime() + LINK_DAYS * 86400000).toISOString();
  links[token] = { case_key: caseKey, expires_at };
  return { token, expires_at };
}

// Most recently expiring live link for a case, or null.
function liveLinkForCase(caseKey) {
  const found = Object.entries(links)
    .filter(([, l]) => l.case_key === caseKey && isLive(l))
    .sort(([, a], [, b]) => new Date(b.expires_at) - new Date(a.expires_at))[0];
  return found ? { token: found[0], expires_at: found[1].expires_at } : null;
}

export async function getCaseByToken(token) {
  await wait(250);
  hydrate();
  const found = caseForToken(token);
  return found ? structuredClone(found) : null;
}

// What the simulated SMS shows. The message exists even when its link has
// expired; opening an expired link is what fails.
export async function getSimulatedMessage(token) {
  await wait(250);
  hydrate();
  const link = linkFor(token);
  const found = link ? store[link.case_key] : null;
  return found ? { alias: found.alias, expires_at: link.expires_at } : null;
}

export async function getMotherLink(caseId) {
  await wait(200);
  hydrate();
  const key = Object.keys(store).find(
    (k) => store[k].id.toLowerCase() === String(caseId).toLowerCase()
  );
  if (!key) throw new Error("Unknown case");
  return liveLinkForCase(key);
}

function pushEvent(c, type, actor, detail, at) {
  c.events.push({ at, type, actor, detail: detail ?? null });
}

export async function createContactRequest(token) {
  await wait(400);
  hydrate();
  const actionAt = actionTimestamp();
  const found = caseForToken(token);
  if (!found) throw new Error("Unknown link");
  if (found.request_state !== "recorded") {
    found.request_acknowledged_by = null;
    found.request_acknowledged_at = null;
    found.request_state = "recorded";
    found.request_recorded_at = actionAt;
    pushEvent(found, "request_recorded", "Mother", "Please contact me", actionAt);
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
  const actionAt = actionTimestamp();
  const c = findCase(caseId);
  if (c.handoff_state === "unassigned") throw new Error("No station assigned");
  if (c.handoff_state === "acknowledged") {
    if (c.owner_worker !== worker_name) throw new Error("Owner conflict");
    return structuredClone(c);
  }
  c.handoff_state = "acknowledged";
  c.owner_worker = worker_name;
  c.acknowledged_at = actionAt;
  pushEvent(c, "accepted", worker_name, "Accepted responsibility", actionAt);
  persist();
  return structuredClone(c);
}

export async function scheduleVisit(caseId, { scheduled_for, worker_name, location_type = "home", station_name }) {
  const location = normalizeVisitLocation({ location_type, station_name });
  if (!Number.isFinite(Date.parse(scheduled_for))) throw new Error("Enter a valid visit date and time.");
  await wait(400);
  hydrate();
  const actionAt = actionTimestamp();
  const c = findCase(caseId);
  if (c.handoff_state !== "acknowledged") throw new Error("Case not accepted");
  if (new Date(scheduled_for) < new Date(c.discharge_at)) throw new Error("Before discharge");
  assertNoDuplicateVisit(Object.values(store), caseId, worker_name, scheduled_for);
  const visit = {
    id: `v${c.visits.length + 1}`,
    state: "scheduled",
    scheduled_for,
    ...location,
    worker_name,
    scheduled_at: actionAt,
  };
  c.visits.push(visit);
  pushEvent(c, "visit_scheduled", worker_name, `${visitTypeLabel(visit)} · ${location.station_name || "Your home"} · ${formatDot(scheduled_for)}`, actionAt);
  persist();
  return structuredClone(c);
}

export async function recordVisitOutcome(caseId, visitId, { started_at, ended_at, outcome }) {
  await wait(500);
  hydrate();
  const actionAt = actionTimestamp();
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
  v.completed_recorded_at = actionAt;
  pushEvent(c, "visit_completed", v.worker_name, `${visitTypeLabel(v)} outcome saved`, actionAt);
  persist();
  return structuredClone(c);
}

export async function acknowledgeRequest(caseId, { worker_name }) {
  await wait(400);
  hydrate();
  const actionAt = actionTimestamp();
  const c = findCase(caseId);
  if (c.handoff_state === "unassigned") throw new Error("No station assigned");
  if (c.request_state !== "recorded") throw new Error("No open request");
  c.request_state = "acknowledged";
  c.request_acknowledged_by = worker_name;
  c.request_acknowledged_at = actionAt;
  pushEvent(c, "request_acknowledged", worker_name, "Contact request acknowledged", actionAt);
  persist();
  return structuredClone(c);
}

export async function recordContactAttempt(caseId, { method, started_at, ended_at, outcome, worker_name }) {
  await wait(400);
  hydrate();
  const actionAt = actionTimestamp();
  const c = findCase(caseId);
  if (c.handoff_state === "unassigned") throw new Error("No station assigned");
  if (!["not_reached", "reached"].includes(outcome)) throw new Error("Unsupported outcome");
  if (new Date(ended_at) < new Date(started_at)) throw new Error("Ended before started");
  const attempt = {
    id: `a${c.contact_attempts.length + 1}`,
    method,
    started_at,
    ended_at,
    outcome,
    worker_name,
    recorded_at: actionAt,
  };
  c.contact_attempts.push(attempt);
  pushEvent(
    c,
    "contact_attempt",
    worker_name,
    outcome === "reached" ? `Reached by ${method}` : `Not reached (${method})`, actionAt);
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
    const prior = submitted.get(input.idempotency_key);
    return {
      case: structuredClone(prior),
      duplicate: true,
      link: liveLinkForCase(prior.id.toLowerCase()),
    };
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
  // Saving the discharge is the mother's registration: it issues her private link.
  const link = issueLink(id.toLowerCase());
  submitted.set(input.idempotency_key, created);
  persist();
  return { case: structuredClone(created), duplicate: false, link };
}