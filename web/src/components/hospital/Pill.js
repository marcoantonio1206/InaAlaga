const tones = {
  lilac: "bg-brand-200 text-brand-900",
  ok: "bg-ok-bg text-ok-ink",
  warn: "bg-warn-bg text-warn-ink",
};

export default function Pill({ tone = "lilac", children }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}