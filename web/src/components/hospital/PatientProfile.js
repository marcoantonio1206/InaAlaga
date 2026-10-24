"use client";

import useCurrentTime from "@/lib/hooks/useCurrentTime";
import { useCallback } from "react";
import useLiveResource from "@/lib/hooks/useLiveResource";
import MotherDetails from "@/components/case/MotherDetails";
import Card from "@/components/ui/Card";
import AssignBhw from "@/components/hospital/AssignBhw";
import MotherLink from "@/components/hospital/MotherLink";
import { getCaseById, getMotherLink } from "@/lib/data";

export default function PatientProfile({ caseId, onChanged }) {
  const now = useCurrentTime();
  const load = useCallback(async () => {
    const [caseData, link] = await Promise.all([getCaseById(caseId), getMotherLink(caseId).catch(() => false)]);
    return { caseData, link };
  }, [caseId]);
  const { data, error, refreshing, refresh } = useLiveResource(load);
  const c = data?.caseData;
  const link = data?.link;

  if (c === undefined) return <Card><p className="text-muted">{error ? "Couldn’t load this record." : "Loading…"}</p>{error ? <button type="button" onClick={refresh} className="w-fit rounded-xl bg-brand-900 px-5 py-3 font-bold text-white">Retry</button> : null}</Card>;
  if (c === null) return <Card><p className="font-bold">This record was not found.</p><button type="button" onClick={refresh} className="w-fit font-bold text-brand-900 underline">Refresh</button></Card>;

  return <div className="flex flex-col gap-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-muted">Updates automatically</p>
      <button type="button" onClick={refresh} disabled={refreshing} className="rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-bold text-brand-900 disabled:opacity-50">{refreshing ? "Refreshing…" : "Refresh"}</button>
    </div>
    {error ? <p role="status" className="rounded-xl bg-warn-bg p-3 text-sm text-warn-ink">Couldn’t refresh this record. Showing the last loaded details. <button type="button" onClick={refresh} className="font-bold underline">Retry</button></p> : null}
    <MotherDetails c={c} now={now} idPrefix="facilitator"
      contactComplete={c.visits.some((v) => v.state === "completed") || c.contact_attempts.some((a) => a.outcome === "reached")}
      unassignedMessage={c.handoff_state === "unassigned" ? "Choose a BHW to assign this case." : null}
      summaryAction={c.handoff_state === "unassigned" ? <AssignBhw caseId={c.id} onSaved={(updated) => { refresh(); onChanged?.(updated); }} /> : null}
    >
      <Card>{link === undefined ? <p className="text-sm text-muted">Loading link…</p> : <MotherLink link={link} />}</Card>
    </MotherDetails>
  </div>;
}
