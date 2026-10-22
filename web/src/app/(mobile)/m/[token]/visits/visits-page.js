"use client";

import MotherHeader from "@/components/MotherHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import DemoNotice from "@/components/DemoNotice";
import { useCase } from "@/lib/caseContext";
import { useLang } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";

// Visits: what is scheduled and what already happened, newest first within
// each group. Only saved records are shown; nothing is inferred from time.
export default function VisitsPage() {
  const { data } = useCase();
  const { t, lang } = useLang();
  const visits = data.visits ?? [];
  const upcoming = visits.filter((v) => v.state === "scheduled");
  const previous = visits.filter((v) => v.state === "completed" || v.state === "cancelled");

  const row = (v) => {
    const where = v.location_type === "home" ? t("locationHome") : t("locationStation");
    const label =
      v.state === "completed" ? t("statusCompleted") : v.state === "cancelled" ? t("visitCancelled") : t("statusScheduled");
    const icon = v.state === "completed" ? "check" : "calendar";
    return (
      <Card key={v.id}>
        <Badge icon={icon}>{label}</Badge>
        <h2 className="text-xl font-extrabold">{formatDateTime(v.scheduled_for, lang)}</h2>
        <p>
          {t("locationLabel")} {where}
        </p>
        {v.worker_name ? <p className="text-muted">{v.worker_name}</p> : null}
        {v.state === "completed" && v.ended_at ? (
          <p className="text-sm text-muted">
            {t("visitEndedLabel")} {formatDateTime(v.ended_at, lang)}
          </p>
        ) : null}
      </Card>
    );
  };

  return (
    <main>
      <MotherHeader alias={data.alias} />
      <div className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-bold text-brand-900">{t("visitsUpcoming")}</h2>
        {upcoming.length ? upcoming.map(row) : (
          <Card>
            <p className="text-muted">{t("visitsNoneUpcoming")}</p>
          </Card>
        )}
        <h2 className="mt-2 text-sm font-bold text-brand-900">{t("visitsPrevious")}</h2>
        {previous.length ? previous.map(row) : (
          <Card>
            <p className="text-muted">{t("visitsNonePrevious")}</p>
          </Card>
        )}
        <p className="text-sm text-muted">{t("visitNote")}</p>
      </div>
      <DemoNotice />
    </main>
  );
}
