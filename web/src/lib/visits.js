export function groupVisits(visits = []) {
  const scheduled = visits.filter((v) => v.state === "scheduled")
    .sort((a, b) => Date.parse(a.scheduled_for) - Date.parse(b.scheduled_for) || a.id.localeCompare(b.id));
  const previous = visits.filter((v) => v.state === "completed" || v.state === "cancelled")
    .sort((a, b) => Date.parse(b.scheduled_for) - Date.parse(a.scheduled_for) || b.id.localeCompare(a.id));
  // A passed appointment stays open until the worker records its outcome.
  return { next: scheduled[0] ?? null, future: scheduled.slice(1), previous, scheduled };
}

export function assertNoDuplicateVisit(cases, caseId, workerName, scheduledFor) {
  const time = Date.parse(scheduledFor);
  for (const c of cases) for (const visit of c.visits ?? []) {
    if (visit.state === "cancelled" || Date.parse(visit.scheduled_for) !== time) continue;
    if (c.id === caseId) throw new Error("A visit is already scheduled for this mother at that time. Choose another time.");
    if (visit.state === "scheduled" && visit.worker_name === workerName) throw new Error("This worker already has a visit at that time. Choose another time.");
  }
}
