"use client";

import Card from "./ui/Card";
import Badge from "./ui/Badge";
import { useLang } from "@/lib/i18n";

const MAP = {
  pending: { icon: "clock", label: "statusPending", title: "pendingTitle", body: "pendingBody" },
  acknowledged: { icon: "check", label: "statusAcknowledged", title: "ackTitle", body: "ackBody" },
  scheduled: { icon: "calendar", label: "statusScheduled", title: "schedTitle", body: "schedBody" },
  overdue: { icon: "alert", label: "statusOverdue", title: "overdueTitle", body: "overdueBody" },
  completed: { icon: "check", label: "statusCompleted", title: "doneTitle", body: "doneBody" },
};

export default function StatusCard({ status }) {
  const { t } = useLang();
  const m = MAP[status];
  const body = t(m.body);
  return (
    <Card>
      <Badge icon={m.icon}>{t(m.label)}</Badge>
      <h2 className="text-xl font-extrabold leading-tight">{t(m.title)}</h2>
      {body ? <p className="text-muted">{body}</p> : null}
    </Card>
  );
}