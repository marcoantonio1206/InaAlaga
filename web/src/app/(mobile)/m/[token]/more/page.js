"use client";

import MotherHeader from "@/components/MotherHeader";
import Card from "@/components/ui/Card";
import { useCase } from "@/lib/caseContext";
import { useLang } from "@/lib/i18n";

export default function PlaceholderPage() {
  const { data } = useCase();
  const { t } = useLang();
  return (
    <main>
      <MotherHeader alias={data.alias} />
      <div className="p-4">
        <Card>
          <p className="text-muted">{t("tabSoon")}</p>
        </Card>
      </div>
    </main>
  );
}