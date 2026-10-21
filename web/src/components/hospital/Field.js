export const controlClass = (hasError) =>
  `h-12 w-full rounded-lg border bg-white px-3 text-base ${
    hasError ? "border-danger-ink" : "border-brand-200"
  }`;

export default function Field({ label, hint, error, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-bold">
        {label}
      </label>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
      {children}
      {error ? (
        <p role="alert" className="text-sm text-danger-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}