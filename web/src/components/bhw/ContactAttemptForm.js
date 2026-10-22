"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Pill from "@/components/hospital/Pill";
import Field, { controlClass } from "@/components/hospital/Field";
import { recordContactAttempt, getDemoNow } from "@/lib/data";
import { toManilaIso, toManilaLocalInput } from "@/lib/validation";
import { formatDot } from "@/lib/format";
import useSave, { primaryBtn, outlineBtn } from "./useSave";

const METHODS = ["Phone call", "SMS", "Other"];

export function AttemptList({ attempts }) {
  if (attempts.length === 0) return <p className="text-sm text-muted">No contact attempts logged.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {attempts.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 p-3 text-sm">
          <Pill tone={a.outcome === "reached" ? "ok" : "warn"}>
            {a.outcome === "reached" ? "Reached" : "Not reached"}
          </Pill>
          <span>
            {a.method} · {formatDot(a.started_at)} to {formatDot(a.ended_at)} · {a.worker_name}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ContactAttemptForm({ c, worker, onSaved, alwaysOpen = false, onCancel }) {
  const now = getDemoNow();
  const [open, setOpen] = useState(alwaysOpen || (c.contact_attempts.length === 0 && c.request_state === "acknowledged"));
  const [method, setMethod] = useState(METHODS[0]);
  const [started, setStarted] = useState(toManilaLocalInput(now));
  const [ended, setEnded] = useState(toManilaLocalInput(now));
  const [outcome, setOutcome] = useState("not_reached");
  const [errors, setErrors] = useState({});
  const { saving, error, run } = useSave(recordContactAttempt, (updated) => {
    setOpen(false);
    onSaved(updated);
  });

  function submit(e) {
    e.preventDefault();
    const found = {};
    if (!started) found.started = "Enter when the attempt started.";
    if (!ended) found.ended = "Enter when the attempt ended.";
    if (started && ended && new Date(toManilaIso(ended)) < new Date(toManilaIso(started))) {
      found.ended = "The attempt cannot end before it started.";
    }
    setErrors(found);
    if (Object.keys(found).length) return;
    run(c.id, {
      method,
      started_at: toManilaIso(started),
      ended_at: toManilaIso(ended),
      outcome,
      worker_name: worker.name,
    });
  }

  const form = (
  <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
    <Field label="Method" htmlFor="att-method">
      <select
        id="att-method"
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className={controlClass(false)}
      >
        {METHODS.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>
    </Field>
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Started" htmlFor="att-started" error={errors.started}>
        <input
          id="att-started"
          type="datetime-local"
          value={started}
          onChange={(e) => setStarted(e.target.value)}
          className={controlClass(Boolean(errors.started))}
        />
      </Field>
      <Field label="Ended" htmlFor="att-ended" error={errors.ended}>
        <input
          id="att-ended"
          type="datetime-local"
          value={ended}
          onChange={(e) => setEnded(e.target.value)}
          className={controlClass(Boolean(errors.ended))}
        />
      </Field>
    </div>
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-bold">Outcome</legend>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name="att-outcome"
          checked={outcome === "not_reached"}
          onChange={() => setOutcome("not_reached")}
        />
        Not reached · attempt is logged, not successful contact
      </label>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name="att-outcome"
          checked={outcome === "reached"}
          onChange={() => setOutcome("reached")}
        />
        Reached by phone · contact is logged, the home visit remains open
      </label>
    </fieldset>
    {error ? (
      <div role="alert" className="rounded-xl bg-danger-bg p-3 text-sm text-danger-ink">
        <p className="font-bold">Attempt not saved</p>
        <p>Your entries are kept. ({error})</p>
      </div>
    ) : null}
    <div className="flex flex-col gap-2 lg:flex-row">
      <button type="submit" disabled={saving} className={primaryBtn}>
        {saving ? "Saving…" : error ? "Retry save" : "Save contact attempt"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className={outlineBtn}>
        Cancel
      </button>
    </div>
  </form>
  );

  if (alwaysOpen) {
    return (
      <Card>
        {form}
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-extrabold">Contact attempts</h2>
      <AttemptList attempts={c.contact_attempts} />
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className={outlineBtn}>
          {c.contact_attempts.length ? "Another attempt" : "Record contact attempt"}
        </button>
      ) : (
        {form}
      )}
      <p className="text-sm font-bold text-brand-900">
        Request acknowledged ≠ contact made · Contact made ≠ home visit completed
      </p>
    </Card>
  );
}
