"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getCaseByToken, createContactRequest, getDemoNow } from "@/lib/data";

const CaseContext = createContext(null);

export function CaseProvider({ token, children }) {
  const [state, setState] = useState({ phase: "loading", data: null });

  const load = useCallback(async () => {
    try {
      const data = await getCaseByToken(token);
      setState(data ? { phase: "ready", data } : { phase: "invalid", data: null });
    } catch {
      setState({ phase: "error", data: null });
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const reload = useCallback(() => {
    setState({ phase: "loading", data: null });
    load();
  }, [load]);

  const requestContact = useCallback(async () => {
    const updated = await createContactRequest(token);
    setState({ phase: "ready", data: updated });
  }, [token]);

  const value = { ...state, now: getDemoNow(), reload, requestContact };
  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCase() {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error("useCase must be used inside CaseProvider");
  return ctx;
}