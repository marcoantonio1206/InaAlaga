"use client";

import Card from "./ui/Card";
import Icon from "./ui/Icon";
import { useLang } from "@/lib/i18n";

export default function StationCard({ stationName }) {
  const { t } = useLang();
  return (
    <Card>
      <div className="flex items-center gap-2 text-sm font-bold text-brand-900">
        <Icon name="pin" size={18} />
        {t("stationLabel")}
      </div>
      <h2 className="text-xl font-extrabold">{stationName}</h2>
      <p className="text-muted">{t("stationNote")}</p>
    </Card>
  );
}