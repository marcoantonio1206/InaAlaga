import Card from "@/components/ui/Card";
import { Range } from "@/components/coordinator/RateChart";
import { COMPARISONS, differenceLimit, pp, share } from "@/lib/planning";

// Paired differences on one symmetric axis around zero. Dot = mean of the
// per-replication differences; line = central 95% of them.
export default function DifferenceChart({ scenario, replications }) {
  const limit = differenceLimit(COMPARISONS.map((c) => scenario.comparisons[c.key]));
  const at = (v) => 50 + (v / limit) * 50;

  return (
    <Card>
      <figure className="flex flex-col gap-3">
        <figcaption>
          <h2 className="text-lg font-extrabold">Paired policy differences</h2>
          <p className="text-sm text-muted">
            Percentage points of on-time contact, compared within each of {replications} replications that share
            the same fictional cases and workers. Right of zero: the first policy named completed more contacts
            on time.
          </p>
        </figcaption>
        <ul className="flex flex-col gap-4">
          {COMPARISONS.map((c) => {
            const d = scenario.comparisons[c.key];
            const range = d.lo == null ? "" : `; 95% of replications between ${pp(d.lo)} and ${pp(d.hi)}`;
            return (
              <li
                key={c.key}
                title={`${c.name}: mean ${pp(d.mean)}${range}`}
                className="grid gap-1 md:grid-cols-[230px_1fr_128px] md:items-center md:gap-3"
              >
                <div>
                  <p className="font-bold">{c.name}</p>
                  <p className="text-xs text-muted">{c.detail}</p>
                </div>
                <div>
                  <div className="relative h-6 rounded bg-brand-50" aria-hidden="true">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-muted" />
                    {d.lo != null ? <Range lo={at(d.lo)} hi={at(d.hi)} /> : null}
                    {d.mean != null ? (
                      <div
                        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-900 ring-2 ring-white"
                        style={{ left: `${at(d.mean)}%` }}
                      />
                    ) : null}
                  </div>
                  {d.worse != null ? (
                    <p className="mt-1 text-xs text-muted">
                      Worse in {share(d.worse)} · tied in {share(d.tied)} · better in {share(d.better)} of
                      replications
                    </p>
                  ) : null}
                </div>
                <p className="font-bold tabular-nums md:text-right">
                  {pp(d.mean)}
                  {d.lo != null ? (
                    <span className="block whitespace-nowrap text-xs font-normal text-muted">
                      {pp(d.lo).replace(" pp", "")} to {pp(d.hi)}
                    </span>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ul>
        <div className="hidden text-xs text-muted md:grid md:grid-cols-[230px_1fr_128px] md:gap-3" aria-hidden="true">
          <span />
          <div className="flex justify-between">
            <span>−{limit} pp</span>
            <span>0</span>
            <span>+{limit} pp</span>
          </div>
        </div>
      </figure>
    </Card>
  );
}
