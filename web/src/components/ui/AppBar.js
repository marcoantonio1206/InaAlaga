import Link from "next/link";

// Brand mark placeholder. To use the illustrated logo from Figma, export it as
// web/public/logo-mark.svg and swap the <svg> below for <img src="/logo-mark.svg" alt="" />.
export function Mark() {
  return (
    <img
      src="/logo-mark.svg"
      alt=""
      width="40"
      height="40"
      className="h-10 w-10 shrink-0 object-contain"
    />
  );
}
export function Bell() {
  return (
    <span className="text-white/90" title="No notifications">
      <span className="sr-only">Notifications: none</span>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
    </span>
  );
}

// Role chip on the right of the bar. `control` (optional) replaces the static
// detail line with an interactive element such as the BHW worker switcher.
export function RoleChip({ title, detail, control }) {
  return (
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
        <p className="text-sm font-bold">{title}</p>
        {control ?? <p className="text-[11px] text-muted">{detail}</p>}
      </div>
    </div>
  );
}

// Shared purple header for the desktop roles (hospital, BHW). `nav` renders
// under the brand on the left; `right` renders the chip area.
export default function AppBar({ homeHref, nav, right, width = "max-w-[900px]", showBell = true }) {
  return (
    <header className="bg-brand-900 text-white shadow-md">
      <div className={`mx-auto flex ${width} flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3 lg:px-8`}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href={homeHref} className="flex items-center gap-3">
            <Mark />
            <span className="text-[26px] tracking-tight">
              <span className="font-extrabold">Ina</span>
              <span className="font-light">Alaga</span>
            </span>
          </Link>
          {nav}
        </div>
        <div className="flex items-center gap-5">
          {showBell ? <Bell /> : null}
          {right}
        </div>
      </div>
    </header>
  );
}
