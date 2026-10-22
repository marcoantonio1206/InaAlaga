import TopBar from "@/components/hospital/TopBar";

export default function HospitalLayout({ children }) {
  return (
    <div className="min-h-dvh bg-brand-50">
      <TopBar />
      <div className="px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </div>
    </div>
  );
}
