import Card from "@/components/ui/Card";
import { POLICIES, pct } from "@/lib/planning";

const TICKS = [0, 25, 50, 75, 100];

// On-time rate per policy: bar = replication mean, line = central 95% range.
// Policy names are text, so identity never depends on colour.
export default function RateChart({ scenario, replications }) {
  return (
    <Card>
      <figure className="flex flex-col gap-3">
        <figcaption>
          <h2 className="text-lg font-extrabold">On-time contact rate by policy</h2>
          <p className="text-sm text-muted">
            Share of all new cases contacted by their administrative target, including late and never-served
            cases. Bar: mean of {replications} replications. Line: central 95% of replications.
          </p>
        </figcaption>
        <ul className="flex flex-col gap-3">
          {POLICIES.map((p) => {
            const m = scenario.policies[p.key].on_time_rate;
            const range = m.lo == null ? "" : `; 95% of replications between ${pct(m.lo)} and ${pct(m.hi)}`;
            return (
              <li
                key={p.key}
                title={`${p.name}: mean ${pct(m.mean)}${range}`}
                className="grid gap-1 md:grid-cols-[230px_1fr_128px] md:items-center md:gap-3"
              >
                <div>
                  <p className="font-bold">{p.name}</p>
                  <p className="text-xs text-muted">{p.detail}</p>
                </div>
                <Track>
                  {m.mean != null ? (
                    <div
                      className="absolute inset-y-1 left-0 rounded-r bg-brand-600"
                      style={{ width: `${m.mean * 100}%` }}
                    />
                  ) : null}
                  {m.lo != null ? <Range lo={m.lo * 100} hi={m.hi * 100} /> : null}
                </Track>
                <p className="font-bold tabular-nums md:text-right">
                  {pct(m.mean)}
                  {m.lo != null ? (
                    <span className="block whitespace-nowrap text-xs font-normal text-muted">
                      {pct(m.lo)}–{pct(m.hi)}
                    </span>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ul>
        <div className="hidden text-xs text-muted md:grid md:grid-cols-[230px_1fr_128px] md:gap-3" aria-hidden="true">
          <span />
          <div className="relative h-4">
            {TICKS.map((t) => (
              <span
                key={t}
                className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                style={{ left: `${t}%` }}
              >
                {t}%
              </span>
            ))}
          </div>
        </div>
      </figure>
    </Card>
  );
}

function Track({ children }) {
  return (
    <div className="relative h-6 rounded bg-brand-50" aria-hidden="true">
      {TICKS.slice(1, -1).map((t) => (
        <div key={t} className="absolute inset-y-0 w-px bg-brand-200" style={{ left: `${t}%` }} />
      ))}
      {children}
    </div>
  );
}

export function Range({ lo, hi }) {
  return (
    <>
      <div
        className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-ink"
        style={{ left: `${lo}%`, width: `${Math.max(hi - lo, 0)}%` }}
      />
      <div className="absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 bg-ink" style={{ left: `${lo}%` }} />
      <div className="absolute top-1/2 h-2.5 w-0.5 -translate-x-full -translate-y-1/2 bg-ink" style={{ left: `${hi}%` }} />
    </>
  );
}
