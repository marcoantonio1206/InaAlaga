"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/hospital/PageHeader";
import Pill from "@/components/hospital/Pill";
import Icon from "@/components/ui/Icon";
import { Loading, LoadFailed, Empty } from "@/components/bhw/LoadState";
import { listWorkerSchedule, getDemoNow } from "@/lib/data";
import { useWorker } from "@/lib/bhwWorkers";
import { formatDot, formatDotYear } from "@/lib/format";

export default function BhwSchedulePage() {
  const { worker } = useWorker();
  const now = getDemoNow();
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    listWorkerSchedule(worker.name)
      .then((data) => {
        if (active) setRows({ worker: worker.name, data });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [worker.name, attempt]);

  const list = rows && rows.worker === worker.name ? rows.data : null;

  return (
    <>
      <PageHeader title="Schedule" subtitle={`${worker.name} · Demo snapshot: ${formatDotYear(now)}`} />
      <p className="mb-4 text-sm text-muted">
        Only saved home follow-ups naming you as the recorded visitor. Visitor-scoped: a case accepted by
        you appears here only after a schedule is saved.
      </p>
      {failed ? (
        <LoadFailed
          message="Couldn't load your schedule."
          onRetry={() => {
            setFailed(false);
            setAttempt((n) => n + 1);
          }}
        />
      ) : list === null ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty
          title="No home follow-ups saved for you yet."
          body="Accept a case, then save a schedule from its Case detail. Clean-seed cases start empty."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map(({ case: c, visit }) => {
            const passed = new Date(visit.scheduled_for) < new Date(now);
            return (
              <li key={`${c.id}-${visit.id}`}>
                <Link
                  href={`/bhw?case=${c.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-white p-4 hover:bg-brand-50"
                >
                  <Icon name="calendar" size={22} className="shrink-0 text-brand-900" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="font-bold">{formatDot(visit.scheduled_for)} · Home follow-up</p>
                    <p className="text-sm text-muted">
                      {c.alias} · {c.id} · {c.barangay}
                    </p>
                    <Pill tone={passed ? "warn" : "lilac"}>
                      {passed ? "Update needed · awaiting visit update" : "Scheduled · visit remains open"}
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
