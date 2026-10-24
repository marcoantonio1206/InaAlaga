"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar, { RoleChip } from "@/components/ui/AppBar";
import Icon from "@/components/ui/Icon";

const TABS = [
  { href: "/coordinator", label: "Planning", icon: "list" },
  { href: "/coordinator/overview", label: "Overview", icon: "calendar" },
];

export default function CoordinatorShell({ children }) {
  const pathname = usePathname();

  const nav = (
    <nav aria-label="Coordinator">
      <ul className="flex gap-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold sm:px-4 ${
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
    <div className="min-h-dvh bg-brand-50">
      <AppBar
        homeHref="/coordinator"
        showBell={false}
        width="max-w-[1120px]"
        nav={nav}
        right={<div className="flex flex-wrap items-center justify-end gap-2">
          <Link href="/demonstration/settings" aria-label="Open demonstration settings" className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Demonstration</Link>
          <div className="hidden md:block"><RoleChip title="City coordinator" detail="Tuguegarao pilot" /></div>
        </div>}
      />
      <main className="px-4 py-5 lg:px-8">
        <div className="mx-auto max-w-[1120px]">{children}</div>
      </main>
    </div>
  );
}
