"use client";

import { useLang } from "@/lib/i18n";

export default function WhyFollowUp({ compact = false }) {
  const { t } = useLang();
  return (
    <details className={compact ? "border-t border-brand-200 pt-3" : "rounded-2xl border border-brand-200 bg-brand-200 px-4 py-3"}>
      <summary className="cursor-pointer text-base font-bold text-brand-900">{t(compact ? "howFollowupWorks" : "whyTitle")}</summary>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t(compact ? "howFollowupWorksBody" : "whyBody")}</p>
    </details>
  );
}
