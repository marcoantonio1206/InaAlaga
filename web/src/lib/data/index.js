import * as mock from "./mock";
import * as supabase from "./supabase";

const source = process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? supabase : mock;

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

export { getPlanningResults } from "./planning";
