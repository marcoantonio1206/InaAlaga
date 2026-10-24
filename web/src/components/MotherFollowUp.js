"use client";

import Card from "./ui/Card";
import Badge from "./ui/Badge";
import VisitCountdown from "./VisitCountdown";
import VisitLocation from "./VisitLocation";
import WhyFollowUp from "./WhyFollowUp";
import { useLang } from "@/lib/i18n";
import { formatDateTime, initials, displayStationName } from "@/lib/format";

export default function MotherFollowUp({ caseData, visit, status }) {
  const { t, lang } = useLang();
  const accepted = caseData.handoff_state === "acknowledged";
  const worker = accepted ? caseData.owner_worker : null;

  return (
    <Card className="gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-brand-900">{t("scheduledVisitHeading")}</h2>
        {visit ? (
          <>
            <p className="text-[28px] font-extrabold leading-tight">{formatDateTime(visit.scheduled_for, lang)}</p>
            <VisitCountdown visit={visit} />
            <VisitLocation visit={visit} />
            {visit.worker_name && visit.worker_name !== worker ? (
              <p className="text-sm text-muted">{t(visit.location_type === "station" ? "meetingWorker" : "visitingWorker")} {visit.worker_name}</p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-xl font-extrabold">{t("noUpcomingVisit")}</p>
            <p className="text-sm text-muted">{t("scheduleWillAppear")}</p>
          </>
        )}
      </div>

      {caseData.overdue_arranged_at && !visit?.arranged_at ? <p className="text-sm font-bold text-success-ink">{t("visitArranged")}</p> : null}
      <div className="flex flex-col gap-3 border-t border-brand-200 pt-4">
        <h2 className="font-bold">{t("assignedWorkerHeading")}</h2>
        {worker ? (
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-900 font-bold text-white">{initials(worker)}</span>
            <div className="min-w-0">
              <p className="text-lg font-extrabold">{worker}</p>
              <p className="text-sm leading-6 text-muted">{t("bhwRole")}</p>
            </div>
          </div>
        ) : <p className="text-sm text-muted">{t(accepted ? "workerDetailsPending" : "awaitingWorkerAcceptance")}</p>}
        <p className="text-sm text-muted">
          {caseData.station_name ? <>{t("followupCoordinatedBy")} <span className="font-bold">{displayStationName(caseData.station_name)}</span></> : t("coordinatingStationPending")}
        </p>
        {accepted ? <Badge icon="check">{t("workerAcceptedBadge")}</Badge> : null}
        {status === "pending" || status === "unassigned" ? <Badge icon="clock">{t(status === "unassigned" ? "statusUnassigned" : "statusPending")}</Badge> : null}
      </div>
      <WhyFollowUp compact />
    </Card>
  );
}
