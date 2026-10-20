"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/hospital/PageHeader";
import Pill from "@/components/hospital/Pill";
import { listCases, getDemoNow } from "@/lib/data";
import { formatDot, formatDotYear, initials, overdueLabel } from "@/lib/format";
import { responsibility, visitSummary } from "@/lib/hospitalStatus";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Awaiting acceptance" },
  { key: "acknowledged", label: "Accepted" },
  { key: "unassigned", label: "Unassigned" },
];

export default function PatientListPage() {
  const router = useRouter();
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
  }, [attempt]);

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
        <Link
          href="/hospital/discharge"
          className="flex h-12 items-center rounded-xl bg-brand-900 px-6 font-bold text-white"
        >
          + Record discharge
        </Link>
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
          <p className="mb-3 font-bold">Couldn't load the patient list.</p>
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
            <thead className="bg-brand-900 text-sm text-white">
              <tr>
                <th className="px-4 py-3 font-bold">Mother / case</th>
                <th className="px-4 py-3 font-bold">Responsibility</th>
                <th className="px-4 py-3 font-bold">Visit / contact</th>
                <th className="px-4 py-3 font-bold">Demo target</th>
                <th className="px-4 py-3 font-bold">Demo station</th>
                <th className="w-8 px-4 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const r = responsibility(c);
                const done = c.visits.some((v) => v.state === "completed");
                const late = done ? null : overdueLabel(c.due_at, now);
                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/hospital/patients/${c.id}`)}
                    className="cursor-pointer border-t border-brand-200 hover:bg-brand-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white"
                        >
                          {initials(c.alias)}
                        </span>
                        <div>
                          <Link
                            href={`/hospital/patients/${c.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold"
                          >
                            {c.alias}
                          </Link>
                          <p className="text-sm text-muted">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={r.tone}>{r.label}</Pill>
                    </td>
                    <td className="px-4 py-3 text-sm">{visitSummary(c)}</td>
                    <td className="px-4 py-3 text-sm">
                      <p className={late ? "text-warn-ink" : ""}>{formatDot(c.due_at)}</p>
                      {late ? <p className="text-warn-ink">{late}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-sm">{c.station_name ?? "Not assigned"}</td>
                    <td className="px-4 py-3 text-brand-900" aria-hidden="true">
                      ›
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted">
                    No records match.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <p className="border-t border-brand-200 px-4 py-3 text-sm text-muted">
            Showing {rows.length} of {cases.length} fictional records
          </p>
        </div>
      )}
      <p className="mt-3 text-sm text-muted">
        Demo targets are administrative deadlines, not clinical urgency scores.
      </p>
    </>
  );
}