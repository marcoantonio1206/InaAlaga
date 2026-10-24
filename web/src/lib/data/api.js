// Browser data source for NEXT_PUBLIC_DATA_SOURCE=supabase.
// The Supabase service-role key only exists on the server, so the client
// calls the route handlers in app/api, which use ./supabase.js.
import { DEMO_MOTHER_TOKEN } from "./demoLink";

export const DEMO_NOW = "2026-10-19T12:00:00+08:00";

export function getDemoNow() {
  return DEMO_NOW;
}

export function getDemoMotherToken() {
  return DEMO_MOTHER_TOKEN;
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.error || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}

// Reads that the UI treats as "not found" return null on 404.
async function requestOrNull(path) {
  try {
    return await request(path);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

const enc = encodeURIComponent;

export function getCaseByToken(token) {
  return requestOrNull(`/mother/${enc(token)}`);
}

export function getSimulatedMessage(token) {
  return requestOrNull(`/mother/${enc(token)}/message`);
}

export function getMotherLink(caseId) {
  return request(`/cases/${enc(caseId)}/link`);
}

export function createContactRequest(token) {
  return request(`/mother/${enc(token)}/request`, { method: "POST" });
}

export function listCases() {
  return request("/cases");
}

export function getCaseById(id) {
  return requestOrNull(`/cases/${enc(id)}`);
}

export function createDischarge(input) {
  return request("/cases", { method: "POST", body: input });
}

export function listStationCases(stationName) {
  return request(`/stations/${enc(stationName)}/cases`);
}

export function listWorkerSchedule(workerName) {
  return request(`/workers/${enc(workerName)}/schedule`);
}

export function acknowledgeCase(caseId, { worker_name }) {
  return request(`/cases/${enc(caseId)}/acknowledge`, { method: "PATCH", body: { worker_name } });
}

export function scheduleVisit(caseId, { scheduled_for, worker_name, location_type = "home", station_name }) {
  return request(`/cases/${enc(caseId)}/visits`, { method: "POST", body: { scheduled_for, worker_name, location_type, station_name } });
}

export function recordVisitOutcome(caseId, visitId, { started_at, ended_at, outcome }) {
  return request(`/visits/${enc(visitId)}/outcome`, {
    method: "PATCH",
    body: { case_id: caseId, started_at, ended_at, outcome },
  });
}

export function acknowledgeRequest(caseId, { worker_name }) {
  return request(`/cases/${enc(caseId)}/request/acknowledge`, { method: "PATCH", body: { worker_name } });
}

export function recordContactAttempt(caseId, { method, started_at, ended_at, outcome, worker_name }) {
  return request(`/cases/${enc(caseId)}/attempts`, {
    method: "POST",
    body: { method, started_at, ended_at, outcome, worker_name },
  });
}

// Supabase sessions are reset through /api/sessions; the BHW reset button is a no-op here.
export async function resetDemoData() {
  throw new Error("Browser reset is only available in local demonstration mode.");
}

export function listAssignableWorkers() {
  return request("/workers");
}

export function assignCase(caseId, { worker_id }) {
  return request(`/cases/${enc(caseId)}/assign`, { method: "PATCH", body: { worker_id } });
}

export function arrangeOverdue(caseId, { worker_name }) {
  return request(`/cases/${enc(caseId)}/arrange`, { method: "PATCH", body: { worker_name } });
}
