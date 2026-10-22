"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar, { RoleChip } from "@/components/ui/AppBar";
import Icon from "@/components/ui/Icon";
import { WORKERS, useWorker } from "@/lib/bhwWorkers";

const TABS = [
  { href: "/bhw", label: "Cases", icon: "list" },
  { href: "/bhw/schedule", label: "Schedule", icon: "calendar" },
];

function isActive(tab, pathname) {
  return tab.href === "/bhw" ? pathname === "/bhw" : pathname.startsWith(tab.href);
}

export default function BhwShell({ children }) {
  const pathname = usePathname();
  const { worker, select } = useWorker();

  const switcher = (
    <select
      aria-label="Demo worker"
      value={worker.name}
      onChange={(e) => select(e.target.value)}
      className="-ml-1 h-7 rounded-md border border-brand-200 bg-white px-1 text-[12px] font-bold text-brand-900"
    >
      {WORKERS.map((w) => (
        <option key={w.name} value={w.name}>
          {w.name} · {w.short}
        </option>
      ))}
    </select>
  );

  const nav = (
    <nav aria-label="BHW" className="hidden lg:block">
      <ul className="flex gap-1">
        {TABS.map((tab) => {
          const active = isActive(tab, pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
                  active ? "bg-white text-brand-900" : "text-white/85 hover:bg-white/10"
                }`}
              >
                <Icon name={tab.icon} size={16} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-brand-50">
      <AppBar
        homeHref="/bhw"
        nav={nav}
        right={<RoleChip title="Barangay health worker" control={switcher} />}
      />
      <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-5 lg:px-8">{children}</main>
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
