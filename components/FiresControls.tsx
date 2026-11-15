"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { SOURCES, type Detection, type Day } from "../lib/firms";

export type FireParams = { area: string; sat: string; days: number; end: string };
export type FireResp = { points?: Detection[]; source: string; products: string[]; area: string; start: string; end: string; collectedAt: string; versions: string[]; detections: number; skipped: number; days: Day[] };
export type FireErr = { missingKey?: boolean; detail?: string };
export function useFires(autoLoad = false) {
  const [availability, setAvailability] = useState<{ id: string; first: string; last: string }[]>([]);
  const initialLoad = useRef(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const [availabilityUnavailable, setAvailabilityUnavailable] = useState(false);
  const [params, setParams] = useState<FireParams>({ area: "mt", sat: "both", days: 10, end: "" });
  const [data, setData] = useState<FireResp | null>(null), [err, setErr] = useState<FireErr | null>(null), [loading, setLoading] = useState(false);
  const latestDates = (SOURCES[params.sat] ?? []).map((id) => availability.find((a) => a.id === id)?.last);
  const latest = latestDates.length && latestDates.every(Boolean) ? (latestDates as string[]).sort()[0] : "";
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/nasa/fires/availability", { signal: controller.signal }).then(async (r) => {
      const j = await r.json(); if (controller.signal.aborted) return;
      if (r.ok) setAvailability(j.products); else if (j.error === "missing_key") setErr({ missingKey: true }); else setAvailabilityUnavailable(true);
    }).catch(() => { if (!controller.signal.aborted) setAvailabilityUnavailable(true); });
    return () => controller.abort();
  }, []);
  const load = useCallback(async () => {
    initialLoad.current = true; request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setErr(null); setData(null);
    try {
      const q = new URLSearchParams({ area: params.area, sat: params.sat, days: String(params.days) }); if (params.end || latest) q.set("end", params.end || latest);
      const r = await fetch(`/api/nasa/fires?${q}`, { signal: controller.signal }); const j = await r.json().catch(() => ({}));
      if (controller.signal.aborted) return;
      if (r.status === 503 && j.error === "missing_key") setErr({ missingKey: true }); else if (!r.ok) setErr({ detail: j.detail }); else setData(j as FireResp);
    } catch (e) { if (!controller.signal.aborted) setErr({ detail: String(e) }); }
    if (!controller.signal.aborted) setLoading(false);
  }, [params, latest]);
  useEffect(() => { if (autoLoad && latest && !initialLoad.current) { initialLoad.current = true; void load(); } }, [autoLoad, latest, load]);
  return { params, setParams, data, err, loading, load, latest, availabilityUnavailable };
}
export function FiresControls({ f }: { f: ReturnType<typeof useFires> }) {
  const { d, lang } = useApp(); const { params: p, setParams } = f;
  return (
    <div className="fire-query"><fieldset className="row" disabled={f.loading}>
      <legend className="sr">{d.s2}</legend>
      <label>{d.fArea}<select value={p.area} onChange={(e) => setParams({ ...p, area: e.target.value })}><option value="mt">{d.areaMT}</option><option value="br">{d.areaBR}</option><option value="world">{d.areaWorld}</option></select></label>
      <label>{d.fSat}<select value={p.sat} onChange={(e) => setParams({ ...p, sat: e.target.value })}><option value="both">{d.satBoth}</option><option value="snpp">{d.satSnpp}</option><option value="noaa21">{d.satNoaa}</option></select></label>
      <label>{d.fDays}<select value={p.days} onChange={(e) => setParams({ ...p, days: +e.target.value })}>{[5, 10, 15, 30].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
      <label>{d.fEnd}<input type="date" value={p.end || f.latest} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setParams({ ...p, end: e.target.value })} /></label>
      <button className="pri" disabled={f.loading} onClick={() => f.load()}>{f.loading ? d.loading : d.fLoad}</button>
    </fieldset>{f.latest && <p className="query-source">{lang === "pt-BR" ? "Última data disponível nos satélites selecionados" : "Latest date available for the selected satellites"}: {f.latest} · NASA FIRMS</p>}
    {f.availabilityUnavailable && <p role="status" className="query-source">{lang === "pt-BR" ? "Não foi possível consultar a última data disponível. Selecione uma data para consultar manualmente." : "Could not check the latest available date. Select a date to query manually."}</p>}
    </div>
  );
}
