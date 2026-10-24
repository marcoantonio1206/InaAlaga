"use client";

import { visitTypeLabel, visitDestination } from "@/lib/visitLocation";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Pill from "@/components/hospital/Pill";
import Field, { controlClass } from "@/components/hospital/Field";
import { recordVisitOutcome } from "@/lib/data";
import { toManilaIso, toManilaLocalInput } from "@/lib/validation";
import { formatDot, displayStationName } from "@/lib/format";
import useSave, { primaryBtn } from "./useSave";

function plusMinutes(iso, m) {
  return new Date(new Date(iso).getTime() + m * 60000).toISOString();
}

export default function VisitOutcomeForm({ c, visit, updateNeeded, onSaved }) {
  const [started, setStarted] = useState(toManilaLocalInput(visit.scheduled_for));
  const [ended, setEnded] = useState(toManilaLocalInput(plusMinutes(visit.scheduled_for, 30)));
  const [errors, setErrors] = useState({});
  const { saving, error, run } = useSave(
    (id, vid, body) => recordVisitOutcome(id, vid, body),
    onSaved
  );

  function submit(e) {
    e.preventDefault();
    const found = {};
    if (!started) found.started = "Enter when the visit started.";
    if (!ended) found.ended = "Enter when the visit ended.";
    if (started && new Date(toManilaIso(started)) < new Date(c.discharge_at)) {
      found.started = "The visit cannot start before discharge.";
    }
    if (started && ended && new Date(toManilaIso(ended)) < new Date(toManilaIso(started))) {
      found.ended = "The visit cannot end before it started.";
    }
    setErrors(found);
    if (Object.keys(found).length) return;
    run(c.id, visit.id, {
      started_at: toManilaIso(started),
      ended_at: toManilaIso(ended),
      outcome: "completed",
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Pill tone={updateNeeded ? "warn" : "lilac"}>
          {updateNeeded ? "Update needed" : "Scheduled · visit remains open"}
        </Pill>
      </div>
      <p className="font-bold">
        {formatDot(visit.scheduled_for)} · {visitTypeLabel(visit)} · {displayStationName(visitDestination(visit))} · {visit.worker_name}
      </p>
      {updateNeeded ? (
        <p className="text-sm text-warn-ink">
          Awaiting visit update. Time passing does not complete the visit; only a saved outcome does.
        </p>
      ) : (
        <p className="text-sm text-muted">
          The scheduled visit remains open until its own outcome is saved.
        </p>
      )}
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Visit started" htmlFor="out-started" error={errors.started}>
            <input
              id="out-started"
              type="datetime-local"
              value={started}
              onChange={(e) => setStarted(e.target.value)}
              className={controlClass(Boolean(errors.started))}
            />
          </Field>
          <Field label="Visit ended" htmlFor="out-ended" error={errors.ended}>
            <input
              id="out-ended"
              type="datetime-local"
              value={ended}
              onChange={(e) => setEnded(e.target.value)}
              className={controlClass(Boolean(errors.ended))}
            />
          </Field>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Outcome" htmlFor="out-outcome">
            <input id="out-outcome" value={`Completed ${visitTypeLabel(visit).toLowerCase()}`} readOnly className={controlClass(false)} />
          </Field>
          <Field label="Recorded visitor" htmlFor="out-visitor">
            <input id="out-visitor" value={visit.worker_name} readOnly className={controlClass(false)} />
          </Field>
        </div>
        {error ? (
          <div role="alert" className="rounded-xl bg-danger-bg p-3 text-sm text-danger-ink">
            <p className="font-bold">Outcome not saved</p>
            <p>Your entries are kept. The visit stays open. ({error})</p>
          </div>
        ) : null}
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? "Saving…" : error ? "Retry save" : "Save visit outcome"}
        </button>
      </form>
      <p className="text-sm text-muted">
        Only a saved visit outcome completes it. Acknowledgment, a phone conversation and elapsed time
        cannot produce a completed visit.
      </p>
    </Card>
  );
}
