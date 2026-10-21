import Sidebar from "@/components/hospital/Sidebar";

export default function HospitalLayout({ children }) {
  return (
    <div className="flex min-h-dvh bg-brand-50">
      <Sidebar />
      <div className="flex-1 px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-[1100px]">{children}</div>
      </div>
    </div>
  );
}