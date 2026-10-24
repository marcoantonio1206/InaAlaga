"use client";

import { useEffect, useState } from "react";
import { assignCase, listAssignableWorkers } from "@/lib/data";
import { displayStationName } from "@/lib/format";

export default function AssignBhw({ caseId, onSaved }) {
  const [workers, setWorkers] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [workerId, setWorkerId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const worker = workers?.find((w) => w.id === workerId);

  useEffect(() => {
    let active = true;
    listAssignableWorkers().then((data) => { if (active) { setWorkers(data); setLoadFailed(false); } })
      .catch(() => { if (active) setLoadFailed(true); });
    return () => { active = false; };
  }, [attempt]);

  async function submit(e) {
    e.preventDefault();
    if (!worker || saving) return;
    setSaving(true);
    setError("");
    try {
      const updated = await assignCase(caseId, { worker_id: worker.id });
      onSaved(updated);
    } catch (err) {
      setError(err.message || "Couldn't save the assignment. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="border-t border-brand-200 pt-4" aria-labelledby="assign-bhw-title">
    <h3 id="assign-bhw-title" className="mb-2 text-lg font-extrabold">Assign BHW</h3>
    {loadFailed ? <div role="alert" className="text-sm"><p>Couldn’t load the BHW list.</p><button type="button" className="mt-2 font-bold text-brand-900 underline" onClick={() => setAttempt((n) => n + 1)}>Retry</button></div>
      : workers === null ? <p className="text-sm text-muted">Loading BHWs…</p>
      : workers.length === 0 ? <p className="text-sm text-muted">No BHWs available for assignment.</p>
      : <form onSubmit={submit} className="flex flex-col items-start gap-3">
        <label htmlFor="assign-bhw" className="text-sm font-bold">Barangay health worker</label>
        <select id="assign-bhw" value={workerId} disabled={saving} onChange={(e) => { setWorkerId(e.target.value); setError(""); }} className="h-12 w-full rounded-lg border border-brand-200 bg-white px-3 text-base sm:max-w-md" required>
          <option value="">Choose a BHW</option>
          {workers.map((w) => <option key={w.id} value={w.id}>{w.name} · {displayStationName(w.station)}</option>)}
        </select>
        <p className="text-sm text-muted">{worker ? `Assigning ${worker.name} will set ${displayStationName(worker.station)} as the coordinating station.` : "Choose a worker to set the coordinating station."} The BHW must still accept responsibility.</p>
        {error ? <p role="alert" className="text-sm text-danger-ink">Assignment not saved: {error}</p> : null}
        <button type="submit" disabled={!worker || saving} className="h-12 rounded-xl bg-brand-900 px-6 font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Assign BHW"}</button>
      </form>}
  </section>;
}
