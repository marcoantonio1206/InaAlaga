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
import { listStationCases, resetDemoData, getDemoNow } from "@/lib/data";
import { useWorker } from "@/lib/bhwWorkers";
import { STATE_LABEL, bhwState, visitLine, requestLine } from "@/lib/bhwStatus";
import { formatDot, formatDotYear, initials, overdueLabel } from "@/lib/format";

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
      <PageHeader title="Cases" subtitle={`${worker.station} · Demo snapshot: ${formatDotYear(now)}`} />
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
          <div className="hidden overflow-hidden rounded-2xl border border-brand-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-600 text-xs text-white">
                <tr>
                  <th className="px-4 py-3 font-bold">Mother / case</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Home follow-up</th>
                  <th className="px-4 py-3 font-bold">Demo target</th>
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
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white"
                          >
                            {initials(c.alias)}
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCase(c.id);
                              }}
                              className="font-bold"
                            >
                              {c.alias}
                            </button>
                            <p className="text-xs text-muted">
                              {c.id} · {c.barangay}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          <Pill tone={sl.tone}>
                            <Icon name={sl.icon} size={14} className="mr-1" />
                            {sl.label}
                          </Pill>
                          {req ? <Pill tone={req.tone}>{req.label}</Pill> : null}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">{visitLine(c)}</td>
                      <td className="px-4 py-2.5">
                        <p className={late ? "text-warn-ink" : ""}>{formatDot(c.due_at)}</p>
                        {late ? <p className="text-warn-ink">{late}</p> : null}
                      </td>
                      <td className="px-4 py-2.5 text-brand-900" aria-hidden="true">
                        ›
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-brand-200 px-4 py-3 text-xs text-muted">
              Showing {rows.length} of {list.length} fictional records · Earliest follow-up target first
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
        urgency.{" "}
        <button
          type="button"
          onClick={async () => {
            await resetDemoData();
            refresh();
          }}
          className="font-bold text-brand-900 underline"
        >
          Reset demo data in this browser
        </button>
      </p>

      <SlideOver
        open={Boolean(selectedId)}
        onClose={closePanel}
        title="Case detail"
        subtitle="Shared record · each action has its own saved state"
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
