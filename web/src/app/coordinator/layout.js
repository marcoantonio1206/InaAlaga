import AppBar, { RoleChip } from "@/components/ui/AppBar";

export const metadata = {
  title: "InaAlaga · Coordinator planning",
  description: "Fictional demonstration only",
};

export default function CoordinatorLayout({ children }) {
  return (
    <div className="min-h-dvh bg-brand-50">
      <AppBar
        homeHref="/coordinator"
        right={<RoleChip title="City coordinator" detail="Planning view · simulation results" />}
      />
      <div className="px-6 py-5 lg:px-8">
        <div className="mx-auto max-w-[900px]">{children}</div>
      </div>
    </div>
  );
}
