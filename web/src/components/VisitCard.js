"use client";

import Card from "./ui/Card";
import Icon from "./ui/Icon";
import { useLang } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";

export default function VisitCard({ visit }) {
  const { t, lang } = useLang();
  const where = visit.location_type === "home" ? t("locationHome") : t("locationStation");
  return (
    <Card>
      <div className="flex items-center gap-2 text-sm font-bold text-brand-900">
        <Icon name="calendar" size={18} />
        {t("yourVisit")}
      </div>
      <h2 className="text-xl font-extrabold">{formatDateTime(visit.scheduled_for, lang)}</h2>
      <p>
        {t("locationLabel")} {where}
      </p>
      <p className="text-muted">{t("visitNote")}</p>
    </Card>
  );
}