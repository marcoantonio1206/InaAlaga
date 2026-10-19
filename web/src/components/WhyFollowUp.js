"use client";

import { useLang } from "@/lib/i18n";

export default function WhyFollowUp() {
  const { t } = useLang();
  return (
    <details className="rounded-2xl border border-brand-200 bg-brand-200 px-4 py-3">
      <summary className="cursor-pointer text-base font-bold text-brand-900">{t("whyTitle")}</summary>
      <p className="mt-2 text-muted">{t("whyBody")}</p>
    </details>
  );
}