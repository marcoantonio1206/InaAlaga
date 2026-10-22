"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageHeader from "@/components/hospital/PageHeader";
import Pill from "@/components/hospital/Pill";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import AcceptCard from "@/components/bhw/AcceptCard";
import ScheduleForm from "@/components/bhw/ScheduleForm";
import VisitOutcomeForm from "@/components/bhw/VisitOutcomeForm";
import ContactRequestCard from "@/components/bhw/ContactRequestCard";
import ContactAttemptForm from "@/components/bhw/ContactAttemptForm";
import EventHistory from "@/components/bhw/EventHistory";
import { Loading, LoadFailed } from "@/components/bhw/LoadState";
import { getCaseById, getDemoNow } from "@/lib/data";
import { useWorker } from "@/lib/bhwWorkers";
import { STATE_LABEL, bhwState, openVisit, completedVisit } from "@/lib/bhwStatus";
import { formatDot, formatDotYear, initials, overdueLabel } from "@/lib/format";

function Item({ label, value }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

export default function BhwCaseDetailPage() {
  const { caseId } = useParams();
  const { worker } = useWorker();
  const now = getDemoNow();
  const [c, setC] = useState(undefined); // undefined loading · null not found · false failed
  const [attempt, setAttempt] = useState(0);

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

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);
  const onSaved = useCallback((updated) => setC(updated), []);

  const back = (
    <Link
      href="/bhw"
      className="mb-4 inline-flex h-11 items-center rounded-xl border border-brand-200 bg-white px-4 font-bold text-brand-900"
    >
      ‹ Back to cases
    </Link>
  );

  if (c === undefined) return <Loading />;
  if (c === false) {
    return (
      <>
        <PageHeader title="Case detail" />
        {back}
        <LoadFailed message="Couldn't load this case." onRetry={refresh} />
      </>
    );
  }
  if (c === null) {
    return (
      <>
        <PageHeader title="Case detail" />
        {back}
        <Card>
          <p className="font-bold">This record was not found.</p>
        </Card>
      </>
    );
  }

  const state = bhwState(c, now);
  const s = STATE_LABEL[state];
  const open = openVisit(c);
  const done = completedVisit(c);
  const late = state === "completed" ? null : overdueLabel(c.due_at, now);
  const otherStation = c.station_name && c.station_name !== worker.station;

  return (
    <>
      <PageHeader title="Case detail" subtitle="Shared record · each action has its own saved state" />
      {back}
      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-900 text-lg font-bold text-white"
            >
              {initials(c.alias)}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm font-bold text-brand-900">Mother alias</p>
              <p className="text-xl font-extrabold">{c.alias}</p>
              <p className="text-sm text-muted">
                {c.id} · {c.barangay} · {c.station_name ?? "No station"}
              </p>
              <Pill tone={s.tone}>
                <Icon name={s.icon} size={14} className="mr-1" />
                {s.label}
              </Pill>
            </div>
          </div>
          <p className={`text-sm ${late ? "text-warn-ink" : "text-muted"}`}>
            Demo follow-up target {formatDotYear(c.due_at)}
            {late ? ` · ${late}` : ""} · administrative target, not clinical urgency
          </p>
          {otherStation ? (
            <p className="text-sm text-warn-ink">
              This case belongs to {c.station_name}. You are acting as {worker.name} ({worker.station}
              ); actions here would be cross-station.
            </p>
          ) : null}
        </Card>

        {/* 01 Responsibility → home follow-up → outcome */}
        <AcceptCard c={c} worker={worker} onSaved={onSaved} onRefresh={refresh} />

        {c.handoff_state === "acknowledged" && !open && !done ? (
          <ScheduleForm c={c} worker={worker} onSaved={onSaved} />
        ) : null}

        {open ? (
          <VisitOutcomeForm
            c={c}
            visit={open}
            updateNeeded={state === "update_needed"}
            onSaved={onSaved}
          />
        ) : null}

        {done ? (
          <Card tone="tint">
            <h2 className="text-xl font-extrabold">Home visit completed</h2>
            <p className="font-bold">
              {formatDot(done.started_at ?? done.scheduled_for)} to{" "}
              {formatDot(done.ended_at ?? done.scheduled_for)} · Visitor {done.worker_name}
            </p>
            <p className="text-sm text-muted">
              Its own outcome is saved and the event is recorded
              {done.completed_recorded_at ? ` · recorded ${formatDot(done.completed_recorded_at)}` : ""}.
            </p>
          </Card>
        ) : null}

        {/* 02 Optional contact request */}
        <div className="grid gap-4 md:grid-cols-2">
          <ContactRequestCard c={c} worker={worker} onSaved={onSaved} />
          <ContactAttemptForm key={c.request_state} c={c} worker={worker} onSaved={onSaved} />
        </div>

        {/* Read-only discharge */}
        <Card>
          <h2 className="text-xl font-extrabold">Discharge details (read only)</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Item label="Birth" value={formatDotYear(c.birth_at)} />
            <Item label="Discharged" value={formatDotYear(c.discharge_at)} />
            <Item label="Discharge facility" value="Cagayan Valley Medical Center" />
            <Item label="Recorded" value={formatDotYear(c.recorded_at ?? c.discharge_at)} />
          </div>
          <p className="text-sm text-muted">Hospital staff own these fields. Fictional record.</p>
        </Card>

        <EventHistory c={c} />
        <p className="text-sm text-muted">
          Fictional demo. No login, triage, maps, rescheduling or reassignment flow. Not monitored for
          emergencies.
        </p>
      </div>
    </>
  );
}
