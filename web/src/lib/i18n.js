"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

import { strings } from "./translations";

const LangContext = createContext(null);

// The chosen language is remembered in localStorage so it survives reloads.
// The server snapshot is always the default, so hydration never mismatches;
// the stored choice applies right after. `memoryLang` keeps the choice for this
// page when storage is unavailable (private windows, blocked site data).
const LANG_KEY = "inaalaga.lang";
const DEFAULT_LANG = "fil";
const langListeners = new Set();
let memoryLang = null;

function readLang() {
  if (memoryLang) return memoryLang;
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && Object.hasOwn(strings, stored)) return stored;
  } catch {}
  return DEFAULT_LANG;
}

function subscribeLang(listener) {
  langListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    langListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function setLang(next) {
  memoryLang = next;
  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {}
  langListeners.forEach((listener) => listener());
}

export function LangProvider({ children }) {
  const lang = useSyncExternalStore(subscribeLang, readLang, () => DEFAULT_LANG);
  const t = (key) => strings[lang][key] ?? strings.en[key] ?? key;
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

// Mother views only: keeps <html lang> in step with the chosen language for
// screen readers. Hospital and BHW views are English, the root layout default.
export function DocumentLang() {
  const { lang } = useLang();
  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = "en";
    };
  }, [lang]);
  return null;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}