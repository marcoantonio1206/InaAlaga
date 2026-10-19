"use client";

import Card from "./ui/Card";
import DemoNotice from "./DemoNotice";
import { useLang } from "@/lib/i18n";

export default function InvalidLink() {
  const { t } = useLang();
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-4 p-5">
      <Card>
        <h1 className="text-xl font-extrabold">{t("invalidTitle")}</h1>
        <p className="text-muted">{t("invalidBody")}</p>
      </Card>
      <DemoNotice />
    </main>
  );
}