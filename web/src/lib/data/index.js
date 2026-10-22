import * as mock from "./mock";
// In supabase mode the browser goes through the API routes (./api.js);
// only app/api route handlers import ./supabase.js directly.
import * as api from "./api";

const source = process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? api : mock;

export const getCaseByToken = source.getCaseByToken;
export const getSimulatedMessage = source.getSimulatedMessage;
export const getMotherLink = source.getMotherLink;
export const getDemoMotherToken = source.getDemoMotherToken;
export const createContactRequest = source.createContactRequest;
export const getDemoNow = source.getDemoNow;
export const listCases = source.listCases;
export const getCaseById = source.getCaseById;
export const createDischarge = source.createDischarge;
export const listStationCases = source.listStationCases;
export const listWorkerSchedule = source.listWorkerSchedule;
export const acknowledgeCase = source.acknowledgeCase;
export const scheduleVisit = source.scheduleVisit;
export const recordVisitOutcome = source.recordVisitOutcome;
export const acknowledgeRequest = source.acknowledgeRequest;
export const recordContactAttempt = source.recordContactAttempt;
export const resetDemoData = source.resetDemoData;

export { getScenarioSummary } from "./planning";
