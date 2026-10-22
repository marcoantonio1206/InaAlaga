"use client";

import Card from "@/components/ui/Card";
import Pill from "@/components/hospital/Pill";
import { acknowledgeCase } from "@/lib/data";
import { formatDot } from "@/lib/format";
import useSave, { primaryBtn, outlineBtn } from "./useSave";

export default function AcceptCard({ c, worker, onSaved, onRefresh }) {
  const { saving, error, run } = useSave(acknowledgeCase, onSaved);

  if (c.handoff_state === "unassigned") {
    return (
      <Card>
        <h2 className="text-xl font-extrabold">Responsibility</h2>
        <Pill tone="warn">Unassigned</Pill>
        <p className="text-sm text-muted">
          No receiving station was matched for this record. A coordinator must review the assignment
          before a worker can accept it.
        </p>
      </Card>
    );
  }

  if (c.handoff_state === "acknowledged") {
    return (
      <Card>
        <h2 className="text-xl font-extrabold">Responsibility</h2>
        <Pill tone="ok">Accepted</Pill>
        <p className="font-bold">
          {c.owner_worker} accepted responsibility · {formatDot(c.acknowledged_at)}
        </p>
        <p className="text-sm text-muted">
          Named worker and acceptance time are saved. Acceptance does not schedule or complete a visit.
        </p>
      </Card>
    );
  }

  if (error === "Owner conflict") {
    return (
      <Card className="border-danger-ink">
        <h2 className="text-xl font-extrabold">Another worker accepts first</h2>
        <p className="text-sm">
          Your acceptance was not saved. The existing owner is preserved; reassignment is outside this
          flow.
        </p>
        <button type="button" onClick={onRefresh} className={outlineBtn}>
          Refresh case
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-extrabold">Accept responsibility · Review</h2>
      <Pill tone="lilac">Awaiting worker acceptance</Pill>
      <p className="text-sm">
        Case <span className="font-bold">{c.id}</span> ({c.alias}, {c.barangay}) assigned to{" "}
        <span className="font-bold">{c.station_name}</span>. You are acting as{" "}
        <span className="font-bold">{worker.name}</span>.
      </p>
      <p className="text-sm text-muted">
        Assignment to a station is not acceptance. Confirming saves your name and the acceptance time.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-danger-ink">
          Acceptance not saved: {error}. Nothing changed.
        </p>
      ) : null}
      <button
        type="button"
        disabled={saving}
        onClick={() => run(c.id, { worker_name: worker.name })}
        className={primaryBtn}
      >
        {saving ? "Saving…" : "Accept responsibility"}
      </button>
    </Card>
  );
}
