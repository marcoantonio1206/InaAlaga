import Link from "next/link";
import { formatDotYear } from "@/lib/format";

// The mother's private demo link as hospital staff see it. `link` is
// { token, expires_at }, null when no live link exists, or false when it
// could not be loaded.
export default function MotherLink({ link }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-sm text-muted">Mother&apos;s link</p>
      {link ? (
        <>
          <Link
            href={`/inbox/${link.token}`}
            target="_blank"
            rel="noopener"
            className="w-fit font-bold text-brand-900 underline"
          >
            Open message preview ↗
          </Link>
          <p className="text-sm text-muted">
            Private link for this case only. Expires {formatDotYear(link.expires_at)}.
          </p>
        </>
      ) : (
        <p className="font-bold">
          {link === false ? "Couldn't load the link." : "No active link for this case."}
        </p>
      )}
    </div>
  );
}
