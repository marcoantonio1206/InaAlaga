"use client";

import { useLang } from "@/lib/i18n";
import { useCase } from "@/lib/caseContext";
import { visitCountdown } from "@/lib/countdown";

export default function VisitCountdown({ visit }) {
  const { now } = useCase();
  const { lang, t } = useLang();
  if (visit.state !== "scheduled") return null;
  if (visit.arranged_at) return <p className="text-sm font-bold text-success-ink">{t("visitArranged")}</p>;
  const remaining = visitCountdown(visit.scheduled_for, now, lang);
  if (!remaining) return null;
  return (
    <p className="w-fit rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold text-brand-900" role="timer" aria-live="off" title={t("demoClockNote")}>
      {remaining.passed ? t("awaitingVisitUpdate") : <>{t("countdownLabel")} <span className="tabular-nums">{remaining.text}</span></>}
    </p>
  );
}
