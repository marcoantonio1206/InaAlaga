import { visitNeedsUpdate } from "@/lib/visitTiming";
import { formatDot } from "@/lib/format";
import { groupVisits } from "@/lib/visits";

// Separate saved updates into short, unbroken lines instead of one sentence.
export default function VisitContactCell({ c, now }) {
  const { next, previous } = groupVisits(c.visits);
  const completed = previous.filter((v) => v.state === "completed");
  const latestAttempt = [...(c.contact_attempts ?? [])]
    .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))[0];
  const hasRequest = c.request_state === "recorded" || c.request_state === "acknowledged";

  return <div className="min-w-[200px] space-y-2 whitespace-nowrap leading-relaxed">
    <div>
      <p className={next || completed.length ? "font-bold" : ""}>{next ? next.arranged_at ? "Arranged with mother" : visitNeedsUpdate(next, now) ? "Awaiting visit update" : "Scheduled visit" : completed.length ? "Visit completed" : "No visit scheduled"}</p>
      {next ? <p>{formatDot(next.scheduled_for)}</p> : null}
      {next && completed.length ? <p className="text-xs text-muted">{completed.length === 1 ? "1 previous visit completed" : `${completed.length} previous visits completed`}</p> : null}
    </div>
    {hasRequest || latestAttempt ? <div className="space-y-1 text-xs text-muted">
      {hasRequest ? <div>
        <p>{c.request_state === "acknowledged" ? "Contact request acknowledged" : "Contact requested"}</p>
        {c.request_state === "recorded" ? <p>Awaiting acknowledgment</p> : null}
      </div> : null}
      {latestAttempt ? <div>
        <p>{latestAttempt.outcome === "reached" ? "Last contact: Reached" : "Last attempt: Not reached"}</p>
        <p>{formatDot(latestAttempt.started_at)}</p>
      </div> : null}
    </div> : null}
  </div>;
}
