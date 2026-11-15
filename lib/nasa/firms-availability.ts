export type Availability = { id: string; first: string; last: string };
const supported = new Set(["VIIRS_SNPP_NRT", "VIIRS_NOAA21_NRT"]);
export function parseAvailability(text: string): Availability[] {
  const lines = text.trim().split(/\r?\n/).map((l) => l.split(",").map((v) => v.trim()));
  const header = lines.shift() ?? [];
  const id = header.indexOf("data_id"), first = header.indexOf("min_date"), last = header.indexOf("max_date");
  if ([id, first, last].some((i) => i < 0)) throw new Error("Invalid FIRMS availability response");
  const date = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? "") && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
  return lines.filter((r) => supported.has(r[id]) && date(r[first]) && date(r[last]) && r[first] <= r[last]).map((r) => ({ id: r[id], first: r[first], last: r[last] }));
}
