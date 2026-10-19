import Icon from "./Icon";

export default function Badge({ icon, children }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-200 px-3 py-1 text-sm font-bold text-brand-900">
      <Icon name={icon} size={16} />
      {children}
    </span>
  );
}