import { followupOverdueLabel, visitNeedsUpdate } from "@/lib/visitTiming";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Pill from "@/components/hospital/Pill";
import { AttemptList } from "@/components/bhw/ContactAttemptForm";
import EventHistory from "@/components/bhw/EventHistory";
import { STATE_LABEL, bhwState } from "@/lib/bhwStatus";
import { displayStationName, formatDot, formatDotYear, initials } from "@/lib/format";
import { groupVisits } from "@/lib/visits";
import { visitTypeLabel, visitDestination } from "@/lib/visitLocation";

function Item({ label, value }) {
  return <div><p className="text-sm text-muted">{label}</p><p className="font-bold">{value}</p></div>;
}

function savedTime(at, year = true) {
  return at ? (year ? formatDotYear(at) : formatDot(at)) : "Time not recorded";
}

// One information layout for both staff roles. Actions remain owned by the
// caller; this component does not load records, write data or grant permissions.
export default function MotherDetails({
  c, now, idPrefix = "mother", summaryAction, stationNotice, scheduleAction,
  outcomeButton, acknowledgeAction, attemptAction, unassignedMessage,
  emptyVisitMessage = "No upcoming visit scheduled.", savedTimesOnly = true, contactComplete = false,
  contactHint = "Request acknowledgment and contact outcomes are recorded separately.",
  children,
}) {
  const state = bhwState(c, now);
  const s = STATE_LABEL[state];
  const { next, future, previous } = groupVisits(c.visits);
  const late = contactComplete ? null : followupOverdueLabel(c, now);
  return <div className="flex flex-col gap-4">
      <Card className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 aspect-square items-center justify-center rounded-full bg-brand-900 font-bold text-white">{initials(c.alias)}</span>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold">{c.alias}</h2>
              <p className="text-sm text-muted">{c.id} · {c.barangay.replace(/outside demo area/i, "Outside covered area")}</p>
            </div>
          </div>
          <Pill tone={s.tone}><Icon name={s.icon} size={14} className="mr-1" />{s.label}</Pill>
        </div>
        <div className="grid gap-4 border-t border-brand-200 pt-3 sm:grid-cols-3">
          <Item label="Coordinating station" value={displayStationName(c.station_name) || "Not assigned"} />
          <div>
            <Item label="Assigned worker" value={c.handoff_state === "acknowledged" ? c.owner_worker || "Details pending" : c.handoff_state === "unassigned" ? "Not assigned" : c.assigned_worker || "Awaiting acceptance"} />
            {c.handoff_state === "acknowledged" ? <p className="mt-1 text-xs text-success-ink">Accepted · {savedTime(c.acknowledged_at, false)}</p> : null}
          </div>
          <div>
            <Item label="Follow-up target" value={formatDotYear(c.due_at)} />
            {late ? <p className="mt-1 text-sm text-warn-ink">{late}</p> : c.overdue_arranged_at ? <p className="mt-1 text-sm text-success-ink">Arranged with mother · {savedTime(c.overdue_arranged_at, false)} · {c.overdue_arranged_by}</p> : null}
          </div>
        </div>
        {unassignedMessage ? <p className="text-sm text-muted">{unassignedMessage}</p> : null}
        {c.handoff_state === "pending" && c.assigned_worker ? <p className="text-sm text-muted">Assigned to {c.assigned_worker} · Awaiting their acceptance.</p> : null}
        {summaryAction}
        {stationNotice}
      </Card>

      <Card className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">Follow-up visits</h2>
          {scheduleAction}
        </div>
        {next ? <div className="flex flex-col gap-3 rounded-xl border border-brand-600 bg-brand-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-brand-900">Next visit</h3>
            {next.arranged_at ? <Pill tone="ok">Arranged with mother</Pill> : visitNeedsUpdate(next, now) ? <Pill tone="warn">Awaiting visit update</Pill> : null}
          </div>
          <p className="text-2xl font-extrabold">{formatDot(next.scheduled_for)}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <p>{visitTypeLabel(next)} · {displayStationName(visitDestination(next))}</p>
            <p className="text-muted">Worker: {next.worker_name}</p>
          </div>
          {next.arranged_at ? <p className="text-xs text-muted">{next.arranged_by} · {savedTime(next.arranged_at)} · Visit outcome still pending.</p> : null}
          {outcomeButton ? <div>{outcomeButton(next)}</div> : null}
        </div> : <p className="text-sm text-muted">{emptyVisitMessage}</p>}
        {future.length ? <section className="flex flex-col gap-2" aria-labelledby={`${idPrefix}-future-heading`}>
          <h3 id={`${idPrefix}-future-heading`} className="font-bold text-future-ink">Future visits ({future.length})</h3>
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
              {visit.arranged_at ? <Pill tone="ok">Arranged with mother</Pill> : visitNeedsUpdate(visit, now) ? <Pill tone="warn">Awaiting visit update</Pill> : null}
              {outcomeButton?.(visit)}
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
          <section className="flex flex-col items-start gap-2" aria-labelledby={`${idPrefix}-request-heading`}>
            <h3 id={`${idPrefix}-request-heading`} className="font-bold">Contact request</h3>
            {c.request_state === "none" ? <p className="text-sm text-muted">No contact request from the mother.</p>
              : c.request_state === "acknowledged" ? <>
                <Pill tone="ok">Request acknowledged</Pill>
                <p className="text-sm">{c.request_acknowledged_by} · {savedTime(c.request_acknowledged_at, false)}</p>
              </> : <>
                <Pill tone="warn">Awaiting acknowledgment</Pill>
                <p className="text-sm">Mother requested “Please contact me”.</p>
                {acknowledgeAction}
              </>}
          </section>
          <section className="flex flex-col gap-2 border-t border-brand-200 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-4" aria-labelledby={`${idPrefix}-attempt-heading`}>
            <h3 id={`${idPrefix}-attempt-heading`} className="font-bold">Contact attempts</h3>
            <AttemptList attempts={c.contact_attempts} />
            {attemptAction}
            <p className="text-xs text-muted">{contactHint}</p>
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
            <Item label="Recorded" value={savedTime(savedTimesOnly ? c.recorded_at : c.recorded_at ?? c.discharge_at)} />
          </div>
        </details>
      </Card>
      <EventHistory c={c} savedTimesOnly={savedTimesOnly} />
      {children}
    </div>;
}
