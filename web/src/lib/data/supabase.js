const notReady = () => {
  throw new Error("The Supabase data source is not implemented yet.");
};

export function getDemoNow() {
  return new Date().toISOString();
}

export async function getCaseByToken() {
  return notReady();
}

export async function createContactRequest() {
  return notReady();
}

export async function listCases() {
  return notReady();
}

export async function getCaseById() {
  return notReady();
}

export async function createDischarge() {
  return notReady();
}

export async function listStationCases() {
  return notReady();
}

export async function listWorkerSchedule() {
  return notReady();
}

export async function acknowledgeCase() {
  return notReady();
}

export async function scheduleVisit() {
  return notReady();
}

export async function recordVisitOutcome() {
  return notReady();
}

export async function acknowledgeRequest() {
  return notReady();
}

export async function recordContactAttempt() {
  return notReady();
}

export async function resetDemoData() {
  return notReady();
}
