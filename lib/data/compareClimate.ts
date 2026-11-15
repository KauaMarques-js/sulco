import type { Row } from "../gistemp.ts";

export type AnnualClimate = { year: number; anomaly: number };
export type ClimatePeriod = { start: number; end: number; years: AnnualClimate[]; mean: number };

/** Derived annual means: exactly one finite published value for each of the 12 months. */
export function completeAnnualMeans(rows: Row[]): AnnualClimate[] {
  const years = new Map<number, { months: Map<number, number>; invalid: boolean }>();
  for (const row of rows) {
    if (!Number.isInteger(row.year)) continue;
    const bucket = years.get(row.year) ?? { months: new Map<number, number>(), invalid: false };
    if (!Number.isInteger(row.month) || row.month < 1 || row.month > 12 || !Number.isFinite(row.anomaly) || bucket.months.has(row.month)) bucket.invalid = true;
    else bucket.months.set(row.month, row.anomaly);
    years.set(row.year, bucket);
  }
  return [...years].filter(([, v]) => !v.invalid && v.months.size === 12)
    .map(([year, v]) => ({ year, anomaly: [...v.months.values()].reduce((sum, value) => sum + value, 0) / 12 }))
    .sort((a, b) => a.year - b.year);
}

export function periodStarts(years: AnnualClimate[], length: number): number[] {
  if (!Number.isInteger(length) || length < 1) return [];
  const available = new Set(years.map((row) => row.year));
  return [...available].sort((a, b) => a - b).filter((start) => {
    for (let offset = 0; offset < length; offset++) if (!available.has(start + offset)) return false;
    return true;
  });
}

export function compareClimate(years: AnnualClimate[], startA: number, startB: number, length: number) {
  const starts = periodStarts(years, length);
  if (!starts.includes(startA) || !starts.includes(startB)) throw new RangeError("Both periods must contain the same number of complete consecutive years.");
  const byYear = new Map(years.map((row) => [row.year, row]));
  const period = (start: number): ClimatePeriod => {
    const selected = Array.from({ length }, (_, k) => byYear.get(start + k)!);
    return { start, end: start + length - 1, years: selected, mean: selected.reduce((sum, row) => sum + row.anomaly, 0) / length };
  };
  const a = period(startA), b = period(startB);
  return { a, b, delta: b.mean - a.mean, overlap: Math.max(a.start, b.start) <= Math.min(a.end, b.end) };
}
