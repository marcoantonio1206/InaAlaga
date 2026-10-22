import AppBar, { RoleChip } from "@/components/ui/AppBar";

export default function TopBar() {
  return (
    <AppBar
      homeHref="/hospital/patients"
      right={<RoleChip title="Facility staff" detail="Cagayan Valley Medical Center" />}
    />
  );
}
