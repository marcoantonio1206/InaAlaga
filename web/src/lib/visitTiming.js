import { actionTimestamp } from "@/lib/actionTime";
import { overdueLabel } from "@/lib/format";

export const PAST_VISIT_ERROR = "Choose a future date and time (Philippine time).";

export function assertFutureVisit(scheduledFor, now = actionTimestamp()) {
  if (typeof scheduledFor !== "string" || !/T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(scheduledFor) || !Number.isFinite(Date.parse(scheduledFor))) {
    throw new Error("Enter a valid visit date and time with a time zone.");
  }
  if (Date.parse(scheduledFor) <= Date.parse(now)) throw new Error(PAST_VISIT_ERROR);
}

export function earliestVisitTime(now) {
  return new Date((Math.floor(Date.parse(now) / 60000) + 1) * 60000).toISOString();
}

export function visitNeedsUpdate(visit, now) {
  return visit.state === "scheduled" && Date.parse(visit.scheduled_for) <= Date.parse(now) && !visit.arranged_at;
}

export function followupOverdueLabel(c, now) {
  if (c.overdue_arranged_at || c.visits.some((v) => v.state === "completed") || c.contact_attempts?.some((a) => a.outcome === "reached")) return null;
  return overdueLabel(c.due_at, now);
}

export function hasUnarrangedOverdue(c, now) {
  return Boolean(followupOverdueLabel(c, now)) || c.visits.some((v) => visitNeedsUpdate(v, now));
}
