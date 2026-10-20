"use client";

import { useParams } from "next/navigation";
import { CaseProvider, useCase } from "@/lib/caseContext";
import BottomNav from "@/components/BottomNav";
import InvalidLink from "@/components/InvalidLink";
import Button from "@/components/ui/Button";
import { useLang } from "@/lib/i18n";

function Gate({ token, children }) {
  const { phase, reload } = useCase();
  const { t } = useLang();

  if (phase === "loading") {
    return <p className="p-8 text-center text-muted">{t("loading")}</p>;
  }
  if (phase === "invalid") return <InvalidLink />;
  if (phase === "error") {
    return (
      <main className="flex min-h-dvh flex-col justify-center gap-4 p-5">
        <p className="text-center font-bold">{t("loadFailed")}</p>
        <Button onClick={reload}>{t("retry")}</Button>
      </main>
    );
  }
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1">{children}</div>
      <BottomNav token={token} />
    </div>
  );
}

export default function MotherLayout({ children }) {
  const { token } = useParams();
  return (
    <CaseProvider token={token}>
      <Gate token={token}>{children}</Gate>
    </CaseProvider>
  );
}