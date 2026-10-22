"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AccessShell, { SkeletonBlocks } from "@/components/AccessShell";
import InvalidLink from "@/components/InvalidLink";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { getSimulatedMessage } from "@/lib/data";
import { useLang } from "@/lib/i18n";

// Figma frame "Your follow-up link": the simulated SMS that carries a mother's
// private link. Opening the link is the only way into her case.
export default function SimulatedInboxPage() {
  const { token } = useParams();
  const { t } = useLang();
  const [message, setMessage] = useState(undefined); // undefined loading · null unknown · false failed
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getSimulatedMessage(token)
      .then((data) => {
        if (active) setMessage(data);
      })
      .catch(() => {
        if (active) setMessage(false);
      });
    return () => {
      active = false;
    };
  }, [token, attempt]);

  if (message === null) return <InvalidLink />;

  return (
    <AccessShell meta={t("inboxMeta")} title={t("inboxTitle")} footnote={t("inboxFootnote")}>
      {message === undefined ? (
        <SkeletonBlocks count={2} />
      ) : message === false ? (
        <>
          <p className="text-muted">{t("loadFailedBody")}</p>
          <Button
            onClick={() => {
              setMessage(undefined);
              setAttempt((n) => n + 1);
            }}
          >
            {t("retry")}
          </Button>
        </>
      ) : (
        <>
          <Card>
            <p className="text-sm font-bold text-brand-900">{t("inboxFrom")}</p>
            <p>
              {t("hello")}, {message.alias}. {t("inboxBody")}
            </p>
            <p className="text-sm text-muted">{t("inboxSimulated")}</p>
          </Card>
          <Link
            href={`/m/${encodeURIComponent(token)}`}
            className="flex h-[52px] items-center justify-center rounded-xl bg-brand-900 text-base font-bold text-white"
          >
            {t("inboxOpen")}
          </Link>
        </>
      )}
    </AccessShell>
  );
}
