"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createResourcePoller } from "@/lib/pollResource";

export default function useLiveResource(load, refreshKey = "") {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const pollerRef = useRef(null);
  const refresh = useCallback(() => pollerRef.current?.refresh(), []);

  useEffect(() => {
    const poller = createResourcePoller(load, {
      onData(value) { setData(value); setError(false); },
      onError() { setError(true); },
      onBusy: setRefreshing,
    });
    pollerRef.current = poller;
    const update = () => { if (document.visibilityState !== "hidden") void poller.refresh(); };
    const timer = window.setInterval(update, 5000);
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    void poller.refresh();
    return () => {
      poller.stop();
      window.clearInterval(timer);
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [load, refreshKey]);

  return { data, error, refreshing, refresh };
}
