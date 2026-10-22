"use client";

import { useEffect, useState } from "react";
import Pill from "@/components/hospital/Pill";
import Card from "@/components/ui/Card";
import { getCaseById } from "@/lib/data";
import { formatDot, formatDotYear, initials } from "@/lib/format";
import { responsibility } from "@/lib/hospitalStatus";

function Item({ label, value }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function plusMinute(iso) {
  return new Date(new Date(iso).getTime() + 60000).toISOString();
}

export default function PatientProfile({ caseId }) {
  const [c, setC] = useState(undefined);

  useEffect(() => {
    let active = true;
    getCaseById(caseId)
      .then((data) => {
        if (active) setC(data);
      })
      .catch(() => {
        if (active) setC(null);
      });
    return () => {
      active = false;
    };
  }, [caseId]);

  if (c === undefined) return <p className="p-6 text-muted">Loading…</p>;
  if (c === null) {
    return (
      <Card>
        <p className="font-bold">This record was not found.</p>
      </Card>
    );
  }

  const r = responsibility(c);
  const recorded = c.recorded_at ?? c.discharge_at;
  const assigned = c.assigned_at ?? (c.station_name ? plusMinute(recorded) : null);
  const next = c.visits.find((v) => v.state === "scheduled");
  const done = c.visits.find((v) => v.state === "completed");
  const worker =
    c.handoff_state === "acknowledged"
      ? c.owner_worker ?? c.visits[0]?.worker_name ?? "Accepted"
      : c.handoff_state === "unassigned"
        ? "Not assigned"
        : "Awaiting acceptance";
  const note =
    c.handoff_state === "unassigned"
      ? "No receiving station or worker acceptance has been recorded."
      : c.handoff_state === "pending"
        ? "A station assignment does not mean a worker has accepted."
        : "A worker has accepted responsibility.";

  const steps = [
    { label: "Discharge recorded", tone: "ok", time: formatDot(recorded) },
    c.station_name
      ? { label: `Assigned to ${c.station_name}`, tone: "ok", time: formatDot(assigned) }
      : { label: "Station not assigned", tone: "warn", time: "Coordinator review needed" },
    c.handoff_state === "acknowledged"
      ? { label: "Worker acceptance", tone: "ok", time: c.acknowledged_at ? formatDot(c.acknowledged_at) : "Accepted" }
      : { label: "Worker acceptance", tone: "lilac", time: c.station_name ? "Pending" : "Needs a station first" },
    done
      ? { label: "Visit completed", tone: "ok", time: formatDot(done.ended_at ?? done.scheduled_for) }
      : next
        ? { label: "Visit scheduling", tone: "ok", time: formatDot(next.scheduled_for) }
        : { label: "Visit scheduling", tone: "lilac", time: "Not scheduled" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-900 text-lg font-bold text-white"
            >
              {initials(c.alias)}
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-900">Mother alias</p>
              <p className="text-xl font-extrabold">{c.alias}</p>
              <Pill tone={r.tone}>
                {c.handoff_state === "pending" ? "Awaiting worker acceptance" : r.label}
              </Pill>
            </div>
          </div>
          <Item label="Case ID" value={c.id} />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-extrabold">Responsibility</h2>
          <Item label="Assigned demo station" value={c.station_name ?? "Not assigned"} />
          <Item label="Responsible worker" value={worker} />
          <p className="text-sm text-muted">{note}</p>
        </Card>
        <Card>
          <h2 className="text-xl font-extrabold">Follow-up handoff</h2>
          <Item label="Demo follow-up target" value={formatDotYear(c.due_at)} />
          <Item
            label="Visit"
            value={
              done
                ? `Completed · ${formatDot(done.ended_at ?? done.scheduled_for)}`
                : next
                  ? `Scheduled · ${formatDot(next.scheduled_for)}`
                  : "No visit scheduled yet"
            }
          />
          <p className="text-sm text-muted">Administrative demo target, not medical guidance.</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h2 className="text-xl font-extrabold">Mother</h2>
          <Item label="Fictional alias" value={c.alias} />
          <Item label="Barangay" value={c.barangay} />
        </Card>
        <Card>
          <h2 className="text-xl font-extrabold">Discharge details</h2>
          <Item label="Birth" value={formatDotYear(c.birth_at)} />
          <Item label="Discharged" value={formatDotYear(c.discharge_at)} />
        </Card>
        <Card>
          <h2 className="text-xl font-extrabold">Facility</h2>
          <Item label="Discharge facility" value="Cagayan Valley Medical Center" />
          <p className="text-sm text-muted">Fictional record. SMS links are simulated in the demo.</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-extrabold">Handoff timeline</h2>
        <ol className="grid gap-4 md:grid-cols-4">
          {steps.map((s) => (
            <li key={s.label} className="flex flex-col gap-1">
              <Pill tone={s.tone}>{s.label}</Pill>
              <span className="text-sm text-muted">{s.time}</span>
            </li>
          ))}
        </ol>
      </Card>
      <p className="text-sm text-muted">
        Hospital staff record the handoff. Worker acceptance and scheduling happen in the worker view.
      </p>
    </div>
  );
}
