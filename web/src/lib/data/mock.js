const DEMO_NOW = "2026-10-18T10:00:00+08:00";

const store = {
  "demo-pending": {
    id: "case-1",
    alias: "Maria",
    station_name: "[Station name]",
    discharge_at: "2026-10-16T10:00:00+08:00",
    due_at: "2026-10-18T09:00:00+08:00",
    handoff_state: "pending",
    request_state: "none",
    visits: [],
  },
  "demo-acknowledged": {
    id: "case-2",
    alias: "Maria",
    station_name: "[Station name]",
    discharge_at: "2026-10-16T10:00:00+08:00",
    due_at: "2026-10-18T09:00:00+08:00",
    handoff_state: "acknowledged",
    request_state: "none",
    visits: [],
  },
  "demo-scheduled": {
    id: "case-3",
    alias: "Maria",
    station_name: "[Station name]",
    discharge_at: "2026-10-16T10:00:00+08:00",
    due_at: "2026-10-20T09:00:00+08:00",
    handoff_state: "acknowledged",
    request_state: "none",
    visits: [
      { id: "v1", state: "scheduled", scheduled_for: "2026-10-20T09:00:00+08:00", location_type: "home", worker_name: "Demo worker Ana" },
    ],
  },
  "demo-overdue": {
    id: "case-4",
    alias: "Maria",
    station_name: "[Station name]",
    discharge_at: "2026-10-15T10:00:00+08:00",
    due_at: "2026-10-17T09:00:00+08:00",
    handoff_state: "acknowledged",
    request_state: "none",
    visits: [
      { id: "v1", state: "scheduled", scheduled_for: "2026-10-17T09:00:00+08:00", location_type: "home", worker_name: "Demo worker Ana" },
    ],
  },
  "demo-completed": {
    id: "case-5",
    alias: "Maria",
    station_name: "[Station name]",
    discharge_at: "2026-10-14T10:00:00+08:00",
    due_at: "2026-10-16T09:00:00+08:00",
    handoff_state: "acknowledged",
    request_state: "acknowledged",
    visits: [
      { id: "v1", state: "completed", scheduled_for: "2026-10-16T09:00:00+08:00", location_type: "home", worker_name: "Demo worker Ana" },
    ],
  },
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