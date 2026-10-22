"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { WORKERS, useWorker } from "@/lib/bhwWorkers";

const TABS = [
  { href: "/bhw", label: "Cases", icon: "list", exact: false, except: "/bhw/schedule" },
  { href: "/bhw/schedule", label: "Schedule", icon: "calendar", exact: true },
];

function isActive(tab, pathname) {
  if (tab.exact) return pathname === tab.href;
  return pathname.startsWith(tab.href) && !pathname.startsWith(tab.except);
}

export default function BhwShell({ children }) {
  const pathname = usePathname();
  const { worker, select } = useWorker();

  return (
    <div className="flex min-h-dvh flex-col bg-brand-50">
      <header className="border-b border-brand-200 bg-white">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl tracking-tight text-brand-900">
              <span className="font-extrabold">Ina</span>
              <span className="font-light">Alaga</span>
            </div>
            <span className="rounded-full bg-brand-200 px-3 py-1 text-sm font-bold text-brand-900">
              Fictional demo
            </span>
          </div>
          <p className="text-sm text-muted">BHW workspace</p>
          <label className="ml-auto flex items-center gap-2 text-sm font-bold">
            <span className="sr-only lg:not-sr-only">Acting as</span>
            <select
              aria-label="Demo worker"
              value={worker.name}
              onChange={(e) => select(e.target.value)}
              className="h-10 rounded-lg border border-brand-200 bg-white px-2 text-sm font-bold text-brand-900"
            >
              {WORKERS.map((w) => (
                <option key={w.name} value={w.name}>
                  {w.name} · {w.short}
                </option>
              ))}
            </select>
          </label>
          <nav aria-label="BHW" className="hidden w-full lg:block">
            <ul className="flex gap-1">
              {TABS.map((tab) => {
                const active = isActive(tab, pathname);
                return (
                  <li key={tab.href}>
                    <Link
                      href={tab.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold ${
                        active ? "bg-brand-900 text-white" : "text-muted"
                      }`}
                    >
                      <Icon name={tab.icon} size={18} />
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[960px] flex-1 p-4 lg:px-6 lg:py-6">{children}</main>

      <nav aria-label="BHW" className="sticky bottom-0 border-t border-brand-200 bg-white px-2 py-2 lg:hidden">
        <ul className="grid grid-cols-2 gap-1">
          {TABS.map((tab) => {
            const active = isActive(tab, pathname);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-bold ${
                    active ? "bg-brand-200 text-brand-900" : "text-muted"
                  }`}
                >
                  <Icon name={tab.icon} size={22} />
                  <span>{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
