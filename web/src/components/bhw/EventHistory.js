import { displayStationName } from "@/lib/format";
import Card from "@/components/ui/Card";
import { formatDot } from "@/lib/format";

const LABEL = {
  request_recorded: "Mother recorded a contact request",
  followup_arranged: "Arranged with mother",
  accepted: "Worker accepted responsibility",
  case_assigned: "BHW assigned",
  visit_scheduled: "Follow-up visit scheduled",
  visit_completed: "Visit outcome saved",
  request_acknowledged: "Contact request acknowledged",
  contact_attempt: "Contact attempt logged",
};

export default function EventHistory({ c, savedTimesOnly = false }) {
  const recorded = savedTimesOnly ? c.recorded_at : c.recorded_at ?? c.discharge_at;
  const rows = [
    { at: recorded, label: "Discharge recorded", actor: "Hospital staff" },
    ...(!c.events.some((e) => e.type === "case_assigned") ? [c.station_name
      ? { at: savedTimesOnly ? c.assigned_at : c.assigned_at ?? recorded, label: `Assigned to ${displayStationName(c.station_name)}`, actor: "System lookup" }
      : { at: recorded, label: "No station matched · unassigned", actor: "System lookup" }] : []),
    ...c.events.map((e) => ({
      at: e.at,
      label: LABEL[e.type] ?? e.type,
      actor: e.actor,
      detail: e.detail,
    })),
  ];

  return (
    <Card>
      <details>
      <summary className="cursor-pointer text-lg font-extrabold">Event history ({rows.length})</summary>
      <p className="mt-3 text-sm text-muted">
        Saved activity, from earliest to latest.
      </p>
      <ol className="mt-3 flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={i} className="flex flex-col gap-0.5 border-l-2 border-brand-200 pl-3 text-sm">
            <span className="font-bold">{r.label}</span>
            <span className="text-muted">
              {r.at ? formatDot(r.at) : "Time not recorded"} · {r.actor}
              {r.detail ? ` · ${r.detail.replace(/\s*\(demo station\)/gi, "")}` : ""}
            </span>
          </li>
        ))}
      </ol>
      </details>
    </Card>
  );
}
