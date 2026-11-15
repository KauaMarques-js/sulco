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

export function useOceans() {
  const [basin, setBasinState] = useState<BasinDef["id"]>("global");
  const [days, setDaysState] = useState<(typeof OCEAN_DAYS)[number]>(30);
  const [data, setData] = useState<OceansPayload | null>(null);
  const [err, setErr] = useState<Fail | null>(null);
  const [busy, setBusy] = useState(false);
  const reqRef = useRef(0);

  const load = useCallback((b: BasinDef["id"], w: (typeof OCEAN_DAYS)[number]) => {
    const id = ++reqRef.current;
    setBusy(true);
    setErr(null);
    getJson<OceansPayload>(`/api/nasa/oceans?basin=${encodeURIComponent(b)}&days=${w}`)
      .then((res) => { if (reqRef.current === id) setData(res); })
      .catch((e) => { if (reqRef.current === id) { setData(null); setErr(e); } })
      .finally(() => { if (reqRef.current === id) setBusy(false); });
  }, []);

  useEffect(() => { load("global", 30); }, [load]);

  const setBasin = (b: BasinDef["id"]) => { setBasinState(b); load(b, days); };
  const setDays = (w: (typeof OCEAN_DAYS)[number]) => { setDaysState(w); load(basin, w); };
  const reload = () => load(basin, days);

  return { basin, setBasin, days, setDays, data, err, busy, load: reload };
}

export default function OceansControls({ o }: { o: ReturnType<typeof useOceans> }) {
  const { d } = useApp();
  return (
    <div className="row" style={{ margin: "1rem 0" }}>
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
        {o.busy ? d.loading : d.oLoad}
      </button>
    </div>
  );
}
