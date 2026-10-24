"use client";

import { createContext, useContext, useState } from "react";
import { WORKERS } from "@/lib/workerDirectory";
export { WORKERS } from "@/lib/workerDirectory";

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
