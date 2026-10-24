import { visitNeedsUpdate } from "@/lib/visitTiming";
import { displayStationName, formatDot } from "@/lib/format";

// Coordinator overview groups, derived from saved case records only. A case can
// appear in more than one group. Never mixed with simulation results (PRD D01).
export const OVERVIEW_GROUPS = [
  {
    key: "unassigned",
    title: "Unassigned",
    hint: "No station or worker yet.",
    icon: "alert",
    tone: "warn",
    match: (c) => c.handoff_state === "unassigned",
    detail: (c) => `${c.barangay.replace(/outside demo area/i, "Outside covered area")} · no coordinating station`,
  },
  {
    key: "pending",
    title: "Awaiting acceptance",
    hint: "No worker has accepted responsibility yet.",
    icon: "clock",
    tone: "lilac",
    match: (c) => c.handoff_state === "pending",
    detail: (c) => `${displayStationName(c.station_name)} · ${c.assigned_worker ? `${c.assigned_worker} has not accepted` : "no named worker"}`,
  },
  {
    key: "visits",
    title: "Visits awaiting an update",
    hint: "Visit time has passed with no saved outcome.",
    icon: "calendar",
    tone: "warn",
    match: (c, now) => c.visits.some((v) => visitNeedsUpdate(v, now)),
    detail: (c, now) => {
      const v = c.visits.filter((x) => visitNeedsUpdate(x, now)).sort((a, b) => Date.parse(a.scheduled_for) - Date.parse(b.scheduled_for))[0];
      return `Visit ${formatDot(v.scheduled_for)} · ${v.worker_name}`;
    },
  },
  {
    key: "requests",
    title: "Open contact requests",
    hint: "Mother asked for contact; not yet acknowledged.",
    icon: "message",
    tone: "warn",
    match: (c) => c.request_state === "recorded",
    detail: (c) => `${displayStationName(c.station_name) || "No station"} · ${c.request_recorded_at ? `requested ${formatDot(c.request_recorded_at)}` : "request time not recorded"}`,
  },
];

export function groupOverview(cases, now) {
  return OVERVIEW_GROUPS.map((g) => ({
    ...g,
    items: cases
      .filter((c) => g.match(c, now))
      .sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at) || a.id.localeCompare(b.id)),
  }));
}
