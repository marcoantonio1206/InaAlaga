"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Field, { controlClass } from "@/components/hospital/Field";
import { scheduleVisit } from "@/lib/data";
import { toManilaIso, toManilaLocalInput } from "@/lib/validation";
import useSave, { primaryBtn } from "./useSave";

export default function ScheduleForm({ c, worker, onSaved }) {
  const [when, setWhen] = useState(toManilaLocalInput(c.due_at));
  const [fieldError, setFieldError] = useState(null);
  const { saving, error, run } = useSave(scheduleVisit, onSaved);

  function submit(e) {
    e.preventDefault();
    if (!when) return setFieldError("Enter the date and time of the home follow-up.");
    if (new Date(toManilaIso(when)) < new Date(c.discharge_at)) {
      return setFieldError("The follow-up cannot be before discharge.");
    }
    setFieldError(null);
    run(c.id, { scheduled_for: toManilaIso(when), worker_name: worker.name });
  }

  return (
    <Card>
      <p className="text-sm text-muted">
        Enter date and time in Asia/Manila. The current worker is recorded as visitor. A saved schedule
        appears for the mother and on your Schedule; it does not mean contact happened.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <Field label="Date and time" htmlFor="sched-when" error={fieldError}>
          <input
            id="sched-when"
            type="datetime-local"
            value={when}
            onChange={(e) => {
              setWhen(e.target.value);
              setFieldError(null);
            }}
            className={controlClass(Boolean(fieldError))}
          />
        </Field>
        <Field label="Recorded visitor" htmlFor="sched-visitor">
          <input id="sched-visitor" value={worker.name} readOnly className={controlClass(false)} />
        </Field>
        {error ? (
          <div role="alert" className="rounded-xl bg-danger-bg p-3 text-sm text-danger-ink">
            <p className="font-bold">Schedule not saved</p>
            <p>Your entries are kept. The saved case stays unchanged. ({error})</p>
          </div>
        ) : null}
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? "Saving…" : error ? "Retry save" : "Save schedule"}
        </button>
      </form>
    </Card>
  );
}
