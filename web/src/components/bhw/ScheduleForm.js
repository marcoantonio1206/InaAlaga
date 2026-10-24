"use client";

import useCurrentTime from "@/lib/hooks/useCurrentTime";
import { assertFutureVisit, earliestVisitTime } from "@/lib/visitTiming";
import { displayStationName } from "@/lib/format";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Field, { controlClass } from "@/components/hospital/Field";
import { scheduleVisit } from "@/lib/data";
import { toManilaIso, toManilaLocalInput } from "@/lib/validation";
import useSave, { primaryBtn } from "./useSave";
import { VISIT_STATIONS } from "@/lib/visitLocation";

export default function ScheduleForm({ c, worker, onSaved }) {
  const now = useCurrentTime();
  const minimum = new Date(Math.max(Date.parse(earliestVisitTime(now)), Date.parse(c.discharge_at))).toISOString();
  const [when, setWhen] = useState(() => !c.visits.length && Date.parse(c.due_at) >= Date.parse(minimum) ? toManilaLocalInput(c.due_at) : "");
  const [locationType, setLocationType] = useState("home");
  const [stationName, setStationName] = useState(c.station_name || VISIT_STATIONS[0].name);
  const [fieldError, setFieldError] = useState(null);
  const { saving, error, run } = useSave(scheduleVisit, onSaved);

  function submit(e) {
    e.preventDefault();
    if (!when) return setFieldError("Enter the date and time of the visit.");
    if (new Date(toManilaIso(when)) < new Date(c.discharge_at)) {
      return setFieldError("The follow-up cannot be before discharge.");
    }
    try { assertFutureVisit(toManilaIso(when)); } catch (error) { return setFieldError(error.message); }
    setFieldError(null);
    run(c.id, { scheduled_for: toManilaIso(when), worker_name: worker.name,
      location_type: locationType, station_name: locationType === "station" ? stationName : null });
  }

  return (
    <Card>
      <p className="text-sm text-muted">
        Choose a future date and time in Philippine time. The current worker is recorded as visitor. A saved schedule
        appears for the mother and on your Schedule. Exact duplicate start times are blocked; travel time and visit duration are not checked.
      </p>
      {c.visits.some((v) => v.state === "scheduled") ? <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-900">This adds a separate visit. Existing appointments stay scheduled.</p> : null}
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <Field label="Visit type" htmlFor="sched-type">
          <select id="sched-type" value={locationType} onChange={(e) => setLocationType(e.target.value)} className={controlClass(false)}>
            <option value="home">Home visit</option>
            <option value="station">Station check-up</option>
          </select>
        </Field>
        {locationType === "station" ? (
          <Field label="Check-up station" htmlFor="sched-station">
            <select id="sched-station" value={stationName} onChange={(e) => setStationName(e.target.value)} className={controlClass(false)}>
              {VISIT_STATIONS.map((s) => <option key={s.name} value={s.name}>{displayStationName(s.name)}</option>)}
            </select>
            <p className="mt-1 text-xs text-muted">Visit destination only. The assigned station for this case stays unchanged.</p>
          </Field>
        ) : null}
        <Field label="Date and time" htmlFor="sched-when" error={fieldError}>
          <input
            id="sched-when"
            type="datetime-local"
            min={toManilaLocalInput(minimum)}
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
