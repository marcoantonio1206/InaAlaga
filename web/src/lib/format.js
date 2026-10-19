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