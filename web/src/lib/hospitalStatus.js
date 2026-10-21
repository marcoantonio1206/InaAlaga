import { formatDot } from "@/lib/format";

export function responsibility(c) {
  if (c.handoff_state === "unassigned") return { label: "Unassigned", tone: "warn" };
  if (c.handoff_state === "acknowledged") return { label: "Accepted", tone: "ok" };
  return { label: "Awaiting acceptance", tone: "lilac" };
}

export function visitSummary(c) {
  if (c.visits.some((v) => v.state === "completed")) return "Visit completed";
  const next = c.visits.find((v) => v.state === "scheduled");
  if (next) return `Scheduled · ${formatDot(next.scheduled_for)}`;
  return "No visit scheduled";
}