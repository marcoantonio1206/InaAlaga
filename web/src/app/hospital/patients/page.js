"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/hospital/PageHeader";
import Pill from "@/components/hospital/Pill";
import { SlideOver } from "@/components/hospital/Overlay";
import PatientProfile from "@/components/hospital/PatientProfile";
import DischargeDialog from "@/components/hospital/DischargeDialog";
import { listCases, getDemoNow } from "@/lib/data";
import { formatDot, formatDotYear, initials, overdueLabel } from "@/lib/format";
import { responsibility, visitSummary } from "@/lib/hospitalStatus";

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
  const now = getDemoNow();
  const [cases, setCases] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;
    listCases()
      .then((data) => {
        if (active) setCases(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [attempt, selectedId, dialogOpen]);

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
        title="Patient list"
        subtitle={`Demo snapshot: ${formatDotYear(now)} Philippine time`}
      />
      <div className="mb-3 flex items-end gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="search" className="text-sm font-bold">
            Search
          </label>
          <input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mother alias or case ID"
            className="h-12 w-full rounded-lg border border-brand-200 bg-white px-3 text-base"
          />
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex h-12 items-center rounded-xl bg-brand-900 px-6 font-bold text-white"
        >
          + Record discharge
        </button>
      </div>
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
        <div className="rounded-2xl border border-brand-200 bg-white p-6">
          <p className="mb-3 font-bold">Couldn&apos;t load the patient list.</p>
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
            className="h-12 rounded-xl bg-brand-900 px-6 font-bold text-white"
          >
            Retry
          </button>
        </div>
      ) : cases === null ? (
        <p className="p-6 text-muted">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-200 bg-white">
          <table className="w-full text-left">
            <thead className="bg-brand-600 text-sm text-white">
              <tr>
                <th className="px-5 py-4 font-bold">Mother / case</th>
                <th className="px-5 py-4 font-bold">Responsibility</th>
                <th className="px-5 py-4 font-bold">Visit / contact</th>
                <th className="px-5 py-4 font-bold">Demo target</th>
                <th className="px-5 py-4 font-bold">Demo station</th>
                <th className="w-10 px-5 py-4">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const r = responsibility(c);
                const done = c.visits.some((v) => v.state === "completed");
                const late = done ? null : overdueLabel(c.due_at, now);
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
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white"
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
                          <p className="text-sm text-muted">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Pill tone={r.tone}>{r.label}</Pill>
                    </td>
                    <td className="px-5 py-4 text-sm">{visitSummary(c)}</td>
                    <td className="px-5 py-4 text-sm">
                      <p className={late ? "text-warn-ink" : ""}>{formatDot(c.due_at)}</p>
                      {late ? <p className="text-warn-ink">{late}</p> : null}
                    </td>
                    <td className="px-5 py-4 text-sm">{c.station_name ?? "Not assigned"}</td>
                    <td className="px-5 py-4 text-brand-900" aria-hidden="true">
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
          <p className="border-t border-brand-200 px-5 py-3 text-sm text-muted">
            Showing {rows.length} of {cases.length} fictional records
          </p>
        </div>
      )}
      <p className="mt-3 text-sm text-muted">
        Demo targets are administrative deadlines, not clinical urgency scores.
      </p>

      <SlideOver
        open={Boolean(selectedId)}
        onClose={closeAll}
        title="Patient profile"
        subtitle="Saved handoff details and responsibility"
      >
        {selectedId ? <PatientProfile caseId={selectedId} /> : null}
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
