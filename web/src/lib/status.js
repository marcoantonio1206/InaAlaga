export function getStatus(caseData, nowIso) {
  if (caseData.handoff_state === "unassigned") return "unassigned";
  if (caseData.visits.some((v) => v.state === "completed")) return "completed";
  if (caseData.handoff_state !== "acknowledged") return "pending";
  const next = caseData.visits.find((v) => v.state === "scheduled");
  if (!next) return "acknowledged";
  return new Date(next.scheduled_for) < new Date(nowIso) ? "overdue" : "scheduled";
}

export function getCardVisit(caseData, status) {
  if (status === "completed") {
    return caseData.visits.find((v) => v.state === "completed") ?? null;
  }
  if (status === "scheduled" || status === "overdue") {
    return caseData.visits.find((v) => v.state === "scheduled") ?? null;
  }
  return null;
}