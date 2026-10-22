import Card from "@/components/ui/Card";

export function Loading({ label = "Loading…" }) {
  return <p className="p-6 text-muted">{label}</p>;
}

export function LoadFailed({ message, onRetry }) {
  return (
    <Card>
      <p className="font-bold">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="h-12 w-fit rounded-xl bg-brand-900 px-6 font-bold text-white"
      >
        Retry
      </button>
    </Card>
  );
}

export function Empty({ title, body }) {
  return (
    <Card tone="dashed">
      <p className="font-bold">{title}</p>
      {body ? <p className="text-sm text-muted">{body}</p> : null}
    </Card>
  );
}
