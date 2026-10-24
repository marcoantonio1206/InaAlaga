"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import MotherHeader from "@/components/MotherHeader";
import StationCard from "@/components/StationCard";
import Icon from "@/components/ui/Icon";
import { useCase } from "@/lib/caseContext";
import { stationForVisit, VISIT_STATIONS } from "@/lib/visitLocation";
import { groupVisits } from "@/lib/visits";
import { formatDateTime, displayStationName } from "@/lib/format";
import { useLang } from "@/lib/i18n";

function StationContent() {
  const { data } = useCase();
  const { t, lang } = useLang();
  const { token } = useParams();
  const params = useSearchParams();
  const visitId = params.get("visit");
  const stationName = params.get("station");
  const { scheduled } = groupVisits(data.visits);
  const nextCheckup = scheduled.find((v) => v.location_type === "station" && stationForVisit(data, v.id));
  const destination = visitId ? stationForVisit(data, visitId) : null;
  const selected = visitId ? destination : stationName
    ? VISIT_STATIONS.find((s) => s.name === stationName)
    : VISIT_STATIONS.find((s) => s.name === (nextCheckup?.station_name || data.station_name));
  const selectedVisit = visitId ? data.visits?.find((v) => v.id === visitId)
    : scheduled.find((v) => v.location_type === "station" && v.station_name === selected?.name);
  const hasCheckup = selectedVisit?.state === "scheduled";
  const coordinatesFollowUp = selected?.name === data.station_name;
  const base = `/m/${encodeURIComponent(token)}`;

  return (
    <main>
      <MotherHeader alias={data.alias} />
      <div className="flex flex-col gap-4 p-4">
        <h2 className="text-xl font-extrabold">{t("stationsTitle")}</h2>
        {selected ? (
          <StationCard stationName={selected.name} showMap label={t(hasCheckup ? "checkupLocation" : "stationLocation")}>
            {hasCheckup ? (
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
                <p className="text-sm font-bold text-brand-900">{t("scheduledCheckup")}</p>
                <p className="text-xl font-extrabold">{formatDateTime(selectedVisit.scheduled_for, lang)}</p>
                <Link href={`${base}/visits`} className="inline-block py-2 text-sm font-bold text-brand-900">{t("viewVisitLink")} →</Link>
              </div>
            ) : null}
            {coordinatesFollowUp ? <p className="text-sm font-bold text-brand-900">{t("coordinatesFollowup")}</p> : null}
          </StationCard>
        ) : (
          <p role="alert" className="rounded-xl border border-brand-200 bg-white p-4">
            {visitId ? t("stationVisitMissing") : t("chooseStationLocation")}
          </p>
        )}
        <section aria-labelledby="station-list-title" className="flex flex-col gap-2">
          <h2 id="station-list-title" className="text-lg font-extrabold">{t("stationList")}</h2>
          <p className="text-sm text-muted">{t("chooseStationMap")}</p>
          {VISIT_STATIONS.map((station) => {
            const active = station.name === selected?.name;
            const checkup = scheduled.some((v) => v.location_type === "station" && v.station_name === station.name);
            return (
              <Link key={station.name} href={`${base}/station?station=${encodeURIComponent(station.name)}`} scroll={false}
                aria-current={active ? "true" : undefined}
                className={`flex min-h-[48px] items-start gap-3 rounded-2xl border p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900 ${active ? "border-brand-600 bg-brand-50" : "border-brand-200 bg-white"}`}>
                <span className="mt-1 text-brand-900"><Icon name="pin" size={20} /></span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-extrabold">{displayStationName(station.name)}</p>
                  <p className="text-sm text-muted">{t("stationCategory")}</p>
                  <p className="text-sm text-muted">{station.area}</p>
                  {checkup ? <p className="text-sm font-bold text-brand-900">{t("scheduledCheckup")}</p> : null}
                  {station.name === data.station_name ? <p className="text-sm text-brand-900">{t("coordinatesFollowup")}</p> : null}
                </div>
                {active ? <span className="text-xs font-bold text-brand-900">{t("stationSelected")}</span> : null}
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function StationLoading() {
  const { t } = useLang();
  return <p className="p-4">{t("loadingStation")}</p>;
}

export default function StationPage() {
  return <Suspense fallback={<StationLoading />}><StationContent /></Suspense>;
}
