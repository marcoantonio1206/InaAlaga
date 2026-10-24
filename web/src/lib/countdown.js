export function visitCountdown(scheduledFor, now, lang = "en") {
  const difference = Date.parse(scheduledFor) - Date.parse(now);
  if (!Number.isFinite(difference)) return null;
  if (difference <= 0) return { passed: true, text: lang === "fil" ? "Hinihintay ang ulat ng kawani" : "Awaiting visit update" };
  let seconds = Math.ceil(difference / 1000);
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (lang === "fil") return { passed: false, text: `${days ? `${days} araw ` : ""}${hours} oras ${String(minutes).padStart(2, "0")} min ${String(remainingSeconds).padStart(2, "0")} seg` };
  return { passed: false, text: `${days ? `${days}d ` : ""}${hours}h ${String(minutes).padStart(2, "0")}m ${String(remainingSeconds).padStart(2, "0")}s` };
}
