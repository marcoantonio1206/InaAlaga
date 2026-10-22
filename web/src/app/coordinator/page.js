"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/hospital/PageHeader";
import Pill from "@/components/hospital/Pill";
import Field, { controlClass } from "@/components/hospital/Field";
import Card from "@/components/ui/Card";
import RateChart from "@/components/coordinator/RateChart";
import DifferenceChart from "@/components/coordinator/DifferenceChart";
import { getPlanningResults } from "@/lib/data";
import {
  DEFAULT_SCENARIO,
  POLICIES,
  clock,
  findScenario,
  groupScenarios,
  minutes,
  pct,
} from "@/lib/planning";

function Item({ label, value }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function Assumptions({ config }) {
  const [refLo, refHi] = config.reference_delay_hours;
  const [fastLo, fastHi] = config.fast_delay_hours;
  return (
    <Card>
      <h2 className="text-lg font-extrabold">Assumptions in this scenario</h2>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Item
          label="New cases"
          value={`${config.demand_per_day}/day for ${config.arrival_days} days, then ${config.drain_days} drain days`}
        />
        <Item label="Workers" value={`${config.workers_per_station} per station · 2 demo stations`} />
        <Item label="Shift" value={`${clock(config.shift_start)}–${clock(config.shift_end)} daily`} />
        <Item label="Home contact" value={`${config.service_minutes} min each`} />
        <Item label="Travel time" value={`×${config.travel_multiplier} of straight-line estimate`} />
        <Item label="Starting backlog" value={config.backlog_days ? `${config.backlog_days} day of cases` : "None"} />
        <Item label="Handoff delay, A and D" value={`${refLo}–${refHi} h after discharge`} />
        <Item label="Handoff delay, B and C" value={`${fastLo}–${fastHi} h after discharge`} />
        <Item
          label="Administrative targets"
          value={`${config.due_windows_hours.join(" / ")} h after discharge`}
        />
      </div>
      <p className="text-sm text-muted">
        All values are engineering assumptions for stress testing, not measured Tuguegarao staffing, demand or
        clinical standards.
      </p>
    </Card>
  );
}

function Workload({ scenario }) {
  return (
    <Card>
      <h2 className="text-lg font-extrabold">Workload and delay</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-600 text-xs text-white">
            <tr>
              <th className="px-3 py-2 font-bold">Policy</th>
              <th className="px-3 py-2 font-bold">On time</th>
              <th className="px-3 py-2 font-bold">Contact started within 48&nbsp;h</th>
              <th className="px-3 py-2 font-bold">Never served</th>
              <th className="px-3 py-2 font-bold">Worker shift time used</th>
              <th className="px-3 py-2 font-bold">Median lateness, completed</th>
            </tr>
          </thead>
          <tbody>
            {POLICIES.map((p) => {
              const m = scenario.policies[p.key];
              return (
                <tr key={p.key} className="border-t border-brand-200">
                  <td className="px-3 py-2 font-bold">{p.name}</td>
                  <td className="px-3 py-2 tabular-nums">{pct(m.on_time_rate.mean)}</td>
                  <td className="px-3 py-2 tabular-nums">{pct(m.start_within_48h_rate.mean)}</td>
                  <td className="px-3 py-2 tabular-nums">{pct(m.unserved_rate.mean)}</td>
                  <td className="px-3 py-2 tabular-nums">{pct(m.utilization.mean)}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {minutes(m.median_nonnegative_lateness_minutes_completed.mean)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">
        Means across replications. Lateness counts on-time contacts as zero. Worker time includes travel both
        ways. &ldquo;Unavailable&rdquo; means the scenario produced no value to average, such as no completed
        contacts.
      </p>
    </Card>
  );
}

function Limitations({ results }) {
  return (
    <Card>
      <h2 className="text-lg font-extrabold">How to read these results</h2>
      <p className="text-sm">
        <span className="font-bold">Denominator: </span>
        {results.primary_denominator}.
      </p>
      <p className="text-sm">
        <span className="font-bold">Ranges: </span>
        {results.interval_definition}.
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
        {results.limitations.map((l) => (
          <li key={l}>{l}.</li>
        ))}
      </ul>
      <div className="border-t border-brand-200 pt-3 text-xs text-muted">
        <p>
          Source: {results.source} · model {results.model_version} · design SHA-256{" "}
          <span className="break-all font-mono">{results.experiment_design_sha256}</span>
        </p>
        <p>
          Regenerate:{" "}
          {results.regenerate.map((cmd) => (
            <code key={cmd} className="mr-2 font-mono">
              {cmd}
            </code>
          ))}
        </p>
      </div>
    </Card>
  );
}

// /coordinator?scenario=<id> selects a precomputed scenario. The URL is the
// source of truth; an unknown ID shows "unavailable", never a nearby result.
function PlanningScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const scenarioId = params.get("scenario") ?? DEFAULT_SCENARIO;
  const [results, setResults] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getPlanningResults()
      .then((data) => {
        if (active) setResults(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const scenario = results ? findScenario(results, scenarioId) : null;

  return (
    <>
      <PageHeader
        title="Planning results"
        subtitle="Compare handoff and scheduling policies under the same follow-up capacity"
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
      ) : results === null ? (
        <p className="p-6 text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3">
          <Card>
            <Pill tone="lilac">Synthetic simulation</Pill>
            <p className="font-bold">
              With the same follow-up capacity, when do faster discharge handoff and deadline-based scheduling
              improve timely contact compared with arrival-order scheduling?
            </p>
            <p className="text-sm">
              These numbers come from a hypothetical simulation of fictional cases, {results.replications_per_scenario}{" "}
              paired replications per scenario. They are not counts from this demo&apos;s saved records and not
              observed Tuguegarao outcomes.
            </p>
          </Card>

          <Card>
            <Field
              label="Scenario"
              htmlFor="scenario"
              hint="Each scenario changes stated assumptions; results are precomputed, not recalculated here."
            >
              <select
                id="scenario"
                value={scenario ? scenarioId : ""}
                onChange={(e) => router.push(`/coordinator?scenario=${encodeURIComponent(e.target.value)}`)}
                className={controlClass(false)}
              >
                {scenario ? null : <option value="">Choose a scenario</option>}
                {groupScenarios(results.scenarios).map((g) => (
                  <optgroup key={g.name} label={g.name}>
                    {g.scenarios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
          </Card>

          {scenario ? (
            <>
              <Assumptions config={scenario.config} />
              <RateChart scenario={scenario} replications={results.replications_per_scenario} />
              <DifferenceChart scenario={scenario} replications={results.replications_per_scenario} />
              <Workload scenario={scenario} />
            </>
          ) : (
            <Card tone="dashed">
              <p className="font-bold">This scenario is unavailable.</p>
              <p className="text-sm text-muted">
                No precomputed result exists for &ldquo;{scenarioId}&rdquo;. Results are never interpolated; choose
                a listed scenario.
              </p>
            </Card>
          )}

          <Limitations results={results} />
        </div>
      )}
    </>
  );
}

export default function CoordinatorPlanningPage() {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Loading…</p>}>
      <PlanningScreen />
    </Suspense>
  );
}
