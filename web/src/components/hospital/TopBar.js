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
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-6 py-3 lg:px-8">
        <Link href="/hospital/patients" className="flex items-center gap-3">
          <Mark />
          <span className="text-2xl tracking-tight">
            <span className="font-extrabold">Ina</span>
            <span className="font-light">Alaga</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-white/95 px-3 py-2 text-brand-900">
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
            <p className="font-bold">Facility staff</p>
            <p className="text-xs text-muted">Cagayan Valley Medical Center</p>
          </div>
        </div>
      </div>
    </header>
  );
}
