"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import LangToggle from "@/components/LangToggle";
import { useLang } from "@/lib/i18n";

const DEMO_TOKEN = "ia-0042";

export default function ConsentPage() {
  const { t } = useLang();
  const router = useRouter();

  return (
    <main className="flex min-h-dvh flex-col bg-brand-950">
      <div className="flex justify-end px-5 pt-5">
        <LangToggle />
      </div>
      <div className="flex flex-1 items-center justify-center text-4xl text-white/50">
        <span className="font-extrabold">Ina</span>
        <span className="font-light">Alaga</span>
      </div>
      <section className="flex flex-col gap-3 rounded-t-[1.75rem] bg-white px-6 pb-7 pt-6 text-ink">
        <h1 className="text-center text-xl font-extrabold">{t("consentTitle")}</h1>
        <p>
          <strong className="font-bold">{t("keepLabel")}</strong> {t("keepText")}
        </p>
        <p>
          <strong className="font-bold">{t("seeLabel")}</strong> {t("seeText")}
        </p>
        <p>
          <strong className="font-bold">{t("choiceLabel")}</strong> {t("choiceText")}
        </p>
        <button
          type="button"
          onClick={() => router.push(`/m/${DEMO_TOKEN}`)}
          className="h-[52px] rounded-xl bg-brand-900 text-base font-bold text-white"
        >
          {t("agree")}
        </button>
        <Link
          href="/"
          className="flex h-[52px] items-center justify-center rounded-xl border-2 border-brand-900 text-base font-bold text-brand-900"
        >
          {t("disagree")}
        </Link>
      </section>
    </main>
  );
}