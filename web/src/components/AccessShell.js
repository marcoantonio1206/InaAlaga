"use client";

import LangToggle from "./LangToggle";
import { useLang } from "@/lib/i18n";

// Plain layout for screens shown before a mother's case is open: the simulated
// inbox, loading, load failure and invalid link. No case details belong here.
export default function AccessShell({ meta, title, footnote, children }) {
  const { t } = useLang();
  return (
    <main className="flex min-h-dvh flex-col gap-3 px-4 pb-6 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[28px] font-extrabold leading-tight text-brand-900">InaAlaga</p>
          <p className="text-sm text-muted">{meta ?? t("fictionalDemo")}</p>
        </div>
        <LangToggle tone="light" />
      </div>
      <h1 className="text-2xl font-extrabold leading-tight">{title}</h1>
      {children}
      <p className="text-sm text-muted">{footnote ?? t("notEmergency")}</p>
    </main>
  );
}

export function SkeletonBlocks({ count = 3 }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-2xl bg-brand-200 ${i === 0 ? "h-24" : "h-12"}`}
        />
      ))}
    </div>
  );
}
