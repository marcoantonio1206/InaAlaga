"use client";

import { useState } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Icon from "./ui/Icon";
import { useLang } from "@/lib/i18n";

export default function RequestPanel({ requestState, onRequest }) {
  const { t } = useLang();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    setSaving(true);
    setFailed(false);
    try {
      await onRequest();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  if (requestState === "recorded") {
    return (
      <Card tone="tint">
        <div className="flex items-center gap-2 text-sm font-bold text-brand-900">
          <Icon name="check" size={18} />
          {t("requestLabel")}
        </div>
        <p className="font-bold">{t("requestRecorded")}</p>
        <p className="text-muted">{t("requestWaiting")}</p>
      </Card>
    );
  }

  if (requestState === "acknowledged") {
    return (
      <Card tone="tint">
        <div className="flex items-center gap-2 text-sm font-bold text-brand-900">
          <Icon name="check" size={18} />
          {t("requestLabel")}
        </div>
        <p className="font-bold">{t("requestAcked")}</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2 text-sm font-bold text-brand-900">
        <Icon name="message" size={18} />
        {t("requestLabel")}
      </div>
      <p>{t("requestPrompt")}</p>
      <Button variant="outline" onClick={handleClick} disabled={saving}>
        {saving ? t("requestSaving") : t("requestButton")}
      </Button>
      {failed ? (
        <p role="alert" className="text-sm font-bold text-red-700">
          {t("requestFailed")}
        </p>
      ) : null}
    </Card>
  );
}