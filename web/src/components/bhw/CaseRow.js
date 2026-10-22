import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Pill from "@/components/hospital/Pill";
import { formatDot, initials, overdueLabel } from "@/lib/format";
import { STATE_LABEL, bhwState, visitLine, requestLine } from "@/lib/bhwStatus";

export default function CaseRow({ c, now, href }) {
  const state = bhwState(c, now);
  const s = STATE_LABEL[state];
  const late = state === "completed" ? null : overdueLabel(c.due_at, now);
  const req = requestLine(c);

  return (
    <li>
      <Link
        href={href ?? `/bhw?case=${c.id}`}
        className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-white p-4 hover:bg-brand-50"
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white"
        >
          {initials(c.alias)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="font-bold">{c.alias}</p>
            <p className="text-sm text-muted">
              {c.id} · {c.barangay}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone={s.tone}>
              <Icon name={s.icon} size={14} className="mr-1" />
              {s.label}
            </Pill>
            {req ? <Pill tone={req.tone}>{req.label}</Pill> : null}
          </div>
          <p className="text-sm">{visitLine(c)}</p>
          <p className={`text-sm ${late ? "text-warn-ink" : "text-muted"}`}>
            Demo target {formatDot(c.due_at)}
            {late ? ` · ${late}` : ""}
          </p>
        </div>
        <span className="self-center text-brand-900" aria-hidden="true">
          ›
        </span>
      </Link>
    </li>
  );
}
