"use client";

import { useState } from "react";

// Save is the boundary: nothing changes in the UI until the data call resolves.
export default function useSave(fn, onSaved) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function run(...args) {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await fn(...args);
      onSaved(result);
    } catch (e) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return { saving, error, run, clearError: () => setError(null) };
}

export const primaryBtn =
  "h-12 w-full rounded-xl bg-brand-900 px-6 font-bold text-white disabled:opacity-60 lg:w-fit";
export const outlineBtn =
  "h-12 w-full rounded-xl border-2 border-brand-900 bg-white px-6 font-bold text-brand-900 disabled:opacity-60 lg:w-fit";
