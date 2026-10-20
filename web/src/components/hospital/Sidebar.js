"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";

const ITEMS = [
  { href: "/hospital/discharge", label: "Record discharge", icon: "plus" },
  { href: "/hospital/patients", label: "Patient list", icon: "list" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-brand-200 bg-white/60 p-4">
      <div>
        <div className="text-2xl tracking-tight text-brand-900">
          <span className="font-extrabold">Ina</span>
          <span className="font-light">Alaga</span>
        </div>
        <p className="mb-6 text-sm text-muted">Hospital facilitator</p>
        <nav aria-label="Hospital">
          <ul className="flex flex-col gap-1">
            {ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 font-bold ${
                      active ? "bg-brand-900 text-white" : "text-muted"
                    }`}
                  >
                    <Icon name={item.icon} size={20} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <div className="rounded-xl bg-brand-200 p-3 text-sm text-brand-900">
        <p className="font-bold">Facility staff</p>
        <p>Cagayan Valley Medical Center</p>
      </div>
    </aside>
  );
}