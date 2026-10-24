export default function RefreshStatus({ refreshing, refresh, error, subject }) {
  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">Updates automatically</p>
        <button type="button" onClick={refresh} disabled={refreshing} className="rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-bold text-brand-900 disabled:opacity-50">
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error ? <p role="status" className="rounded-xl bg-warn-bg p-3 text-sm text-warn-ink">Couldn’t refresh {subject}. Showing the last loaded details. <button type="button" onClick={refresh} className="font-bold underline">Retry</button></p> : null}
    </div>
  );
}
