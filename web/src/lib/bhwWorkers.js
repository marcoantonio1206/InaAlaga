"use client";

import { createContext, useContext, useState } from "react";
import { TANZA, LINAO } from "@/lib/demoGeography";

export const WORKERS = [
  { name: "Ana", station: TANZA, short: "Tanza BHS" },
  { name: "Bea", station: LINAO, short: "Linao West BHS" },
];

const WorkerContext = createContext(null);

export function WorkerProvider({ children }) {
  const [worker, setWorker] = useState(WORKERS[0]);
  const select = (name) => setWorker(WORKERS.find((w) => w.name === name) ?? WORKERS[0]);
  return <WorkerContext.Provider value={{ worker, select }}>{children}</WorkerContext.Provider>;
}

export function useWorker() {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error("useWorker must be used inside WorkerProvider");
  return ctx;
}
