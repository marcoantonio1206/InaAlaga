"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/hospital/PageHeader";
import Field, { controlClass } from "@/components/hospital/Field";
import Card from "@/components/ui/Card";
import { getScenarioSummary } from "@/lib/data";
import {
  DEFAULTS,
  FILTERS,
  POLICIES,
  deadlineAddsLittle,
  matchScenario,
  optionFor,
  pct,
  signed,
} from "@/lib/planning";

const FIXED_ASSUMPTIONS = [
  "09:00 to 13:00 shifts",
  "14 arrival days + 7 drain days",
  "100 paired replications",
  "Equal 20% allocation across five barangays",
  "Straight-line travel at 15 km/h with a 5-minute floor",
];

function ScenarioSelector({ selected, onChange }) {
  return (
    <Card>
      <h2 className="text-lg font-extrabold">Scenario</h2>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
        {FILTERS.map((f) => (
          <Field key={f.key} label={f.label} htmlFor={`f-${f.key}`}>
            <select
              id={`f-${f.key}`}
              value={String(selected[f.key])}
              onChange={(e) => onChange({ ...selected, [f.key]: optionFor(f, e.target.value) })}
              className={controlClass(false)}
            >
              {f.options.map((o) => (
                <option key={o} value={String(o)}>
                  {f.format(o)}
                </option>
              ))}
            </select>
          </Field>
        ))}
      </div>
    </Card>
  );
}

function ContactShare({ row }) {
  return (
    <Card>
      <h2 className="text-lg font-extrabold">Share of mothers contacted by their follow-up target</h2>
      <ul className="flex flex-col gap-3">
        {POLICIES.map((p) => {
          const rate = row[`${p.key}_on_time_rate_mean`];
          return (
            <li key={p.key} className="grid gap-1 md:grid-cols-[260px_1fr_64px] md:items-center md:gap-3">
              <p className="font-bold">{p.label}</p>
              <div className="h-6 rounded bg-brand-200" aria-hidden="true">
                {rate != null ? (
                  <div className="h-full rounded bg-brand-600" style={{ width: `${rate * 100}%` }} />
                ) : null}
              </div>
              <p className="font-bold tabular-nums md:text-right">{pct(rate)}</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function PairedDifferences({ row }) {
  return (
    <Card>
      <h2 className="text-lg font-extrabold">Paired differences</h2>
      <p>
        B vs A: {signed(row.B_minus_A_mean_pp)} pp (95% replication range {signed(row.B_minus_A_p025_pp)} to{" "}
        {signed(row.B_minus_A_p975_pp)})
      </p>
      <p>
        C vs B: {signed(row.C_minus_B_mean_pp)} pp (range {signed(row.C_minus_B_p025_pp)} to{" "}
        {signed(row.C_minus_B_p975_pp)})
      </p>
      {deadlineAddsLittle(row) ? <p className="font-bold">Deadline ordering adds little in this setting.</p> : null}
    </Card>
  );
}

function Assumptions({ selected }) {
  return (
    <Card>
      <h2 className="text-lg font-extrabold">Assumptions in this scenario</h2>
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {FILTERS.map((f) => (
          <li key={f.key}>
            {f.label}: <span className="font-bold">{f.format(selected[f.key])}</span>
          </li>
        ))}
        {FIXED_ASSUMPTIONS.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </Card>
  );
}

export default function CoordinatorPlanningPage() {
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState(DEFAULTS);

  useEffect(() => {
    let active = true;
    getScenarioSummary()
      .then((data) => {
        if (active) setRows(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const row = rows ? matchScenario(rows, selected) : null;

  return (
    <>
      <PageHeader
        title="Planning"
        subtitle="Simulated scheduling policies on a synthetic cohort · not Tuguegarao measurements"
      />
      {failed ? (
        <div className="rounded-2xl border border-brand-200 bg-white p-6">
          <p className="mb-3 font-bold">Couldn&apos;t load the simulation results.</p>
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
      ) : rows === null ? (
        <p className="p-6 text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3">
          <ScenarioSelector selected={selected} onChange={setSelected} />
          {row ? (
            <>
              <ContactShare row={row} />
              <PairedDifferences row={row} />
            </>
          ) : (
            <Card tone="dashed">
              <p className="font-bold">No matching scenario.</p>
              <p className="text-sm text-muted">
                No precomputed result has these five settings. Results are never interpolated.
              </p>
            </Card>
          )}
          <Assumptions selected={selected} />
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        Synthetic settings. Ranges are replication spread, not confidence intervals about the real city.
      </p>
    </>
  );
}
