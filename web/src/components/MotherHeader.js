"use client";

import LangToggle from "./LangToggle";
import { useLang } from "@/lib/i18n";

export default function MotherHeader({ alias }) {
  const { t } = useLang();
  return (
    <header className="rounded-b-[2rem] bg-gradient-to-b from-brand-900 to-brand-600 px-5 pb-6 pt-5 text-white">
      <div className="flex items-center justify-between">
        <span className="text-2xl tracking-tight">
          <span className="font-extrabold">Ina</span>
          <span className="font-light">Alaga</span>
        </span>
        <LangToggle />
      </div>
      <h1 className="mt-4 text-2xl font-extrabold">
        {t("hello")}, {alias}
      </h1>
      <p className="mt-2 w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{t("demonstration")}</p>
    </header>
  );
}