"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/hospital/PageHeader";
import Pill from "@/components/hospital/Pill";
import Icon from "@/components/ui/Icon";
import { SlideOver } from "@/components/ui/Overlay";
import CaseRow from "@/components/bhw/CaseRow";
import CaseDetail from "@/components/bhw/CaseDetail";
import { Loading, LoadFailed, Empty } from "@/components/bhw/LoadState";
import { listStationCases, getDemoNow } from "@/lib/data";
import { useWorker } from "@/lib/bhwWorkers";
import { STATE_LABEL, bhwState, visitLine, requestLine, openVisit } from "@/lib/bhwStatus";
import { visitTypeLabel, visitDestination } from "@/lib/visitLocation";
import { formatDot, formatDotYear, initials, overdueLabel, displayStationName } from "@/lib/format";

function FollowUpDetails({ caseData }) {
  const visit = openVisit(caseData);
  if (!visit) return <span className="whitespace-nowrap">{visitLine(caseData)}</span>;
  return (
    <div className="flex flex-col gap-1">
      <p className="whitespace-nowrap font-semibold">{visitTypeLabel(visit)}</p>
      <p className="whitespace-nowrap">{displayStationName(visitDestination(visit))}</p>
      <p className="whitespace-nowrap text-sm text-muted">{formatDot(visit.scheduled_for)} · {visit.worker_name}</p>
    </div>
  );
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Awaiting acceptance" },
  { key: "accepted", label: "Accepted" },
  { key: "scheduled", label: "Scheduled" },
  { key: "update_needed", label: "Update needed" },
  { key: "completed", label: "Completed" },
];

// /bhw?case=IA-0042 opens the case detail panel over the list.
function CasesScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("case");
  const { worker } = useWorker();
  const now = getDemoNow();
  const [cases, setCases] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;
    listStationCases(worker.station)
      .then((data) => {
        if (active) setCases({ station: worker.station, data });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [worker.station, attempt]);

  const list = cases && cases.station === worker.station ? cases.data : null;
  const openCase = useCallback((id) => router.push(`/bhw?case=${id}`), [router]);
  const closePanel = useCallback(() => router.push("/bhw"), [router]);
  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  const counts = useMemo(() => {
    const base = Object.fromEntries(FILTERS.map((f) => [f.key, 0]));
    (list ?? []).forEach((c) => {
      base.all += 1;
      const st = bhwState(c, now);
      if (st in base) base[st] += 1;
    });
    return base;
  }, [list, now]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (list ?? []).filter((c) => {
      if (filter !== "all" && bhwState(c, now) !== filter) return false;
      if (!q) return true;
      return c.alias.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    });
  }, [list, filter, query, now]);

  return (
    <>
      <PageHeader showDemo={false} title="Cases" subtitle={`${displayStationName(worker.station)} · As of: ${formatDotYear(now)}`} />
      <div className="mb-2 flex flex-col gap-1.5">
        <label htmlFor="search" className="text-sm font-bold">
          Search
        </label>
        <input
          id="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search mother alias or case ID"
          className="h-11 w-full rounded-lg border border-brand-200 bg-white px-3 text-base"
        />
      </div>
      <div className="mb-2 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              filter === f.key ? "bg-brand-900 text-white" : "bg-brand-200 text-brand-900"
            }`}
          >
            {f.label} · {counts[f.key]}
          </button>
        ))}
      </div>

      {failed ? (
        <LoadFailed
          message="Couldn't load the station inbox."
          onRetry={() => {
            setFailed(false);
            refresh();
          }}
        />
      ) : list === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty
          title={list.length === 0 ? "No cases assigned to this station yet." : "No cases match."}
          body="Cases arrive when hospital staff save a discharge routed to this station."
        />
      ) : (
        <>
          {/* Desktop: table, same pattern as the hospital list */}
          <div className="hidden overflow-x-auto rounded-2xl border border-brand-200 bg-white md:block">
            <table className="w-full min-w-[900px] text-left text-[15px]">
              <thead className="bg-brand-600 text-sm text-white">
                <tr>
                  <th className="px-4 py-3 font-bold">Mother / case</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Follow-up visit</th>
                  <th className="whitespace-nowrap px-4 py-3 font-bold">Follow-up target</th>
                  <th className="w-10 px-4 py-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const st = bhwState(c, now);
                  const sl = STATE_LABEL[st];
                  const late = st === "completed" ? null : overdueLabel(c.due_at, now);
                  const req = requestLine(c);
                  const selected = selectedId?.toLowerCase() === c.id.toLowerCase();
                  return (
                    <tr
                      key={c.id}
                      onClick={() => openCase(c.id)}
                      aria-selected={selected}
                      className={`cursor-pointer border-t border-brand-200 ${selected ? "bg-brand-50" : "hover:bg-brand-50"}`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-10 w-10 shrink-0 aspect-square items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white"
                          >
                            {initials(c.alias)}
                          </span>
                          <div className="min-w-[150px] text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCase(c.id);
                              }}
                              className="block text-left font-bold"
                            >
                              {c.alias}
                            </button>
                            <p className="mt-1 text-sm text-muted">
                              {c.id} · {c.barangay}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <Pill tone={sl.tone}>
                            <Icon name={sl.icon} size={14} className="mr-1" />
                            {sl.label}
                          </Pill>
                          {req ? <Pill tone={req.tone}>{req.label}</Pill> : null}
                        </div>
                      </td>
                      <td className="px-4 py-4"><FollowUpDetails caseData={c} /></td>
                      <td className="px-4 py-4">
                        <p className={`whitespace-nowrap ${late ? "text-warn-ink" : ""}`}>{formatDot(c.due_at)}</p>
                        {late ? <p className="whitespace-nowrap text-warn-ink">{late}</p> : null}
                      </td>
                      <td className="px-4 py-4 text-brand-900" aria-hidden="true">
                        ›
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-brand-200 px-4 py-3 text-xs text-muted">
              Showing {rows.length} of {list.length} records · Earliest follow-up target first
            </p>
          </div>
          {/* Phone: cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((c) => (
              <CaseRow key={c.id} c={c} now={now} href={`/bhw?case=${c.id}`} />
            ))}
          </ul>
        </>
      )}
      <p className="mt-2 text-xs text-muted">
        Assignment to a station is not acceptance by a worker. Targets are administrative, not clinical
        urgency.
      </p>

      <SlideOver
        showDemo={false}
        stickyHeader
        open={Boolean(selectedId)}
        onClose={closePanel}
        title="Case detail"
      >
        {selectedId ? <CaseDetail key={selectedId} caseId={selectedId} onChanged={refresh} /> : null}
      </SlideOver>
    </>
  );
}

export default function BhwCasesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CasesScreen />
    </Suspense>
  );
}
