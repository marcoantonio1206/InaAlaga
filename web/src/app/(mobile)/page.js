"use client";

import Link from "next/link";
import LangToggle from "@/components/LangToggle";
import { useLang } from "@/lib/i18n";

export default function EntryPage() {
  const { t } = useLang();
  return (
    <main className="flex min-h-dvh flex-col">
      <section className="flex flex-1 flex-col rounded-b-[2rem] bg-gradient-to-b from-brand-900 to-brand-600 px-5 pb-6 pt-5 text-white">
        <div className="flex justify-end">
          <LangToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <h1 className="text-4xl tracking-tight">
            <span className="font-extrabold">Ina</span>
            <span className="font-light">Alaga</span>
          </h1>
        </div>
        <Link
          href="/consent"
          className="block rounded-xl bg-brand-900 px-4 py-4 text-center text-base font-semibold ring-1 ring-white/30"
        >
          {t("imMother")}
        </Link>
      </section>
      <p className="px-5 py-4 text-center text-sm">{t("demoNote")}</p>
    </main>
  );
}