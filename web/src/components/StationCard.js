"use client";

import Card from "./ui/Card";
import Icon from "./ui/Icon";
import { useLang } from "@/lib/i18n";

// Approximate demo-station reference points from data/geography/pilot_v2/stations.csv
// (mapped OSM POIs; entrances unverified). Not official catchments.
const LOCATIONS = {
  "Tanza BHS (demo station)": { lat: 17.6274872, lon: 121.7365289 },
  "Linao West BHS (demo station)": { lat: 17.6502689, lon: 121.7169282 },
};

function mapUrls({ lat, lon }) {
  const bbox = [lon - 0.008, lat - 0.006, lon + 0.008, lat + 0.006].map((n) => n.toFixed(6)).join(",");
  return {
    embed: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`,
    open: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`,
  };
}

export default function StationCard({ stationName, showMap = false }) {
  const { t } = useLang();
  const coords = stationName ? LOCATIONS[stationName] : null;
  const urls = coords ? mapUrls(coords) : null;

  return (
    <Card>
      <div className="flex items-center gap-2 text-sm font-bold text-brand-900">
        <Icon name="pin" size={18} />
        {t("stationLabel")}
      </div>
      {stationName ? (
        <>
          <h2 className="text-xl font-extrabold">{stationName}</h2>
          {showMap && urls ? (
            <>
              <iframe
                src={urls.embed}
                title={t("stationMapTitle")}
                loading="lazy"
                className="h-56 w-full rounded-xl border border-brand-200"
              />
              <a
                href={urls.open}
                target="_blank"
                rel="noreferrer"
                className="w-fit font-bold text-brand-900 underline"
              >
                {t("stationOpenMap")}
              </a>
            </>
          ) : null}
          <p className="text-muted">{t("stationNote")}</p>
          <p className="text-sm text-muted">{t("stationEmergency")}</p>
        </>
      ) : (
        <p className="text-muted">{t("stationNone")}</p>
      )}
    </Card>
  );
}
