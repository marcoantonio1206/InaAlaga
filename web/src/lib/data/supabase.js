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