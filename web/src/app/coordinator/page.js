"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/hospital/PageHeader";
import Field, { controlClass } from "@/components/hospital/Field";
import Pill from "@/components/hospital/Pill";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { getScenarioSummary } from "@/lib/data";
import {
  COMPARISONS,
  DEFAULTS,
  FILTERS,
  FIXED_ASSUMPTIONS,
  MODEL_VERSION,
  POLICIES,
  RESULTS_VERSION,
  VERDICT_LABEL,
  isDefault,
  matchScenario,
  optionFor,
  pct,
  runShare,
  signed,
  summarize,
  verdict,
} from "@/lib/planning";

function ScenarioSelector({ selected, onChange }) {
  return (
    <Card className="sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold">Scenario</h2>
        <button
          type="button"
          onClick={() => onChange(DEFAULTS)}
          disabled={isDefault(selected)}
          className="rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-bold text-brand-900 disabled:opacity-50"
        >
          Reset scenario
        </button>
      </div>
      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {FILTERS.map((f) => (
          <Field key={f.key} label={f.label} htmlFor={`f-${f.key}`}>
            <select
              id={`f-${f.key}`}
              value={String(selected[f.key])}
              onChange={(e) => onChange({ ...selected, [f.key]: optionFor(f, e.target.value) })}
              className={`${controlClass(false)} select-chevron`}
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

function PolicyName({ policy }) {
  return (
    <span className="flex items-center gap-2 font-bold">
      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-sm font-extrabold text-white">
        {policy.key}
      </span>
      <span>
        <span className="sr-only">{policy.key} </span>
        {policy.name}
      </span>
    </span>
  );
}

function ContactShare({ row }) {
  const sentences = summarize(row);
  return (
    <Card className="sm:px-6">
      <h2 className="text-lg font-extrabold">Share of mothers contacted by their follow-up target</h2>
      <ul className="flex flex-col gap-3">
        {POLICIES.map((p) => {
          const rate = row[`${p.key}_on_time_rate_mean`];
          return (
            <li key={p.key} className="grid gap-1 md:grid-cols-[380px_1fr_64px] md:items-center md:gap-3">
              <PolicyName policy={p} />
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
      <div className="mt-2 rounded-xl bg-brand-50 p-3 sm:px-4">
        <h3 className="font-extrabold">What this shows</h3>
        {sentences.length ? sentences.map((s) => <p key={s}>{s}</p>) : <p>Comparison unavailable for this scenario.</p>}
        <p className="mt-1 text-sm text-muted">
          A percentage point is the plain difference between two percentages: going from 46% to 82% is a rise of 36
          percentage points (pp). No approach is best in every scenario; change the settings above to see where results
          shrink or reverse.
        </p>
      </div>
    </Card>
  );
}

function VerdictPill({ row, compKey }) {
  const v = verdict(row, compKey);
  if (!v) return <Pill>Unavailable</Pill>;
  const s = VERDICT_LABEL[v];
  return (
    <Pill tone={s.tone}>
      <Icon name={s.icon} size={14} className="mr-1" />
      {s.label}
    </Pill>
  );
}

function Changes({ row }) {
  return (
    <Card className="sm:px-6">
      <h2 className="text-lg font-extrabold">Changes between approaches</h2>
      <p className="text-sm text-muted">
        Each run uses the same fictional cases and workers for every approach, so differences come from the approach
        alone. The range covers the middle 95% of the 100 runs.
      </p>
      <ul className="flex flex-col divide-y divide-brand-200">
        {COMPARISONS.filter((c) => c.primary).map((c) => {
          const worse = row[`${c.key}_fraction_negative`];
          return (
            <li key={c.key} className="flex flex-col gap-1 py-3 first:pt-1 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">
                  {c.label} · {c.question}
                </p>
                <VerdictPill row={row} compKey={c.key} />
              </div>
              <p>
                <span className="font-bold tabular-nums">{signed(row[`${c.key}_mean_pp`])} pp</span> on average · range{" "}
                <span className="tabular-nums">
                  {signed(row[`${c.key}_p025_pp`])} to {signed(row[`${c.key}_p975_pp`])} pp
                </span>
                {worse != null ? ` · lower in ${runShare(worse)} of runs` : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Evidence({ row, selected }) {
  return (
    <Card className="sm:px-6">
      <details>
        <summary className="cursor-pointer text-lg font-extrabold">More evidence for this scenario</summary>
        <div className="mt-3 flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="mb-2 text-left text-muted">
                Capacity: worker utilization is time spent travelling and visiting as a share of all shift time.
                Unserved cases never received a visit before the simulation ended.
              </caption>
              <thead className="bg-brand-600 text-xs text-white">
                <tr>
                  <th className="px-3 py-2">Approach</th>
                  <th className="px-3 py-2 text-right">On time</th>
                  <th className="px-3 py-2 text-right">Never served</th>
                  <th className="px-3 py-2 text-right">Worker utilization</th>
                </tr>
              </thead>
              <tbody>
                {POLICIES.map((p) => (
                  <tr key={p.key} className="border-t border-brand-200">
                    <td className="px-3 py-2"><PolicyName policy={p} /></td>
                    <td className="px-3 py-2 text-right tabular-nums">{pct(row[`${p.key}_on_time_rate_mean`])}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{pct(row[`${p.key}_unserved_rate_mean`])}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{pct(row[`${p.key}_utilization_mean`])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="mb-2 text-left text-muted">All paired comparisons, in percentage points.</caption>
              <thead className="bg-brand-600 text-xs text-white">
                <tr>
                  <th className="px-3 py-2">Comparison</th>
                  <th className="px-3 py-2 text-right">Average</th>
                  <th className="px-3 py-2 text-right">Middle 95% of runs</th>
                  <th className="px-3 py-2 text-right">Runs lower</th>
                  <th className="px-3 py-2 text-right">Runs tied</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISONS.map((c) => (
                  <tr key={c.key} className="border-t border-brand-200">
                    <td className="px-3 py-2">
                      <span className="font-bold">{c.label}</span> · {c.question}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{signed(row[`${c.key}_mean_pp`])}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {signed(row[`${c.key}_p025_pp`])} to {signed(row[`${c.key}_p975_pp`])}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{runShare(row[`${c.key}_fraction_negative`]) ?? "Unavailable"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{runShare(row[`${c.key}_fraction_tied`]) ?? "Unavailable"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-muted">
              Scenario <span className="font-bold text-ink">{row.scenario_id}</span> · model {MODEL_VERSION} · results{" "}
              {RESULTS_VERSION} · {FILTERS.map((f) => f.format(selected[f.key])).join(" · ")}
            </p>
            <a
              href="/scenario_summary.csv"
              download="inaalaga_scenario_summary_factorial_v1.csv"
              className="rounded-xl border border-brand-200 bg-white px-4 py-2 font-bold text-brand-900"
            >
              Download all 162 scenarios (CSV)
            </a>
          </div>
        </div>
      </details>
    </Card>
  );
}

function Assumptions({ selected }) {
  return (
    <Card className="sm:px-6">
      <h2 className="text-lg font-extrabold">Assumptions in this scenario</h2>
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {FILTERS.map((f) => (
          <li key={f.key}>{f.describe(selected[f.key])}</li>
        ))}
        {FIXED_ASSUMPTIONS.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      <details className="mt-1">
        <summary className="cursor-pointer font-bold text-brand-900">How the simulation works</summary>
        <div className="mt-2 flex flex-col gap-2 text-sm">
          <p>
            A discrete-event simulation of the first home follow-up after discharge. Each run generates 14 days of
            fictional discharges and gives the identical cases, locations and workers to all four approaches. Only the
            handoff delay and the order in which workers take cases change.
          </p>
          <p>
            First-come ordering (A, B) takes cases in the order the station received them. Deadline ordering (C, D)
            takes the case with the earliest follow-up target first. A worker leaves only if the whole trip (travel,
            visit, return) fits in the remaining shift; otherwise the case waits for the next shift.
          </p>
          <p>
            Travel uses straight-line distance from barangay reference points to the station at an assumed 15 km/h with
            a 5-minute minimum, then the travel-time multiplier. These are not measured journeys or official
            catchments.
          </p>
          <p>
            Demand, staffing, shift hours, delays and visit length are stated assumptions, not Tuguegarao measurements.
            The on-time share counts every new case, including those never visited. Ranges show variation between
            runs, not confidence about the real city.
          </p>
        </div>
      </details>
    </Card>
  );
}

export default function CoordinatorPlanningPage() {
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState(DEFAULTS);

  // Fixed precomputed results: loaded once, no polling.
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
        showDemo={false}
        title="Planning"
        subtitle="Which approach gets more mothers contacted on time with the same workers?"
      />
      <p className="mb-3 flex items-start gap-2 rounded-xl border border-brand-200 bg-white p-3 text-sm sm:px-6">
        <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-brand-900" />
        <span>
          <span className="font-bold">Precomputed synthetic simulation results.</span> They are independent of the
          mothers entered in this app: recording or updating a case never changes these numbers. See Overview for saved
          activity.
        </span>
      </p>
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
              <Changes row={row} />
            </>
          ) : (
            <Card tone="dashed" className="sm:px-6">
              <p className="font-bold">No matching scenario.</p>
              <p className="text-sm text-muted">
                No precomputed result has these five settings. Results are never interpolated.
              </p>
            </Card>
          )}
          <Assumptions selected={selected} />
          {row ? <Evidence row={row} selected={selected} /> : null}
        </div>
      )}
    </>
  );
}
