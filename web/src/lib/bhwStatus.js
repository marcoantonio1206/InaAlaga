import { visitNeedsUpdate } from "@/lib/visitTiming";
import { groupVisits } from "@/lib/visits";
import { visitTypeLabel, visitDestination } from "@/lib/visitLocation";
import { formatDot, displayStationName } from "@/lib/format";

// BHW-facing case state. Derived from saved fields only; time passing never
// completes a visit, it only flags that an update is needed.
export function bhwState(c, nowIso) {
  if (c.handoff_state === "unassigned") return "unassigned";
  if (c.handoff_state !== "acknowledged") return "pending";
  const { next, scheduled } = groupVisits(c.visits);
  if (!next) return c.visits.some((v) => v.state === "completed") ? "completed" : "accepted";
  return scheduled.some((v) => visitNeedsUpdate(v, nowIso)) ? "update_needed" : next.arranged_at ? "arranged" : "scheduled";
}

export const STATE_LABEL = {
  unassigned: { label: "Unassigned", tone: "warn", icon: "alert" },
  pending: { label: "Awaiting acceptance", tone: "lilac", icon: "clock" },
  accepted: { label: "Accepted · no visit scheduled", tone: "ok", icon: "check" },
  scheduled: { label: "Scheduled · visit remains open", tone: "lilac", icon: "calendar" },
  update_needed: { label: "Update needed · awaiting visit update", tone: "warn", icon: "alert" },
  arranged: { label: "Arranged with mother · visit remains open", tone: "ok", icon: "check" },
  completed: { label: "Visit completed", tone: "ok", icon: "check" },
};

export function openVisit(c) {
  return groupVisits(c.visits).next ?? null;
}

export function completedVisit(c) {
  return c.visits.filter((v) => v.state === "completed").sort((a,b) => new Date(b.ended_at ?? b.scheduled_for) - new Date(a.ended_at ?? a.scheduled_for))[0] ?? null;
}

export function visitLine(c) {
  const next = openVisit(c);
  if (next) return `${visitTypeLabel(next)} · ${displayStationName(visitDestination(next))} · ${formatDot(next.scheduled_for)} · ${next.worker_name}`;
  const done = completedVisit(c);
  if (done) return `Completed · ${formatDot(done.ended_at ?? done.scheduled_for)}`;
  return "No visit scheduled";
}

export function requestLine(c) {
  if (c.request_state === "recorded") return { label: "Request recorded · awaiting acknowledgment", tone: "warn" };
  if (c.request_state === "acknowledged") return { label: "Request acknowledged", tone: "ok" };
  return null;
}
