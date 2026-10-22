import Card from "@/components/ui/Card";
import { formatDot } from "@/lib/format";

const LABEL = {
  request_recorded: "Mother recorded a contact request",
  accepted: "Worker accepted responsibility",
  visit_scheduled: "Home follow-up scheduled",
  visit_completed: "Home-visit outcome saved",
  request_acknowledged: "Contact request acknowledged",
  contact_attempt: "Contact attempt logged",
};

export default function EventHistory({ c }) {
  const recorded = c.recorded_at ?? c.discharge_at;
  const rows = [
    { at: recorded, label: "Discharge recorded", actor: "Hospital staff" },
    c.station_name
      ? { at: c.assigned_at ?? recorded, label: `Assigned to ${c.station_name}`, actor: "System lookup" }
      : { at: recorded, label: "No station matched · unassigned", actor: "System lookup" },
    ...c.events.map((e) => ({
      at: e.at,
      label: LABEL[e.type] ?? e.type,
      actor: e.actor,
      detail: e.detail,
    })),
  ];

  return (
    <Card>
      <h2 className="text-xl font-extrabold">Event history</h2>
      <p className="text-sm text-muted">
        Saved events in chronological order. Each action has its own state; opening the case records
        nothing.
      </p>
      <ol className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <li key={i} className="flex flex-col gap-0.5 border-l-2 border-brand-200 pl-3 text-sm">
            <span className="font-bold">{r.label}</span>
            <span className="text-muted">
              {formatDot(r.at)} · {r.actor}
              {r.detail ? ` · ${r.detail}` : ""}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
