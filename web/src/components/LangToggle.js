"use client";

import { useLang } from "@/lib/i18n";

// `tone="light"` is for lilac page backgrounds (access screens); the default
// sits on the purple header gradient.
const tones = {
  dark: { group: "bg-white/25", active: "bg-white text-brand-900", idle: "text-white" },
  light: { group: "bg-brand-200", active: "bg-brand-900 text-white", idle: "text-brand-900" },
};

export default function LangToggle({ tone = "dark" }) {
  const { lang, setLang } = useLang();
  const s = tones[tone];
  return (
    <div role="group" aria-label="Language" className={`inline-flex rounded-full p-1 ${s.group}`}>
      {["fil", "en"].map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            lang === code ? s.active : s.idle
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
