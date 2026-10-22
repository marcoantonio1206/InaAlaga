"use client";

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
import { STATE_LABEL, bhwState, openVisit, completedVisit } from "@/lib/bhwStatus";
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
  const [modal, setModal] = useState(null); // accept | schedule | outcome | ack | attempt

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
  const open = openVisit(c);
  const done = completedVisit(c);
  const late = state === "completed" ? null : overdueLabel(c.due_at, now);
  const otherStation = c.station_name && c.station_name !== worker.station;
  // Unassigned cases wait for coordinator review; no worker action applies yet.
  const canAct = !otherStation && c.handoff_state !== "unassigned";
  const canAccept = c.handoff_state === "pending" && !otherStation;
  const canSchedule = c.handoff_state === "acknowledged" && !open && !done && !otherStation;

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-900 text-base font-bold text-white"
            >
              {initials(c.alias)}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-900">Mother alias</p>
              <p className="text-xl font-extrabold leading-tight">{c.alias}</p>
              <Pill tone={s.tone}>
                <Icon name={s.icon} size={14} className="mr-1" />
                {s.label}
              </Pill>
            </div>
          </div>
          <Item label="Case ID" value={c.id} />
        </div>
        <p className={`text-sm ${late ? "text-warn-ink" : "text-muted"}`}>
          {c.barangay} · {c.station_name ?? "No station"} · Demo follow-up target {formatDotYear(c.due_at)}
          {late ? ` · ${late}` : ""}
        </p>
        {otherStation ? (
          <p className="text-sm text-warn-ink">
            This case belongs to {c.station_name}. You are acting as {worker.name} ({worker.station});
            actions are disabled across stations.
          </p>
        ) : null}
      </Card>

      {/* 01 Responsibility → home follow-up → outcome */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-extrabold">Responsibility</h2>
          {c.handoff_state === "acknowledged" ? (
            <>
              <Pill tone="ok">Accepted</Pill>
              <p className="font-bold">
                {c.owner_worker} · {formatDot(c.acknowledged_at)}
              </p>
            </>
          ) : c.handoff_state === "unassigned" ? (
            <>
              <Pill tone="warn">Unassigned</Pill>
              <p className="text-sm text-muted">A coordinator must review the assignment first.</p>
            </>
          ) : (
            <>
              <Pill tone="lilac">Awaiting worker acceptance</Pill>
              <p className="text-sm text-muted">Assignment to a station is not acceptance.</p>
              {canAccept ? (
                <button type="button" onClick={() => setModal("accept")} className={primaryBtn}>
                  Accept responsibility
                </button>
              ) : null}
            </>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-extrabold">Home follow-up</h2>
          {done ? (
            <>
              <Pill tone="ok">Home visit completed</Pill>
              <p className="font-bold">
                {formatDot(done.started_at ?? done.scheduled_for)} to {formatDot(done.ended_at ?? done.scheduled_for)} ·{" "}
                {done.worker_name}
              </p>
            </>
          ) : open ? (
            <>
              <Pill tone={state === "update_needed" ? "warn" : "lilac"}>
                {state === "update_needed" ? "Update needed · awaiting visit update" : "Scheduled · visit remains open"}
              </Pill>
              <p className="font-bold">
                {formatDot(open.scheduled_for)} · Home · Visitor {open.worker_name}
              </p>
              {!otherStation ? (
                <button type="button" onClick={() => setModal("outcome")} className={primaryBtn}>
                  Record visit outcome
                </button>
              ) : null}
            </>
          ) : (
            <>
              <Pill tone="lilac">No visit scheduled</Pill>
              <p className="text-sm text-muted">
                {c.handoff_state === "acknowledged"
                  ? "Schedule the first home follow-up."
                  : "Available after a worker accepts responsibility."}
              </p>
              {canSchedule ? (
                <button type="button" onClick={() => setModal("schedule")} className={primaryBtn}>
                  Schedule home follow-up
                </button>
              ) : null}
            </>
          )}
        </Card>
      </div>

      {/* 02 Optional contact request */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-extrabold">Contact requests</h2>
          {c.request_state === "none" ? (
            <p className="text-sm text-muted">No contact request from the mother.</p>
          ) : c.request_state === "acknowledged" ? (
            <>
              <Pill tone="ok">Request acknowledged</Pill>
              <p className="font-bold">
                {c.request_acknowledged_by} · {formatDot(c.request_acknowledged_at)}
              </p>
              <p className="text-sm text-muted">Acknowledgment is not contact.</p>
            </>
          ) : (
            <>
              <Pill tone="warn">Mother recorded “Please contact me”</Pill>
              <p className="text-sm text-muted">Awaiting acknowledgment.</p>
              {canAct ? (
                <button type="button" onClick={() => setModal("ack")} className={primaryBtn}>
                  Acknowledge request
                </button>
              ) : null}
            </>
          )}
        </Card>
        <Card>
          <h2 className="text-lg font-extrabold">Contact attempts</h2>
          <AttemptList attempts={c.contact_attempts} />
          {canAct ? (
            <button type="button" onClick={() => setModal("attempt")} className={outlineBtn}>
              {c.contact_attempts.length ? "Another attempt" : "Record contact attempt"}
            </button>
          ) : null}
          <p className="text-xs font-bold text-brand-900">
            Request acknowledged ≠ contact made · Contact made ≠ home visit completed
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-extrabold">Discharge details (read only)</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <Item label="Birth" value={formatDotYear(c.birth_at)} />
          <Item label="Discharged" value={formatDotYear(c.discharge_at)} />
          <Item label="Discharge facility" value="Cagayan Valley Medical Center" />
          <Item label="Recorded" value={formatDotYear(c.recorded_at ?? c.discharge_at)} />
        </div>
      </Card>

      <EventHistory c={c} />

      {/* Action modals */}
      <Modal open={modal === "accept"} onClose={close} title="Accept responsibility" subtitle="Review before confirming">
        <AcceptCard c={c} worker={worker} onSaved={onSaved} onRefresh={() => { close(); refresh(); }} />
      </Modal>
      <Modal open={modal === "schedule"} onClose={close} title="Schedule home follow-up" subtitle="Date and time in Asia/Manila">
        <ScheduleForm c={c} worker={worker} onSaved={onSaved} />
      </Modal>
      <Modal open={modal === "outcome"} onClose={close} title="Record home-visit outcome" subtitle="Only a saved outcome completes the visit">
        {open ? (
          <VisitOutcomeForm c={c} visit={open} updateNeeded={state === "update_needed"} onSaved={onSaved} />
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
