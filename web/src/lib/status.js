import { groupVisits } from "@/lib/visits";
export function getStatus(caseData, nowIso) {
  if (caseData.handoff_state === "unassigned") return "unassigned";
  if (caseData.handoff_state !== "acknowledged") return "pending";
  const next = groupVisits(caseData.visits).next;
  if (!next) return "acknowledged";
  return new Date(next.scheduled_for) < new Date(nowIso) ? "overdue" : "scheduled";
}

export function getCardVisit(caseData, status) {
  if (status === "scheduled" || status === "overdue") {
    return groupVisits(caseData.visits).next ?? null;
  }
  return null;
}