"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useCurrentTime from "@/lib/hooks/useCurrentTime";
import useLiveResource from "@/lib/hooks/useLiveResource";
import PageHeader from "@/components/hospital/PageHeader";
import Pill from "@/components/hospital/Pill";
import RefreshStatus from "@/components/bhw/RefreshStatus";
import MotherDetails from "@/components/case/MotherDetails";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { SlideOver } from "@/components/ui/Overlay";
import { getCaseById, listCases } from "@/lib/data";
import { groupOverview } from "@/lib/coordinatorOverview";
import { formatDotYear, initials } from "@/lib/format";

// Read-only record view: the coordinator observes; actions stay with facility staff and BHWs.
function CaseView({ caseId }) {
  const now = useCurrentTime();
  const load = useCallback(() => getCaseById(caseId), [caseId]);
  const { data: c, error, refreshing, refresh } = useLiveResource(load);

  if (c === undefined) return <Card className="sm:px-6"><p className="text-muted">{error ? "Couldn’t load this record." : "Loading…"}</p>{error ? <button type="button" onClick={refresh} className="w-fit rounded-xl bg-brand-900 px-5 py-3 font-bold text-white">Retry</button> : null}</Card>;
  if (c === null) return <Card className="sm:px-6"><p className="font-bold">This record was not found.</p></Card>;
  return <div className="flex flex-col gap-1">
    <RefreshStatus refreshing={refreshing} refresh={refresh} error={error} subject="this record" />
    <MotherDetails c={c} now={now} idPrefix="coordinator"
      contactComplete={c.visits.some((v) => v.state === "completed") || c.contact_attempts.some((a) => a.outcome === "reached")}
      unassignedMessage={c.handoff_state === "unassigned" ? "Facility staff can assign a BHW from the patient list." : null}
    />
  </div>;
}

function Group({ group, onOpen }) {
  return (
    <Card className="sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Icon name={group.icon} size={18} />
            {group.title}
          </h2>
          <p className="text-sm text-muted">{group.hint}</p>
        </div>
        <span className="shrink-0 whitespace-nowrap">
          <Pill tone={group.items.length ? group.tone : "ok"}>
            {group.items.length ? `${group.items.length} ${group.items.length === 1 ? "case" : "cases"}` : "None"}
          </Pill>
        </span>
      </div>
      {group.items.length ? (
        <ul className="flex flex-col divide-y divide-brand-200">
          {group.items.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onOpen(c.id)} className="flex w-full items-center gap-3 py-2 text-left hover:bg-brand-50">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">{initials(c.alias)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{c.alias} <span className="text-xs font-normal text-muted">{c.id}</span></span>
                  <span className="block text-sm text-muted">{group.detail(c, group.now)}</span>
                </span>
                <span aria-hidden="true" className="text-brand-900">›</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No saved records need attention here.</p>
      )}
    </Card>
  );
}

function OverviewScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("case");
  const now = useCurrentTime();
  const { data: cases, error, refreshing, refresh } = useLiveResource(listCases);
  const groups = useMemo(() => (cases ? groupOverview(cases, now).map((g) => ({ ...g, now })) : []), [cases, now]);

  const openCase = useCallback((id) => router.push(`/coordinator/overview?case=${id}`), [router]);
  const close = useCallback(() => router.push("/coordinator/overview"), [router]);

  return (
    <>
      <PageHeader showDemo={false} title="Overview" subtitle={`Saved activity as of ${formatDotYear(now)} Philippine time`} />
      <p className="mb-3 flex items-start gap-2 rounded-xl border border-brand-200 bg-white p-3 text-sm sm:px-6">
        <Icon name="list" size={18} className="mt-0.5 shrink-0 text-brand-900" />
        <span>
          <span className="font-bold">Saved records from this app.</span> These counts come from cases entered by facility
          staff and updated by BHWs. They are separate from the Planning simulation results.
        </span>
      </p>
      {error && cases === undefined ? (
        <div className="rounded-2xl border border-brand-200 bg-white p-6">
          <p className="mb-3 font-bold">Couldn&apos;t load saved activity.</p>
          <button type="button" onClick={refresh} className="h-12 rounded-xl bg-brand-900 px-6 font-bold text-white">Retry</button>
        </div>
      ) : cases === undefined ? (
        <p className="p-6 text-muted">Loading…</p>
      ) : (
        <>
          <RefreshStatus refreshing={refreshing} refresh={refresh} error={error} subject="saved activity" />
          <p className="mb-3 text-sm text-muted">{cases.length} saved {cases.length === 1 ? "case" : "cases"} in total. A case can appear in more than one group.</p>
          <div className="grid gap-3 lg:grid-cols-2">
            {groups.map((g) => <Group key={g.key} group={g} onOpen={openCase} />)}
          </div>
          <p className="mt-3 text-xs text-muted">Follow-up targets and visit updates are administrative, not clinical urgency.</p>
        </>
      )}
      <SlideOver open={Boolean(selectedId)} onClose={close} title="Mother details" subtitle="Read-only · saved records" showDemo={false} stickyHeader>
        {selectedId ? <CaseView key={selectedId} caseId={selectedId} /> : null}
      </SlideOver>
    </>
  );
}

export default function CoordinatorOverviewPage() {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Loading…</p>}>
      <OverviewScreen />
    </Suspense>
  );
}
