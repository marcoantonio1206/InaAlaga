"use client";

import Link from "next/link";
import { displayStationName } from "@/lib/format";
import { useParams } from "next/navigation";
import { useLang } from "@/lib/i18n";

export default function VisitLocation({ visit }) {
  const { token } = useParams();
  const { t } = useLang();
  const atStation = visit.location_type === "station";
  return (
    <div className="flex flex-col gap-2">
      <p className="font-bold">{atStation ? t("stationCheckup") : <>{t("locationHome")} · {t("yourHome")}</>}</p>
      {atStation ? (
        <>
          <p className="font-bold text-brand-900">{displayStationName(visit.station_name) || t("stationDestinationMissing")}</p>
          {visit.station_name ? (
            <Link href={`/m/${encodeURIComponent(token)}/station?visit=${encodeURIComponent(visit.id)}`}
              className="flex min-h-11 items-center justify-center rounded-xl border-2 border-brand-900 bg-white px-3 py-2 font-bold text-brand-900 hover:bg-brand-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900">
              {t("stationLocation")}
            </Link>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
