export function formatDateTime(iso, lang) {
  const locale = lang === "fil" ? "fil-PH" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function parts(iso, withYear) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(d);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  return `${date} · ${time}`;
}

export function formatDot(iso) {
  return parts(iso, false);
}

export function formatDotYear(iso) {
  return parts(iso, true);
}

export function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export function overdueLabel(dueIso, nowIso) {
  const diff = new Date(nowIso) - new Date(dueIso);
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Overdue by ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `Overdue by ${hrs} ${hrs === 1 ? "hr" : "hrs"}`;
  return `Overdue by ${Math.floor(hrs / 24)} days`;
}