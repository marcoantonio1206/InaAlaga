"use client";

import useLiveResource from "@/lib/hooks/useLiveResource";
import RefreshStatus from "@/components/bhw/RefreshStatus";
import useCurrentTime from "@/lib/hooks/useCurrentTime";

import { displayStationName } from "@/lib/format";
import MotherDetails from "@/components/case/MotherDetails";
import { groupVisits } from "@/lib/visits";

import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import { Modal } from "@/components/ui/Overlay";
import { hasUnarrangedOverdue, visitNeedsUpdate } from "@/lib/visitTiming";
import ArrangeForm from "@/components/bhw/ArrangeForm";
import AcceptCard from "@/components/bhw/AcceptCard";
import ScheduleForm from "@/components/bhw/ScheduleForm";
import VisitOutcomeForm from "@/components/bhw/VisitOutcomeForm";
import ContactRequestCard from "@/components/bhw/ContactRequestCard";
import ContactAttemptForm from "@/components/bhw/ContactAttemptForm";
import { Loading, LoadFailed } from "@/components/bhw/LoadState";
import { getCaseById } from "@/lib/data";
import { useWorker } from "@/lib/bhwWorkers";
import { formatDot } from "@/lib/format";
import { primaryBtn, outlineBtn } from "@/components/bhw/useSave";

// Case detail rendered inside the slide-over. Status cards summarise each
// saved state; every action opens its own modal. `onChanged` lets the list
// behind the panel refresh after a save.
export default function CaseDetail({ caseId, onChanged }) {
  const { worker } = useWorker();
  const now = useCurrentTime();
  const load = useCallback(() => getCaseById(caseId), [caseId]);
  const { data: c, error, refreshing, refresh } = useLiveResource(load);
  const [outcomeVisitId, setOutcomeVisitId] = useState(null);
  const [modal, setModal] = useState(null); // accept | schedule | outcome | ack | attempt

  const close = () => setModal(null);
  function onSaved(updated) {
    refresh();
    setModal(null);
    if (onChanged) onChanged(updated);
  }

  if (c === undefined) return error ? <LoadFailed message="Couldn't load this case." onRetry={refresh} /> : <Loading />;
  if (c === null) {
    return (
      <Card>
        <p className="font-bold">This record was not found.</p>
        <button type="button" onClick={refresh} className={outlineBtn}>Refresh</button>
      </Card>
    );
  }

  const { scheduled } = groupVisits(c.visits);
  const outcomeVisit = scheduled.find((v) => v.id === outcomeVisitId);
  const otherStation = c.station_name && c.station_name !== worker.station;
  // Unassigned cases wait for facilitator assignment; no worker action applies yet.
  const canAct = !otherStation && c.handoff_state !== "unassigned";
  const assignedElsewhere = c.assigned_worker && c.assigned_worker !== worker.name;
  const canAccept = c.handoff_state === "pending" && !otherStation && !assignedElsewhere;
  const canArrange = c.owner_worker === worker.name && !otherStation && c.handoff_state === "acknowledged" && hasUnarrangedOverdue(c, now);
  const canSchedule = c.handoff_state === "acknowledged" && !otherStation;

  function outcomeButton(visit) {
    if (otherStation) return null;
    return <button type="button" onClick={() => { setOutcomeVisitId(visit.id); setModal("outcome"); }}
      className={outlineBtn} aria-label={`Record outcome for ${formatDot(visit.scheduled_for)}`}>Record visit outcome</button>;
  }

  return (
    <div className="flex flex-col gap-4">
      <RefreshStatus refreshing={refreshing} refresh={refresh} error={error} subject="this case" />
      <MotherDetails
        c={c} now={now} idPrefix="bhw" savedTimesOnly={false}
        unassignedMessage={c.handoff_state === "unassigned" ? "A facilitator must assign a BHW before the worker can accept this case." : null}
        summaryAction={canAccept ? <div><button type="button" onClick={() => setModal("accept")} className={primaryBtn}>Accept responsibility</button></div> : canArrange ? <div><button type="button" onClick={() => setModal("arrange")} className={primaryBtn}>Arranged with mother</button></div> : null}
        stationNotice={otherStation ? <p className="text-sm text-warn-ink">This case belongs to {displayStationName(c.station_name)}. Switch to a worker at that station to take action.</p> : null}
        scheduleAction={canSchedule ? <button type="button" onClick={() => setModal("schedule")} className={primaryBtn}>{c.visits.length ? "Schedule another visit" : "Schedule visit"}</button> : null}
        emptyVisitMessage={canSchedule ? "No upcoming visit scheduled." : "Visits can be scheduled after a worker accepts responsibility."}
        outcomeButton={outcomeButton}
        acknowledgeAction={canAct ? <button type="button" onClick={() => setModal("ack")} className={primaryBtn}>Acknowledge request</button> : null}
        attemptAction={canAct ? <div><button type="button" onClick={() => setModal("attempt")} className={outlineBtn}>{c.contact_attempts.length ? "Record another attempt" : "Record contact attempt"}</button></div> : null}
        contactHint="Acknowledging a request does not record contact. Save the contact result here."
      />

      {/* Action modals */}
      {modal === "arrange" ? <ArrangeForm c={c} worker={worker} onSaved={onSaved} onCancel={close} /> : null}
      <Modal open={modal === "accept"} onClose={close} title="Accept responsibility" subtitle="Review before confirming">
        <AcceptCard c={c} worker={worker} onSaved={onSaved} onRefresh={() => { close(); refresh(); }} />
      </Modal>
      <Modal open={modal === "schedule"} onClose={close} title="Schedule visit" subtitle="Date and time in Asia/Manila">
        <ScheduleForm c={c} worker={worker} onSaved={onSaved} />
      </Modal>
      <Modal open={modal === "outcome"} onClose={close} title="Record visit outcome" subtitle="Only a saved outcome completes the visit">
        {outcomeVisit ? (
          <VisitOutcomeForm key={outcomeVisit.id} c={c} visit={outcomeVisit} updateNeeded={visitNeedsUpdate(outcomeVisit, now)} onSaved={onSaved} />
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
