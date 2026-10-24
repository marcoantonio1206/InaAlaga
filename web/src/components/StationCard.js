"use client";

import Card from "./ui/Card";
import { displayStationName } from "@/lib/format";
import Icon from "./ui/Icon";
import { useLang } from "@/lib/i18n";
import { VISIT_STATIONS } from "@/lib/visitLocation";

// Approximate demo-station reference points from data/geography/pilot_v2/stations.csv
// (mapped OSM POIs; entrances unverified). Not official catchments.

function mapUrls({ lat, lon }) {
  const bbox = [lon - 0.008, lat - 0.006, lon + 0.008, lat + 0.006].map((n) => n.toFixed(6)).join(",");
  return {
    embed: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`,
    open: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`,
  };
}

export default function StationCard({ stationName, showMap = false, label, children }) {
  const { t } = useLang();
  const coords = VISIT_STATIONS.find((s) => s.name === stationName);
  const urls = coords ? mapUrls(coords) : null;

  return (
    <Card>
      <div className="flex items-center gap-2 text-sm font-bold text-brand-900">
        <Icon name="pin" size={18} />
        {label ?? t("stationLocation")}
      </div>
      {stationName ? (
        <>
          <h2 className="text-xl font-extrabold">{displayStationName(stationName)}</h2>
          {coords ? <p className="text-sm text-muted">{t("stationCategory")} · {coords.area}</p> : null}
          {children}
          {showMap && urls ? (
            <>
              <iframe
                key={urls.embed}
                src={urls.embed}
                title={`${t("stationMapLabel")} · ${displayStationName(stationName)}`}
                loading="lazy"
                className="h-56 w-full rounded-xl border border-brand-200"
              />
              <a
                href={urls.open}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-3 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900"
              >
                <Icon name="pin" size={18} />
                {t("stationOpenMap")}
              </a>
            </>
          ) : null}
          {showMap && !urls ? <p className="text-sm text-muted">{t("stationMapUnavailable")}</p> : null}
          {showMap && coords ? <p className="text-xs text-muted">{t(coords.approximate ? "stationApproximate" : "stationReference")}</p> : null}
        </>
      ) : (
        <p className="text-muted">{t("stationNone")}</p>
      )}
    </Card>
  );
}
