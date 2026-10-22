export default function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold lg:text-3xl">{title}</h1>
        {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
      </div>
      <span className="rounded-full bg-brand-200 px-3 py-1 text-sm font-bold text-brand-900">
        Fictional demo
      </span>
    </div>
  );
}