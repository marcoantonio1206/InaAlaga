"use client";
import { Modal } from "@/components/ui/Overlay";
import { arrangeOverdue } from "@/lib/data";
import useSave, { primaryBtn, outlineBtn } from "./useSave";

export default function ArrangeForm({ c, worker, onSaved, onCancel }) {
  const { saving, error, run } = useSave(arrangeOverdue, onSaved);
  return <Modal open onClose={onCancel} disableClose={saving} title="Arranged with mother" subtitle="Confirm before clearing overdue warnings"><div className="flex flex-col gap-4">
    <p>Confirm that you have agreed on next steps with {c.alias}.</p>
    <p className="text-sm text-muted">This clears the current overdue warnings and records your name and the time. It does not complete a visit or change its date. Later visits can still become overdue.</p>
    {error ? <p role="alert" className="text-sm text-danger-ink">Arrangement not saved: {error}</p> : null}
    <div className="flex flex-wrap gap-3"><button type="button" disabled={saving} onClick={() => run(c.id, { worker_name: worker.name })} className={primaryBtn}>{saving ? "Saving…" : "Confirm arranged with mother"}</button><button type="button" disabled={saving} onClick={onCancel} className={outlineBtn}>Cancel</button></div>
  </div></Modal>;
}
