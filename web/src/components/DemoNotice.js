"use client";

import { useLang } from "@/lib/i18n";

export default function DemoNotice() {
  const { t } = useLang();
  return <p className="px-5 py-4 text-center text-sm text-muted">{t("notEmergency")}</p>;
}