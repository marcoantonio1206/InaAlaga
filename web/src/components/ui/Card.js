const tones = {
  default: "bg-white border-brand-200",
  tint: "bg-brand-200 border-brand-200",
  dashed: "bg-white border-dashed border-brand-600",
};

export default function Card({ children, tone = "default", className = "" }) {
  return (
    <section className={`flex flex-col gap-2 rounded-2xl border p-4 ${tones[tone]} ${className}`}>
      {children}
    </section>
  );
}