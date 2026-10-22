import { DocumentLang } from "@/lib/i18n";

export default function MobileLayout({ children }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-brand-50 shadow-xl">
      <DocumentLang />
      {children}
    </div>
  );
}
