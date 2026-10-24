"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./ui/Icon";
import { useLang } from "@/lib/i18n";

const TABS = [
  { key: "navHome", icon: "home", path: "" },
  { key: "navVisits", icon: "calendar", path: "/visits" },
  { key: "navStation", icon: "pin", path: "/station" },
];

export default function BottomNav({ token }) {
  const { t } = useLang();
  const pathname = usePathname();
  const base = `/m/${token}`;
  return (
    <nav aria-label={t("mainNavigation")} className="sticky bottom-0 border-t border-brand-200 bg-white px-2 py-2">
      <ul className="grid grid-cols-3 gap-1">
        {TABS.map((tab) => {
          const href = base + tab.path;
          const active = pathname === href;
          return (
            <li key={tab.key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-bold ${
                  active ? "bg-brand-200 text-brand-900" : "text-muted"
                }`}
              >
                <Icon name={tab.icon} size={22} />
                <span>{t(tab.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}