"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import SignLanguages from "./SignLanguages";
import { dict, type Dict, type Lang } from "../lib/i18n";
import { DEF, type Prefs } from "../lib/prefs";
import type { Row } from "../lib/gistemp";

export type Data = { origin?: "local" | "remote"; sha256?: string | null; rows: Row[]; source: string; dataset: string; units: string; baseline: string; fetchedAt: string; skippedMissing: number; missing?: { year: number; month: number }[]; firstYear: number; lastYear: number };
export type Fail = { source: string; detail?: string };
type Ctx = { lang: Lang; setLang: (l: Lang) => void; d: Dict; prefs: Prefs; setPrefs: (p: Prefs) => void; a11yOpen: boolean; setA11yOpen: (o: boolean) => void; data: Data | null; dataErr: Fail | null; loadData: (remote?: boolean) => void };
const C = createContext<Ctx | null>(null);
export const useApp = () => { const c = useContext(C) as Ctx | null; if (!c) throw new Error("AppProvider ausente"); return c; };

export async function getJson<T>(url: string, options?: RequestInit): Promise<T> {
  const r = await fetch(url, options); const j = await r.json().catch(() => ({}));
  if (!r.ok) throw { source: j.source ?? url, detail: j.detail ? `${j.detail} ${JSON.stringify(j.info ?? {})}` : undefined } as Fail;
  return j as T;
}

export default function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en"), [prefs, setPrefs] = useState<Prefs>(DEF), [a11yOpen, setA11yOpen] = useState(false);
  const [data, setData] = useState<Data | null>(null), [dataErr, setDataErr] = useState<Fail | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sulco.prefs") ?? localStorage.getItem("earthsonic.prefs");
      const s = raw ? JSON.parse(raw) : null;
      if (s?.lang === "en" || s?.lang === "pt-BR") setLang(s.lang);
      else if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("pt")) setLang("pt-BR");
      if (s?.prefs) setPrefs({ ...DEF, ...s.prefs });
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    const h = document.documentElement; h.lang = lang;
    h.classList.toggle("hc", prefs.hc); h.classList.toggle("rm", prefs.rm); h.classList.toggle("tg", prefs.targets); h.classList.toggle("fx", prefs.focus); h.classList.toggle("vis", prefs.visual); h.classList.remove("ts1", "ts2"); if (prefs.size) h.classList.add(`ts${prefs.size}`);
    if (hydrated) { try { localStorage.setItem("sulco.prefs", JSON.stringify({ lang, prefs })); } catch {} }
  }, [lang, prefs, hydrated]);
  const loadData = useCallback((remote?: boolean) => {
    setDataErr(null); setData(null);
    getJson<Data>(remote === true ? "/api/nasa/gistemp?source=remote" : "/api/nasa/gistemp").then(setData).catch((e) => setDataErr(e));
  }, []);
  useEffect(() => { loadData(); }, [loadData]);
  return (
    <C.Provider value={{ lang, setLang, d: dict[lang], prefs, setPrefs, a11yOpen, setA11yOpen, data, dataErr, loadData }}>
      {children}
      <SignLanguages />
    </C.Provider>
  );
}
