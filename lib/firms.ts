export type Detection = { date: string; frp: number; lat: number; lon: number };
export type Day = { date: string; count: number; frpMean: number; frpSum: number; lon: number };
// Retângulos aproximados (não são divisas de estados).
export const AREAS: Record<string, string> = { mt: "-61.6,-18.0,-50.2,-7.3", br: "-74,-34,-34,5.5", world: "world" };
export const SOURCES: Record<string, string[]> = { snpp: ["VIIRS_SNPP_NRT"], noaa21: ["VIIRS_NOAA21_NRT"], both: ["VIIRS_SNPP_NRT", "VIIRS_NOAA21_NRT"] };

export function parseFirms(text: string): { rows: Detection[]; skipped: number; versions: string[] } {
  const L = text.trim().split(/\r?\n/); const h = (L[0] ?? "").split(",").map((s) => s.trim().toLowerCase());
  const i = { d: h.indexOf("acq_date"), f: h.indexOf("frp"), la: h.indexOf("latitude"), lo: h.indexOf("longitude"), v: h.indexOf("version") };
  if ([i.d, i.f, i.la, i.lo].some((v) => v < 0)) throw new Error("Resposta do FIRMS não é o CSV esperado.");
  const rows: Detection[] = []; let skipped = 0; const versions = new Set<string>();
  for (const l of L.slice(1)) {
    const c = l.split(","); const frp = Number(c[i.f]), lat = Number(c[i.la]), lon = Number(c[i.lo]);
    if ([i.f, i.la, i.lo].some((n) => !(c[n] ?? "").trim()) || !/^\d{4}-\d{2}-\d{2}$/.test(c[i.d] ?? "") || !Number.isFinite(frp) || frp < 0 || !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 180) { skipped++; continue; }
    rows.push({ date: c[i.d], frp, lat, lon }); if (i.v >= 0 && c[i.v]) versions.add(c[i.v].trim());
  }
  return { rows, skipped, versions: [...versions] };
}
export function aggregateDaily(rows: Detection[]): Day[] {
  const m = new Map<string, { n: number; f: number; lo: number }>();
  for (const r of rows) { const o = m.get(r.date) ?? { n: 0, f: 0, lo: 0 }; o.n++; o.f += r.frp; o.lo += r.lon; m.set(r.date, o); }
  return [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([date, o]) => ({ date, count: o.n, frpSum: o.f, frpMean: o.f / o.n, lon: o.lo / o.n }));
}
const dayNum = (d: string) => Math.floor(Date.parse(d + "T00:00:00Z") / 864e5);
/** Janela móvel de w dias corridos (inclui o próprio dia); só usa dias presentes nos dados. */
export function rolling(days: Day[], w: number): Day[] {
  return days.map((d) => {
    const inW = days.filter((x) => dayNum(x.date) <= dayNum(d.date) && dayNum(x.date) > dayNum(d.date) - w);
    const count = inW.reduce((s, x) => s + x.count, 0), frpSum = inW.reduce((s, x) => s + x.frpSum, 0);
    return { date: d.date, count, frpSum, frpMean: frpSum / count, lon: inW.reduce((s, x) => s + x.lon * x.count, 0) / count };
  });
}

/** Map-only sample, spread across every observed day; daily totals always use all rows. */
export function sampleDetections(rows: Detection[], limit = 2000): Detection[] {
  if (limit <= 0 || !Number.isInteger(limit)) return [];
  if (rows.length <= limit) return rows;
  const groups = new Map<string, Detection[]>();
  for (const r of rows) { const group = groups.get(r.date) ?? []; group.push(r); groups.set(r.date, group); }
  const days = [...groups.values()];
  const quota = Math.floor(limit / days.length);
  return days.flatMap((day, d) => {
    const n = Math.min(day.length, quota + (d < limit % days.length ? 1 : 0));
    return Array.from({ length: n }, (_, i) => day[Math.floor(i * day.length / n)]);
  });
}
