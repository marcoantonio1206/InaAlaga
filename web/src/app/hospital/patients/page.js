"use client";

import useCurrentTime from "@/lib/hooks/useCurrentTime";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useLiveResource from "@/lib/hooks/useLiveResource";
import PageHeader from "@/components/hospital/PageHeader";
import Pill from "@/components/hospital/Pill";
import { SlideOver } from "@/components/ui/Overlay";
import VisitContactCell from "@/components/hospital/VisitContactCell";
import PatientProfile from "@/components/hospital/PatientProfile";
import DischargeDialog from "@/components/hospital/DischargeDialog";
import { listCases } from "@/lib/data";
import { followupOverdueLabel } from "@/lib/visitTiming";
import { formatDot, formatDotYear, initials } from "@/lib/format";
import { responsibility } from "@/lib/hospitalStatus";

function shortStation(name) {
  return name ? name.replace(" (demo station)", "") : "Not assigned";
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Awaiting acceptance" },
  { key: "acknowledged", label: "Accepted" },
  { key: "unassigned", label: "Unassigned" },
];

// URL is the source of truth for the overlays:
//   /hospital/patients?case=IA-0042  -> profile panel
//   /hospital/patients?new=1         -> discharge dialog
function PatientsScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("case");
  const dialogOpen = params.get("new") === "1";
  const now = useCurrentTime();
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: cases, error: failed, refreshing, refresh } = useLiveResource(listCases, `${attempt}:${selectedId}:${dialogOpen}`);

  const openCase = useCallback((id) => router.push(`/hospital/patients?case=${id}`), [router]);
  const openNew = useCallback(() => router.push("/hospital/patients?new=1"), [router]);
  const closeAll = useCallback(() => router.push("/hospital/patients"), [router]);

  const counts = useMemo(() => {
    const base = { all: 0, pending: 0, acknowledged: 0, unassigned: 0 };
    (cases ?? []).forEach((c) => {
      base.all += 1;
      base[c.handoff_state] += 1;
    });
    return base;
  }, [cases]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (cases ?? []).filter((c) => {
      if (filter !== "all" && c.handoff_state !== filter) return false;
      if (!q) return true;
      return c.alias.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    });
  }, [cases, query, filter]);

  return (
    <>
      <PageHeader
        showDemo={false}
        title="Patient list"
        subtitle={`As of: ${formatDotYear(now)} Philippine time`}
      />
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
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
        <button type="button" onClick={refresh} disabled={refreshing} className="h-11 rounded-xl border border-brand-200 bg-white px-4 text-sm font-bold text-brand-900 disabled:opacity-50">{refreshing ? "Refreshing…" : "Refresh"}</button>
        <button
          type="button"
          onClick={openNew}
          className="flex h-11 items-center rounded-xl bg-brand-900 px-6 text-sm font-bold text-white"
        >
          + Record discharge
        </button>
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

      {failed && cases !== undefined ? <p role="status" className="mb-3 rounded-xl bg-warn-bg p-3 text-sm text-warn-ink">Couldn’t refresh the list. Showing the last loaded records. <button type="button" onClick={refresh} className="font-bold underline">Retry</button></p> : null}
      {failed && cases === undefined ? (
        <div className="rounded-2xl border border-brand-200 bg-white p-6">
          <p className="mb-3 font-bold">Couldn&apos;t load the patient list.</p>
          <button
            type="button"
            onClick={refresh}
            className="h-12 rounded-xl bg-brand-900 px-6 font-bold text-white"
          >
            Retry
          </button>
        </div>
      ) : cases === undefined ? (
        <p className="p-6 text-muted">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-200 bg-white">
          <div role="region" aria-label="Patient list" tabIndex={0} className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-brand-600 text-xs text-white">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-bold">Mother / case</th>
                <th className="whitespace-nowrap px-4 py-3 font-bold">Responsibility</th>
                <th className="whitespace-nowrap px-4 py-3 font-bold">Visit / contact</th>
                <th className="whitespace-nowrap px-4 py-3 font-bold">Follow-up target</th>
                <th className="whitespace-nowrap px-4 py-3 font-bold">Coordinating station</th>
                <th className="w-10 px-4 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const r = responsibility(c);
                const late = followupOverdueLabel(c, now);
                const selected = selectedId?.toLowerCase() === c.id.toLowerCase();
                return (
                  <tr
                    key={c.id}
                    onClick={() => openCase(c.id)}
                    aria-selected={selected}
                    className={`cursor-pointer border-t border-brand-200 ${
                      selected ? "bg-brand-50" : "hover:bg-brand-50"
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-9 w-9 shrink-0 aspect-square items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white"
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
                            className="whitespace-nowrap text-left font-bold"
                          >
                            {c.alias}
                          </button>
                          <p className="text-xs text-muted">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <Pill tone={r.tone}>{r.label}</Pill>
                    </td>
                    <td className="px-4 py-2.5">
                      <VisitContactCell c={c} now={now} />
                    </td>
                    <td className="px-4 py-2.5">
                      <p className={`whitespace-nowrap ${late ? "text-warn-ink" : ""}`}>{formatDot(c.due_at)}</p>
                      {late ? <p className="whitespace-nowrap text-warn-ink">{late}</p> : c.overdue_arranged_at ? <p className="text-xs text-success-ink">Arranged with mother</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">{shortStation(c.station_name)}</td>
                    <td className="px-4 py-2.5 text-brand-900" aria-hidden="true">
                      ›
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted">
                    No records match.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
          <p className="border-t border-brand-200 px-4 py-3 text-xs text-muted">
            Showing {rows.length} of {cases.length} records
          </p>
        </div>
      )}
      <p className="mt-2 text-xs text-muted">
        Follow-up targets are administrative deadlines, not clinical urgency scores.
      </p>

      <SlideOver
        open={Boolean(selectedId)}
        onClose={closeAll}
        title="Patient profile"
        subtitle="Handoff, visits and contact"
        showDemo={false}
        stickyHeader
      >
        {selectedId ? <PatientProfile key={selectedId} caseId={selectedId} onChanged={() => setAttempt((n) => n + 1)} /> : null}
      </SlideOver>

      <DischargeDialog
        open={dialogOpen}
        onClose={closeAll}
        onSaved={() => setAttempt((n) => n + 1)}
        onViewHandoff={openCase}
      />
    </>
  );
}

export default function PatientListPage() {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Loading…</p>}>
      <PatientsScreen />
    </Suspense>
  );
}
