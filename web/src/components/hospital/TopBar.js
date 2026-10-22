import Link from "next/link";

// Brand mark placeholder. To use the illustrated logo from Figma, export it as
// web/public/logo-mark.svg and swap the <svg> below for <img src="/logo-mark.svg" alt="" />.
function Mark() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M13 24c0-5 3.5-8 7-8s7 3 7 8M16 14.5a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function TopBar() {
  return (
    <header className="bg-brand-900 text-white shadow-md">
      <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-6 py-3 lg:px-8">
        <Link href="/hospital/patients" className="flex items-center gap-3">
          <Mark />
          <span className="text-[26px] tracking-tight">
            <span className="font-extrabold">Ina</span>
            <span className="font-light">Alaga</span>
          </span>
        </Link>
        <div className="flex items-center gap-5">
          <span className="text-white/90" title="No notifications in this demo">
            <span className="sr-only">Notifications: none in this demo</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
              <path d="M10 20a2 2 0 0 0 4 0" />
            </svg>
          </span>
        <div className="flex items-center gap-3 rounded-xl bg-white/95 px-3 py-1.5 text-brand-900">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-950 text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold">Facility staff</p>
            <p className="text-[11px] text-muted">Cagayan Valley Medical Center</p>
          </div>
        </div>
        </div>
      </div>
    </header>
  );
}
