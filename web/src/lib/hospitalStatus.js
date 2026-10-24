import { groupVisits } from "@/lib/visits";
import { formatDot } from "@/lib/format";

export function responsibility(c) {
  if (c.handoff_state === "unassigned") return { label: "Unassigned", tone: "warn" };
  if (c.handoff_state === "acknowledged") return { label: "Accepted", tone: "ok" };
  return { label: "Awaiting acceptance", tone: "lilac" };
}

export function visitSummary(c) {
  const next = groupVisits(c.visits).next;
  if (next) return `Scheduled · ${formatDot(next.scheduled_for)}${c.visits.some((v) => v.state === "completed") ? " · Previous visit completed" : ""}`;
  if (c.visits.some((v) => v.state === "completed")) return "Visit completed";
  return "No visit scheduled";
}

// Request acknowledgment and successful contact remain separate saved states.
export function contactSummary(c) {
  const attempts = [...(c.contact_attempts ?? [])].sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));
  const latest = attempts[0];
  const request = c.request_state === "recorded" ? "Contact requested · Awaiting acknowledgment"
    : c.request_state === "acknowledged" ? "Request acknowledged" : null;
  const contact = latest ? `${latest.outcome === "reached" ? "Reached" : "Not reached"} · ${formatDot(latest.started_at)}` : null;
  return [request, contact].filter(Boolean).join(" · ") || "No contact updates";
}
