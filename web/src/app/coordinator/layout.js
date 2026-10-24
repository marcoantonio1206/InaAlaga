import CoordinatorShell from "@/components/coordinator/CoordinatorShell";

export const metadata = {
  title: "InaAlaga · Coordinator",
  description: "Fictional demonstration only",
};

export default function CoordinatorLayout({ children }) {
  return <CoordinatorShell>{children}</CoordinatorShell>;
}
