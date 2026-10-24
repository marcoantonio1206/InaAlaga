"use client";

import useLiveResource from "@/lib/hooks/useLiveResource";
import RefreshStatus from "@/components/bhw/RefreshStatus";
import useCurrentTime from "@/lib/hooks/useCurrentTime";

import { visitNeedsUpdate } from "@/lib/visitTiming";
import { visitTypeLabel, visitDestination } from "@/lib/visitLocation";

import { useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/hospital/PageHeader";
import Pill from "@/components/hospital/Pill";
import Icon from "@/components/ui/Icon";
import { Loading, LoadFailed, Empty } from "@/components/bhw/LoadState";
import { listWorkerSchedule } from "@/lib/data";
import { useWorker } from "@/lib/bhwWorkers";
import { formatDot, formatDotYear, displayStationName } from "@/lib/format";

export default function BhwSchedulePage() {
  const { worker } = useWorker();
  const now = useCurrentTime();
  const load = useCallback(async () => ({ worker: worker.name, data: await listWorkerSchedule(worker.name) }), [worker.name]);
  const { data: rows, error: failed, refreshing, refresh } = useLiveResource(load);
  const list = rows?.worker === worker.name ? rows.data : null;

  return (
    <>
      <PageHeader showDemo={false} title="Schedule" subtitle={`${worker.name} · As of: ${formatDotYear(now)}`} />
      <RefreshStatus refreshing={refreshing} refresh={refresh} error={failed && list !== null} subject="your schedule" />
      <p className="mb-4 text-sm text-muted">
        Only saved visits naming you as the recorded visitor. Visitor-scoped: a case accepted by
        you appears here only after a schedule is saved.
      </p>
      {failed && list === null ? (
        <LoadFailed
          message="Couldn't load your schedule."
          onRetry={refresh}
        />
      ) : list === null ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty
          title="No visits saved for you yet."
          body="Accept a case, then save a schedule from its Case detail."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map(({ case: c, visit }) => {
            const passed = visitNeedsUpdate(visit, now);
            return (
              <li key={`${c.id}-${visit.id}`}>
                <Link
                  href={`/bhw?case=${c.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-white p-4 hover:bg-brand-50"
                >
                  <Icon name="calendar" size={22} className="shrink-0 text-brand-900" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="font-bold">{formatDot(visit.scheduled_for)} · {visitTypeLabel(visit)}</p>
                    <p className="text-sm text-muted">
                      {c.alias} · {c.id} · {displayStationName(visitDestination(visit))}
                    </p>
                    <Pill tone={visit.arranged_at ? "ok" : passed ? "warn" : "lilac"}>
                      {visit.arranged_at ? "Arranged with mother · visit remains open" : passed ? "Update needed · awaiting visit update" : "Scheduled · visit remains open"}
                    </Pill>
                  </div>
                  <span className="text-brand-900" aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-sm text-muted">
        Viewing a case from here returns to Case detail without completing the visit.
      </p>
    </>
  );
}
