"use client";

import AccessShell from "./AccessShell";
import { useLang } from "@/lib/i18n";

// Shown for unknown and expired links alike, so a bad link reveals nothing.
export default function InvalidLink() {
  const { t } = useLang();
  return (
    <AccessShell title={t("invalidTitle")}>
      <p className="text-muted">{t("invalidBody")}</p>
      <p className="text-sm text-muted">{t("invalidNoDetails")}</p>
    </AccessShell>
  );
}
