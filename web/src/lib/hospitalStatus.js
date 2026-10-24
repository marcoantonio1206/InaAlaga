import { groupVisits } from "@/lib/visits";
import { formatDot } from "@/lib/format";

export function responsibility(c) {
  if (c.handoff_state === "unassigned") return { label: "Unassigned", tone: "warn" };
  if (c.handoff_state === "acknowledged") return { label: "Accepted", tone: "ok" };
  return { label: "Awaiting acceptance", tone: "lilac" };
}

export function visitSummary(c) {
  const next = groupVisits(c.visits).next;
  if (next) return `Scheduled · ${formatDot(next.scheduled_for)}`;
  if (c.visits.some((v) => v.state === "completed")) return "Visit completed";
  return "No visit scheduled";
}