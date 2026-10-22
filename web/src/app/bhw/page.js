"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/hospital/PageHeader";
import CaseRow from "@/components/bhw/CaseRow";
import { Loading, LoadFailed, Empty } from "@/components/bhw/LoadState";
import { listStationCases, resetDemoData, getDemoNow } from "@/lib/data";
import { useWorker } from "@/lib/bhwWorkers";
import { bhwState } from "@/lib/bhwStatus";
import { formatDotYear } from "@/lib/format";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Awaiting acceptance" },
  { key: "accepted", label: "Accepted" },
  { key: "scheduled", label: "Scheduled" },
  { key: "update_needed", label: "Update needed" },
  { key: "completed", label: "Completed" },
];

export default function BhwCasesPage() {
  const { worker } = useWorker();
  const now = getDemoNow();
  const [cases, setCases] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
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

  // Data from a previous worker selection counts as "loading" for the new one.
  const list = cases && cases.station === worker.station ? cases.data : null;

  const counts = useMemo(() => {
    const base = Object.fromEntries(FILTERS.map((f) => [f.key, 0]));
    (list ?? []).forEach((c) => {
      base.all += 1;
      const s = bhwState(c, now);
      if (s in base) base[s] += 1;
    });
    return base;
  }, [list, now]);

  const rows = useMemo(
    () => (list ?? []).filter((c) => filter === "all" || bhwState(c, now) === filter),
    [list, filter, now]
  );

  return (
    <>
      <PageHeader title="Cases" subtitle={`${worker.station} · Demo snapshot: ${formatDotYear(now)}`} />
      <p className="mb-3 text-sm text-muted">
        Station-scoped inbox. Earliest follow-up target first. Targets are administrative, not clinical
        urgency.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-sm font-bold ${
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
            setAttempt((n) => n + 1);
          }}
        />
      ) : list === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty
          title={list.length === 0 ? "No cases assigned to this station yet." : "No cases match this filter."}
          body="Cases arrive when hospital staff save a discharge routed to this station."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((c) => (
            <CaseRow key={c.id} c={c} now={now} />
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm text-muted">
        Showing {rows.length} of {list?.length ?? 0} fictional records. Assignment to a station is not
        acceptance by a worker.
      </p>
      <button
        type="button"
        onClick={async () => {
          await resetDemoData();
          setAttempt((n) => n + 1);
        }}
        className="mt-2 text-sm font-bold text-brand-900 underline"
      >
        Reset demo data in this browser
      </button>
    </>
  );
}
