"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Card from "@/components/ui/Card";
import { Modal } from "@/components/ui/Overlay";
import { resetDemoData } from "@/lib/data";
import { primaryBtn, outlineBtn } from "@/components/bhw/useSave";

const localMode = process.env.NEXT_PUBLIC_DATA_SOURCE !== "supabase";

export default function DemonstrationSettings() {
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const busy = useRef(false);
  const resetButton = useRef(null);

  function close() {
    if (busy.current) return;
    setConfirming(false);
    resetButton.current?.focus();
  }

  async function reset() {
    if (busy.current || !localMode || !confirming) return;
    busy.current = true;
    setSaving(true);
    setError(null);
    try {
      await resetDemoData();
      setConfirming(false);
      setStatus("Original sample records restored. Return to a workspace to start again. Refresh other open tabs to see the reset.");
      resetButton.current?.focus();
    } catch {
      setError("The reset could not be completed. Please try again.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh bg-brand-50">
      <header className="bg-brand-900 text-white">
        <div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-between gap-3 px-5 py-4">
          <span className="text-2xl"><span className="font-extrabold">Ina</span>Alaga</span>
          <Link href="/bhw" className="rounded-lg border border-white/40 px-4 py-2 text-sm font-bold">Back to BHW workspace</Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-[900px] flex-col gap-5 px-5 py-6">
        <div>
          <h1 className="text-2xl font-extrabold">Demonstration settings</h1>
          <p className="mt-1 text-sm text-muted">Controls for restarting the sample workflow.</p>
        </div>
        {status ? <p role="status" className="rounded-xl border border-brand-200 bg-white p-4 text-success-ink">{status}</p> : null}
        <Card className="gap-3">
          <h2 className="text-xl font-extrabold">Reset demonstration data</h2>
          <p>Restore the original sample records and start a fresh walkthrough.</p>
          <p className="text-sm text-muted">This clears changes across the hospital, BHW, and mother views in this browser, including added cases, worker acceptance, visits, contact requests, attempts, and event history. Links issued for added cases will stop working.</p>
          <p className="text-sm text-muted">This affects this browser’s local demonstration data. It does not reset other browsers or the shared database.</p>
          {localMode ? <div>
            <button ref={resetButton} type="button" className={outlineBtn} onClick={() => { setStatus(null); setError(null); setConfirming(true); }}>Reset demonstration data</button>
          </div> : <p className="rounded-xl bg-brand-50 p-3 text-sm font-bold">Reset is unavailable in database mode. This page only resets local demonstration data.</p>}
        </Card>
      </main>
      <Modal open={confirming} onClose={close} title="Reset demonstration data?" subtitle="Your current demonstration changes will be cleared."
        footer={<div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" disabled={saving} onClick={close} className={outlineBtn}>Cancel</button>
          <button type="button" disabled={saving} onClick={reset} className={primaryBtn}>{saving ? "Resetting…" : "Yes, reset data"}</button>
        </div>}>
        <p>The original sample records will be restored for all perspectives in this browser. Your added records and saved actions will be removed.</p>
        <p className="mt-3 font-bold">This cannot be undone.</p>
        {error ? <p role="alert" className="mt-3 text-sm text-danger-ink">{error}</p> : null}
      </Modal>
    </div>
  );
}
