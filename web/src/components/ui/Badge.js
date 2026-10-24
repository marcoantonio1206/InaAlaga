import Icon from "./Icon";

export default function Badge({ icon, children, tone = "default" }) {
  const color = tone === "success" ? "bg-ok-bg text-ok-ink" : tone === "future" ? "bg-future-bg text-future-ink" : "bg-brand-200 text-brand-900";
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${color}`}>
      <Icon name={icon} size={16} />
      {children}
    </span>
  );
}
