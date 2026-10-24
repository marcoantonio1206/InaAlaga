"use client";

import MotherHeader from "@/components/MotherHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import VisitLocation from "@/components/VisitLocation";
import VisitCountdown from "@/components/VisitCountdown";
import { useCase } from "@/lib/caseContext";
import { useLang } from "@/lib/i18n";
import { formatDateTime, displayStationName } from "@/lib/format";
import { groupVisits } from "@/lib/visits";

export default function VisitsPage() {
  const { data, now } = useCase();
  const { t, lang } = useLang();
  const { next, future, previous } = groupVisits(data.visits);
  const details = (visit) => <div className="mt-3 flex flex-col gap-3">
    <VisitLocation visit={visit} />
    {visit.worker_name ? <p className="text-sm text-muted">{t("visitWorkerLabel")} {visit.worker_name}</p> : null}
    {visit.state === "completed" && visit.completed_recorded_at ? <p className="text-xs text-muted">{t("completionRecordedLabel")} {formatDateTime(visit.completed_recorded_at, lang)}</p> : null}
  </div>;
  const summary = (visit, completed = false) => <>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="font-bold">{formatDateTime(visit.scheduled_for, lang)}</span>
      <Badge icon={completed ? "check" : "calendar"} tone={completed ? "success" : visit.state === "scheduled" ? "future" : "default"}>
        {t(completed ? "statusCompleted" : visit.state === "cancelled" ? "visitCancelled" : "statusScheduled")}
      </Badge>
    </div>
    <span className="mt-1 block text-sm text-muted">{visit.location_type === "station" ? `${t("stationCheckup")} · ${displayStationName(visit.station_name) || t("stationDestinationMissing")}` : `${t("locationHome")} · ${t("yourHome")}`}</span>
    <span className="mt-2 block text-xs font-bold text-brand-900"><span className="group-open:hidden">{t("viewVisitDetails")}</span><span className="hidden group-open:inline">{t("hideVisitDetails")}</span></span>
  </>;

  return (
    <main>
      <MotherHeader alias={data.alias} />
      <div className="flex flex-col gap-5 p-4">
        <section aria-labelledby="next-visit-heading" className="flex flex-col gap-2">
          <h2 id="next-visit-heading" className="text-lg font-extrabold text-brand-900">{t("nextVisitHeading")}</h2>
          {next ? <Card tone="next" className="gap-3">
            <Badge icon={Date.parse(next.scheduled_for) < Date.parse(now) ? "clock" : "calendar"}>{t(Date.parse(next.scheduled_for) < Date.parse(now) ? "awaitingVisitUpdate" : "statusScheduled")}</Badge>
            <h3 className="text-[28px] font-extrabold leading-tight">{formatDateTime(next.scheduled_for, lang)}</h3>
            <VisitCountdown visit={next} />
            {details(next)}
          </Card> : <Card><p className="font-bold">{t("noUpcomingVisit")}</p><p className="text-sm text-muted">{t("scheduleWillAppear")}</p></Card>}
        </section>
        {future.length ? <section aria-labelledby="future-visits-heading" className="flex flex-col gap-2">
          <h2 id="future-visits-heading" className="text-lg font-extrabold text-future-ink">{t("futureVisitsHeading")} <span className="text-sm font-normal">({future.length})</span></h2>
          {future.map((visit) => <Card key={visit.id} tone="future"><details className="group">
            <summary className="cursor-pointer list-none">{summary(visit)}</summary>
            {details(visit)}
          </details></Card>)}
        </section> : null}
        <section aria-labelledby="previous-visits-heading" className="flex flex-col gap-2">
          <h2 id="previous-visits-heading" className="text-lg font-extrabold">{t("visitsPrevious")}</h2>
          {previous.length ? previous.map((visit) => <Card key={visit.id}><details className="group">
            <summary className="cursor-pointer list-none">{summary(visit, visit.state === "completed")}</summary>
            {details(visit)}
          </details></Card>) : <Card><p className="text-sm text-muted">{t("visitsNonePrevious")}</p></Card>}
        </section>
      </div>
    </main>
  );
}
