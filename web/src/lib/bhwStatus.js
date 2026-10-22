import { formatDot } from "@/lib/format";

// BHW-facing case state. Derived from saved fields only; time passing never
// completes a visit, it only flags that an update is needed.
export function bhwState(c, nowIso) {
  if (c.handoff_state === "unassigned") return "unassigned";
  if (c.visits.some((v) => v.state === "completed")) return "completed";
  if (c.handoff_state !== "acknowledged") return "pending";
  const next = c.visits.find((v) => v.state === "scheduled");
  if (!next) return "accepted";
  return new Date(next.scheduled_for) < new Date(nowIso) ? "update_needed" : "scheduled";
}

export const STATE_LABEL = {
  unassigned: { label: "Unassigned", tone: "warn", icon: "alert" },
  pending: { label: "Awaiting acceptance", tone: "lilac", icon: "clock" },
  accepted: { label: "Accepted · no visit scheduled", tone: "ok", icon: "check" },
  scheduled: { label: "Scheduled · visit remains open", tone: "lilac", icon: "calendar" },
  update_needed: { label: "Update needed · awaiting visit update", tone: "warn", icon: "alert" },
  completed: { label: "Home visit completed", tone: "ok", icon: "check" },
};

export function openVisit(c) {
  return c.visits.find((v) => v.state === "scheduled") ?? null;
}

export function completedVisit(c) {
  return c.visits.find((v) => v.state === "completed") ?? null;
}

export function visitLine(c) {
  const done = completedVisit(c);
  if (done) return `Completed · ${formatDot(done.ended_at ?? done.scheduled_for)}`;
  const next = openVisit(c);
  if (next) return `Home follow-up · ${formatDot(next.scheduled_for)} · ${next.worker_name}`;
  return "No visit scheduled";
}

export function requestLine(c) {
  if (c.request_state === "recorded") return { label: "Request recorded · awaiting acknowledgment", tone: "warn" };
  if (c.request_state === "acknowledged") return { label: "Request acknowledged", tone: "ok" };
  return null;
}
