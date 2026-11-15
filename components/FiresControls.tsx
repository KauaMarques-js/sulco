"use client";
import { useCallback, useState } from "react";
import { useApp } from "./AppProvider";
import type { Day } from "../lib/firms";

export type FireParams = { area: string; sat: string; days: number; end: string };
export type FireResp = { source: string; products: string[]; area: string; start: string; end: string; collectedAt: string; versions: string[]; detections: number; skipped: number; days: Day[] };
export type FireErr = { missingKey?: boolean; detail?: string };
export function useFires() {
  const [params, setParams] = useState<FireParams>({ area: "mt", sat: "both", days: 10, end: "" });
  const [data, setData] = useState<FireResp | null>(null), [err, setErr] = useState<FireErr | null>(null), [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setErr(null); setData(null);
    try {
      const q = new URLSearchParams({ area: params.area, sat: params.sat, days: String(params.days) }); if (params.end) q.set("end", params.end);
      const r = await fetch(`/api/nasa/fires?${q}`); const j = await r.json().catch(() => ({}));
      if (r.status === 503 && j.error === "missing_key") setErr({ missingKey: true }); else if (!r.ok) setErr({ detail: j.detail }); else setData(j as FireResp);
    } catch (e) { setErr({ detail: String(e) }); }
    setLoading(false);
  }, [params]);
  return { params, setParams, data, err, loading, load };
}
export function FiresControls({ f }: { f: ReturnType<typeof useFires> }) {
  const { d } = useApp(); const { params: p, setParams } = f;
  return (
    <div className="row">
      <label>{d.fArea}<select value={p.area} onChange={(e) => setParams({ ...p, area: e.target.value })}><option value="mt">{d.areaMT}</option><option value="br">{d.areaBR}</option><option value="world">{d.areaWorld}</option></select></label>
      <label>{d.fSat}<select value={p.sat} onChange={(e) => setParams({ ...p, sat: e.target.value })}><option value="both">{d.satBoth}</option><option value="snpp">{d.satSnpp}</option><option value="noaa21">{d.satNoaa}</option></select></label>
      <label>{d.fDays}<select value={p.days} onChange={(e) => setParams({ ...p, days: +e.target.value })}>{[5, 10, 15, 30].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
      <label>{d.fEnd}<input type="date" value={p.end} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setParams({ ...p, end: e.target.value })} /></label>
      <button className="pri" disabled={f.loading} onClick={() => f.load()}>{f.loading ? d.loading : d.fLoad}</button>
    </div>
  );
}
