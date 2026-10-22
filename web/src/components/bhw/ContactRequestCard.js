"use client";

import Card from "@/components/ui/Card";
import Pill from "@/components/hospital/Pill";
import { acknowledgeRequest } from "@/lib/data";
import { formatDot } from "@/lib/format";
import useSave, { primaryBtn } from "./useSave";

export default function ContactRequestCard({ c, worker, onSaved }) {
  const { saving, error, run } = useSave(acknowledgeRequest, onSaved);

  if (c.request_state === "none") {
    return (
      <Card>
        <h2 className="text-xl font-extrabold">Contact requests</h2>
        <p className="text-sm text-muted">
          No contact request from the mother. Not every case needs one; this path is separate from the
          visit path.
        </p>
      </Card>
    );
  }

  if (c.request_state === "acknowledged") {
    return (
      <Card>
        <h2 className="text-xl font-extrabold">Contact requests</h2>
        <Pill tone="ok">Request acknowledged</Pill>
        <p className="font-bold">
          Acknowledged by {c.request_acknowledged_by} · {formatDot(c.request_acknowledged_at)}
        </p>
        <p className="text-sm text-muted">
          Acknowledgment is saved. It does not mean contact has been made or a visit completed. Record
          attempts below.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <Pill tone="warn">Mother recorded “Please contact me”</Pill>
      <p className="text-sm">
        Recorded {c.request_recorded_at ? formatDot(c.request_recorded_at) : "in this demo"}. The request
        awaits acknowledgment. Opening the case has not acknowledged it.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-danger-ink">
          Not saved: {error}. The request stays unacknowledged.
        </p>
      ) : null}
      <button
        type="button"
        disabled={saving}
        onClick={() => run(c.id, { worker_name: worker.name })}
        className={primaryBtn}
      >
        {saving ? "Saving…" : "Acknowledge request"}
      </button>
    </Card>
  );
}
