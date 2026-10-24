"use client";

import { displayStationName } from "@/lib/format";
import { groupVisits } from "@/lib/visits";

import { visitTypeLabel, visitDestination } from "@/lib/visitLocation";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Pill from "@/components/hospital/Pill";
import { Modal } from "@/components/ui/Overlay";
import AcceptCard from "@/components/bhw/AcceptCard";
import ScheduleForm from "@/components/bhw/ScheduleForm";
import VisitOutcomeForm from "@/components/bhw/VisitOutcomeForm";
import ContactRequestCard from "@/components/bhw/ContactRequestCard";
import ContactAttemptForm, { AttemptList } from "@/components/bhw/ContactAttemptForm";
import EventHistory from "@/components/bhw/EventHistory";
import { Loading, LoadFailed } from "@/components/bhw/LoadState";
import { getCaseById, getDemoNow } from "@/lib/data";
import { useWorker } from "@/lib/bhwWorkers";
import { STATE_LABEL, bhwState } from "@/lib/bhwStatus";
import { formatDot, formatDotYear, initials, overdueLabel } from "@/lib/format";
import { primaryBtn, outlineBtn } from "@/components/bhw/useSave";

function Item({ label, value }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

// Case detail rendered inside the slide-over. Status cards summarise each
// saved state; every action opens its own modal. `onChanged` lets the list
// behind the panel refresh after a save.
export default function CaseDetail({ caseId, onChanged }) {
  const { worker } = useWorker();
  const now = getDemoNow();
  const [c, setC] = useState(undefined); // undefined loading · null not found · false failed
  const [attempt, setAttempt] = useState(0);
  const [outcomeVisitId, setOutcomeVisitId] = useState(null);
  const [modal, setModal] = useState(null); // accept | schedule | outcome | ack | attempt

  useEffect(() => {
    const update = () => setAttempt((n) => n + 1);
    const timer = setInterval(update, 5000);
    window.addEventListener("storage", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    let active = true;
    getCaseById(caseId)
      .then((data) => {
        if (active) setC(data);
      })
      .catch(() => {
        if (active) setC(false);
      });
    return () => {
      active = false;
    };
  }, [caseId, attempt]);

  const refresh = () => setAttempt((n) => n + 1);
  const close = () => setModal(null);
  function onSaved(updated) {
    setC(updated);
    setModal(null);
    if (onChanged) onChanged(updated);
  }

  if (c === undefined) return <Loading />;
  if (c === false) return <LoadFailed message="Couldn't load this case." onRetry={refresh} />;
  if (c === null) {
    return (
      <Card>
        <p className="font-bold">This record was not found.</p>
      </Card>
    );
  }

  const state = bhwState(c, now);
  const s = STATE_LABEL[state];
  const { next, future, scheduled, previous } = groupVisits(c.visits);
  const outcomeVisit = scheduled.find((v) => v.id === outcomeVisitId);
  const late = state === "completed" ? null : overdueLabel(c.due_at, now);
  const otherStation = c.station_name && c.station_name !== worker.station;
  // Unassigned cases wait for coordinator review; no worker action applies yet.
  const canAct = !otherStation && c.handoff_state !== "unassigned";
  const canAccept = c.handoff_state === "pending" && !otherStation;
  const canSchedule = c.handoff_state === "acknowledged" && !otherStation;

  function outcomeButton(visit) {
    if (otherStation) return null;
    return <button type="button" onClick={() => { setOutcomeVisitId(visit.id); setModal("outcome"); }}
      className={outlineBtn} aria-label={`Record outcome for ${formatDot(visit.scheduled_for)}`}>Record visit outcome</button>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 aspect-square items-center justify-center rounded-full bg-brand-900 font-bold text-white">{initials(c.alias)}</span>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold">{c.alias}</h2>
              <p className="text-sm text-muted">{c.id} · {c.barangay}</p>
            </div>
          </div>
          <Pill tone={s.tone}><Icon name={s.icon} size={14} className="mr-1" />{s.label}</Pill>
        </div>
        <div className="grid gap-4 border-t border-brand-200 pt-3 sm:grid-cols-3">
          <Item label="Coordinating station" value={displayStationName(c.station_name) || "Not assigned"} />
          <div>
            <Item label="Assigned worker" value={c.handoff_state === "acknowledged" ? c.owner_worker || "Details pending" : "Awaiting acceptance"} />
            {c.handoff_state === "acknowledged" ? <p className="mt-1 text-xs text-success-ink">Accepted · {formatDot(c.acknowledged_at)}</p> : null}
          </div>
          <div>
            <Item label="Follow-up target" value={formatDotYear(c.due_at)} />
            {late ? <p className="mt-1 text-sm text-warn-ink">{late}</p> : null}
          </div>
        </div>
        {c.handoff_state === "unassigned" ? <p className="text-sm text-muted">A coordinator must assign a station before a worker can accept this case.</p> : null}
        {canAccept ? <div><button type="button" onClick={() => setModal("accept")} className={primaryBtn}>Accept responsibility</button></div> : null}
        {otherStation ? <p className="text-sm text-warn-ink">This case belongs to {displayStationName(c.station_name)}. Switch to a worker at that station to take action.</p> : null}
      </Card>

      <Card className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">Follow-up visits</h2>
          {canSchedule ? <button type="button" onClick={() => setModal("schedule")} className={primaryBtn}>{c.visits.length ? "Schedule another visit" : "Schedule visit"}</button> : null}
        </div>
        {next ? <div className="flex flex-col gap-3 rounded-xl border border-brand-600 bg-brand-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-brand-900">Next visit</h3>
            {new Date(next.scheduled_for) < new Date(now) ? <Pill tone="warn">Awaiting visit update</Pill> : null}
          </div>
          <p className="text-2xl font-extrabold">{formatDot(next.scheduled_for)}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <p>{visitTypeLabel(next)} · {displayStationName(visitDestination(next))}</p>
            <p className="text-muted">Worker: {next.worker_name}</p>
          </div>
          <div>{outcomeButton(next)}</div>
        </div> : <p className="text-sm text-muted">{canSchedule ? "No upcoming visit scheduled." : "Visits can be scheduled after a worker accepts responsibility."}</p>}
        {future.length ? <section className="flex flex-col gap-2" aria-labelledby="bhw-future-heading">
          <h3 id="bhw-future-heading" className="font-bold text-future-ink">Future visits ({future.length})</h3>
          {future.map((visit) => <details key={visit.id} className="group rounded-xl border border-future-border bg-future-bg px-4 py-3">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">{formatDot(visit.scheduled_for)}</span>
                <span className="text-xs font-bold text-brand-900"><span className="group-open:hidden">View details</span><span className="hidden group-open:inline">Hide details</span></span>
              </div>
              <p className="mt-1 text-sm">{visitTypeLabel(visit)} · {displayStationName(visitDestination(visit))}</p>
            </summary>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-future-border pt-3">
              <p className="text-sm text-muted">Worker: {visit.worker_name}</p>
              {new Date(visit.scheduled_for) < new Date(now) ? <Pill tone="warn">Awaiting visit update</Pill> : null}
              {outcomeButton(visit)}
            </div>
          </details>)}
        </section> : null}
        {previous.length ? <details className="border-t border-brand-200 pt-3">
          <summary className="cursor-pointer font-bold">Previous visits ({previous.length})</summary>
          <ul className="mt-3 flex flex-col gap-3">{previous.map((visit) => <li key={visit.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-brand-50 p-3 text-sm">
            <div className="flex flex-col gap-1">
              <p className="font-bold">{formatDot(visit.scheduled_for)}</p>
              <p>{visitTypeLabel(visit)} · {displayStationName(visitDestination(visit))}</p>
              <p className="text-muted">Worker: {visit.worker_name}</p>
            </div>
            <Pill tone={visit.state === "completed" ? "ok" : "lilac"}>{visit.state === "completed" ? "Completed" : "Cancelled"}</Pill>
          </li>)}</ul>
        </details> : null}
      </Card>

      <Card className="gap-3">
        <h2 className="text-xl font-extrabold">Contact with mother</h2>
        <div className="grid items-start gap-4 md:grid-cols-2">
          <section className="flex flex-col items-start gap-2" aria-labelledby="bhw-request-heading">
            <h3 id="bhw-request-heading" className="font-bold">Contact request</h3>
            {c.request_state === "none" ? <p className="text-sm text-muted">No contact request from the mother.</p>
              : c.request_state === "acknowledged" ? <>
                <Pill tone="ok">Request acknowledged</Pill>
                <p className="text-sm">{c.request_acknowledged_by} · {formatDot(c.request_acknowledged_at)}</p>
              </> : <>
                <Pill tone="warn">Awaiting acknowledgment</Pill>
                <p className="text-sm">Mother requested “Please contact me”.</p>
                {canAct ? <button type="button" onClick={() => setModal("ack")} className={primaryBtn}>Acknowledge request</button> : null}
              </>}
          </section>
          <section className="flex flex-col gap-2 border-t border-brand-200 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-4" aria-labelledby="bhw-attempt-heading">
            <h3 id="bhw-attempt-heading" className="font-bold">Contact attempts</h3>
            <AttemptList attempts={c.contact_attempts} />
            {canAct ? <div><button type="button" onClick={() => setModal("attempt")} className={outlineBtn}>{c.contact_attempts.length ? "Record another attempt" : "Record contact attempt"}</button></div> : null}
            <p className="text-xs text-muted">Acknowledging a request does not record contact. Save the contact result here.</p>
          </section>
        </div>
      </Card>

      <Card>
        <details>
          <summary className="cursor-pointer text-lg font-extrabold">Discharge details <span className="text-sm font-normal text-muted">· Read only</span></summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Item label="Birth" value={formatDotYear(c.birth_at)} />
            <Item label="Discharged" value={formatDotYear(c.discharge_at)} />
            <Item label="Discharge facility" value="Cagayan Valley Medical Center" />
            <Item label="Recorded" value={formatDotYear(c.recorded_at ?? c.discharge_at)} />
          </div>
        </details>
      </Card>
      <EventHistory c={c} />

      {/* Action modals */}
      <Modal open={modal === "accept"} onClose={close} title="Accept responsibility" subtitle="Review before confirming">
        <AcceptCard c={c} worker={worker} onSaved={onSaved} onRefresh={() => { close(); refresh(); }} />
      </Modal>
      <Modal open={modal === "schedule"} onClose={close} title="Schedule visit" subtitle="Date and time in Asia/Manila">
        <ScheduleForm c={c} worker={worker} onSaved={onSaved} />
      </Modal>
      <Modal open={modal === "outcome"} onClose={close} title="Record visit outcome" subtitle="Only a saved outcome completes the visit">
        {outcomeVisit ? (
          <VisitOutcomeForm key={outcomeVisit.id} c={c} visit={outcomeVisit} updateNeeded={new Date(outcomeVisit.scheduled_for) < new Date(now)} onSaved={onSaved} />
        ) : null}
      </Modal>
      <Modal open={modal === "ack"} onClose={close} title="Acknowledge request" subtitle="Review the mother's request first">
        <ContactRequestCard c={c} worker={worker} onSaved={onSaved} />
      </Modal>
      <Modal open={modal === "attempt"} onClose={close} title="Record contact attempt" subtitle="Keep the contact result separate from the visit outcome">
        <ContactAttemptForm c={c} worker={worker} onSaved={onSaved} alwaysOpen onCancel={close} />
      </Modal>
    </div>
  );
}
