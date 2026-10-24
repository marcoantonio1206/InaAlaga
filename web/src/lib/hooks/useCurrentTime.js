"use client";
import { useEffect, useState } from "react";
import { actionTimestamp } from "@/lib/actionTime";

export default function useCurrentTime() {
  const [now, setNow] = useState(actionTimestamp);
  useEffect(() => {
    const update = () => setNow(actionTimestamp());
    const timer = window.setInterval(update, 1000);
    window.addEventListener("focus", update);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);
  return now;
}
