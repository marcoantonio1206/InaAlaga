"use client";

import { useParams } from "next/navigation";
import { CaseProvider, useCase } from "@/lib/caseContext";
import BottomNav from "@/components/BottomNav";
import InvalidLink from "@/components/InvalidLink";
import AccessShell, { SkeletonBlocks } from "@/components/AccessShell";
import Button from "@/components/ui/Button";
import { useLang } from "@/lib/i18n";

function Gate({ token, children }) {
  const { phase, reload } = useCase();
  const { t } = useLang();

  if (phase === "loading") {
    return (
      <AccessShell title={t("loadingFollowUp")}>
        <SkeletonBlocks />
      </AccessShell>
    );
  }
  if (phase === "invalid") return <InvalidLink />;
  if (phase === "error") {
    return (
      <AccessShell title={t("loadFailedTitle")}>
        <p className="text-muted">{t("loadFailedBody")}</p>
        <Button onClick={reload}>{t("retry")}</Button>
      </AccessShell>
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