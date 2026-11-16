"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getJson, useApp, type Fail } from "./AppProvider";
import { OCEAN_BASINS, OCEAN_DAYS, type BasinDef, type OceanDay } from "../lib/oceans";

export type OceansPayload = {
  source: string;
  dataset: string;
  unit: string;
  basin: BasinDef["id"];
  bbox: string;
  gridStepDeg: number;
  start: string;
  end: string;
  collectedAt: string;
  samples: number;
  skipped: number;
  days: OceanDay[];
};

export function useOceans(enabled = true) {
  const [basin, setBasinState] = useState<BasinDef["id"]>("global");
  const [days, setDaysState] = useState<(typeof OCEAN_DAYS)[number]>(30);
  const [data, setData] = useState<OceansPayload | null>(null);
  const [err, setErr] = useState<(Fail & { timeout?: boolean }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const reqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback((b: BasinDef["id"], w: (typeof OCEAN_DAYS)[number]) => {
    const id = ++reqRef.current;
    abortRef.current?.abort();
    const controller = new AbortController(); abortRef.current = controller;
    const deadline = AbortSignal.timeout(45000);
    const slowTimer = setTimeout(() => { if (reqRef.current === id) setSlow(true); }, 8000);
    setBusy(true);
    setSlow(false);
    setErr(null);
    getJson<OceansPayload>(`/api/nasa/oceans?basin=${encodeURIComponent(b)}&days=${w}`, { signal: AbortSignal.any([controller.signal, deadline]) })
      .then((res) => { if (reqRef.current === id && !controller.signal.aborted) setData(res); })
      .catch((e) => { if (reqRef.current === id && !controller.signal.aborted) { setData(null); setErr(deadline.aborted ? { source: "NOAA CoastWatch", timeout: true } : e); } })
      .finally(() => { clearTimeout(slowTimer); if (reqRef.current === id) { setBusy(false); setSlow(false); } });
  }, []);

  useEffect(() => { if (enabled) load(basin, days); return () => abortRef.current?.abort(); }, [load, enabled, basin, days]);

  const setBasin = (b: BasinDef["id"]) => { setBasinState(b); };
  const setDays = (w: (typeof OCEAN_DAYS)[number]) => { setDaysState(w); };
  const reload = () => load(basin, days);

  return { basin, setBasin, days, setDays, data, err, busy, slow, load: reload };
}

export default function OceansControls({ o }: { o: ReturnType<typeof useOceans> }) {
  const { d } = useApp();
  return (
    <div>
    <div className="row" aria-busy={o.busy} style={{ margin: "1rem 0" }}>
      <label>
        {d.oBasin}
        <select value={o.basin} onChange={(e) => o.setBasin(e.target.value as BasinDef["id"])}>
          {(Object.keys(OCEAN_BASINS) as BasinDef["id"][]).map((k) => (
            <option key={k} value={k}>{d.basins[k] ?? k}</option>
          ))}
        </select>
      </label>

      <div className="seg" role="group" aria-label={d.fDays}>
        {OCEAN_DAYS.map((w) => (
          <button key={w} type="button" aria-pressed={o.days === w} onClick={() => o.setDays(w)}>
            {w}d
          </button>
        ))}
      </div>

      <button type="button" onClick={o.load} disabled={o.busy}>
        {d.oLoad}
      </button>
    </div>
    <p role="status" className="swh" aria-atomic="true">{o.busy ? (o.slow ? d.oLoadingSlow : d.oLoading) : ""}</p>
    </div>
  );
}
