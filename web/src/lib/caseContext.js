"use client";

import useCurrentTime from "@/lib/hooks/useCurrentTime";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getCaseByToken, createContactRequest } from "@/lib/data";

const CaseContext = createContext(null);

export function CaseProvider({ token, children }) {
  const [state, setState] = useState({ phase: "loading", data: null });
  const [attempt, setAttempt] = useState(0);
  const now = useCurrentTime();

  useEffect(() => {
    const refresh = () => setAttempt((n) => n + 1);
    const timer = setInterval(refresh, 5000);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    let active = true;
    getCaseByToken(token)
      .then((data) => {
        if (active) setState(data ? { phase: "ready", data } : { phase: "invalid", data: null });
      })
      .catch(() => {
        if (active) setState({ phase: "error", data: null });
      });
    return () => {
      active = false;
    };
  }, [token, attempt]);

  const reload = useCallback(() => {
    setState({ phase: "loading", data: null });
    setAttempt((n) => n + 1);
  }, []);

  const requestContact = useCallback(async () => {
    const updated = await createContactRequest(token);
    setState({ phase: "ready", data: updated });
  }, [token]);

  const value = { ...state, now, reload, requestContact };
  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCase() {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error("useCase must be used inside CaseProvider");
  return ctx;
}
