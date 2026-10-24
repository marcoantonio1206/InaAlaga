import Link from "next/link";
import AppBar, { RoleChip } from "@/components/ui/AppBar";

export default function TopBar() {
  return (
    <AppBar
      homeHref="/hospital/patients"
      width="max-w-[1120px]"
      showBell={false}
      right={<div className="flex items-center gap-3">
        <Link href="/demonstration/settings" aria-label="Open demonstration settings" className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Demonstration</Link>
        <div className="hidden sm:block"><RoleChip title="Facility staff" detail="Cagayan Valley Medical Center" /></div>
      </div>}
    />
  );
}
