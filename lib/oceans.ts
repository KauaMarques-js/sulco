export type OceanSample = { date: string; lat: number; lon: number; sst: number };
export type OceanDay = { date: string; sstMean: number; sstMin: number; sstMax: number; samples: number };

export type BasinDef = {
  id: "global" | "br" | "nino34" | "natlan" | "indian";
  erddapBox: string;
  bbox: string;
  gridStepDeg: number;
};

/**
 * Coarse spatial strides over NOAA NESDIS CoastWatch GHRSST Blended Daily 5 km
 * (0.05 deg native resolution) so 30-day queries complete reliably without timeouts.
 */
export const OCEAN_BASINS: Record<BasinDef["id"], BasinDef> = {
  global: { id: "global", erddapBox: "[(-60):600:(60)][(-180):600:(180)]", bbox: "-60,-180,60,180", gridStepDeg: 30 },
  br: { id: "br", erddapBox: "[(-35):60:(5)][(-55):60:(-25)]", bbox: "-35,-55,5,-25", gridStepDeg: 3 },
  nino34: { id: "nino34", erddapBox: "[(-5):40:(5)][(-170):40:(-120)]", bbox: "-5,-170,5,-120", gridStepDeg: 2 },
  natlan: { id: "natlan", erddapBox: "[(0):80:(60)][(-80):80:(0)]", bbox: "0,-80,60,0", gridStepDeg: 4 },
  indian: { id: "indian", erddapBox: "[(-30):100:(20)][(45):100:(105)]", bbox: "-30,45,20,105", gridStepDeg: 5 },
};

export const OCEAN_DAYS = [7, 15, 30] as const;

export function parseErddapSstCsv(text: string): { rows: OceanSample[]; skipped: number } {
  const lines = text.trim().split(/\r?\n/);
  const hdr = (lines[0] ?? "").split(",").map((s) => s.trim().toLowerCase());
  const idx = {
    t: hdr.indexOf("time"),
    la: hdr.indexOf("latitude"),
    lo: hdr.indexOf("longitude"),
    s: hdr.indexOf("analysed_sst"),
  };
  if ([idx.t, idx.la, idx.lo, idx.s].some((v) => v < 0)) {
    throw new Error("Resposta do CoastWatch ERDDAP não é o CSV esperado.");
  }

  const rows: OceanSample[] = [];
  let skipped = 0;
  for (let k = 1; k < lines.length; k++) {
    const c = lines[k].split(",");
    const rawTime = (c[idx.t] ?? "").trim();
    if (k === 1 && rawTime.toUpperCase() === "UTC") continue; // skip ERDDAP units metadata row

    const date = rawTime.slice(0, 10);
    const lat = Number(c[idx.la]);
    const lon = Number(c[idx.lo]);
    const sst = Number(c[idx.s]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(sst) || sst < -2.5 || sst > 40) {
      skipped++;
      continue;
    }
    rows.push({ date, lat, lon, sst });
  }
  return { rows, skipped };
}

export function aggregateDailySst(rows: OceanSample[]): OceanDay[] {
  const byDate = new Map<string, { sum: number; n: number; min: number; max: number }>();
  for (const r of rows) {
    const cur = byDate.get(r.date);
    if (!cur) {
      byDate.set(r.date, { sum: r.sst, n: 1, min: r.sst, max: r.sst });
    } else {
      cur.sum += r.sst;
      cur.n++;
      if (r.sst < cur.min) cur.min = r.sst;
      if (r.sst > cur.max) cur.max = r.sst;
    }
  }
  return [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, o]) => ({
      date,
      sstMean: o.sum / o.n,
      sstMin: o.min,
      sstMax: o.max,
      samples: o.n,
    }));
}

/**
 * Maps daily mean SST (°C) to an audible frequency between 220 Hz and 880 Hz (2 octaves)
 * relative to the observed [lo, hi] range of the active series.
 * Artistic sonification choice (not a physical constant).
 */
export function oceanFreq(sstC: number, lo: number, hi: number): number | null {
  if (!Number.isFinite(sstC)) return null;
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi - lo < 1e-6) return 440;
  const t = Math.max(0, Math.min(1, (sstC - lo) / (hi - lo)));
  return 220 * Math.pow(2, t * 2);
}
