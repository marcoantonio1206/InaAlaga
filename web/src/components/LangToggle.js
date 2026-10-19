"use client";

import { useLang } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div role="group" aria-label="Language" className="inline-flex rounded-full bg-white/25 p-1">
      {["fil", "en"].map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            lang === code ? "bg-white text-brand-900" : "text-white"
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}