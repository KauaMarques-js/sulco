/** Only published NASA observations are returned; malformed observations are skipped. */
export type EarthEvent = { id: string; title: string; categories: { id: string; title: string }[]; date: string; lat: number; lon: number; url: string };
export type EarthImage = { url: string; date: string; caption: string };
export type Discovery = { events: EarthEvent[]; image: EarthImage | null; fetchedAt: string; eventsAvailable: boolean; imageAvailable: boolean; skipped: number };
const record = (v: unknown): Record<string, unknown> => v !== null && typeof v === "object" ? v as Record<string, unknown> : {};
export function parseEvents(input: unknown): { events: EarthEvent[]; skipped: number } {
  const raw = record(input).events;
  if (!Array.isArray(raw)) throw new Error("Invalid EONET response");
  const events: EarthEvent[] = []; let skipped = 0;
  for (const value of raw) {
    const e = record(value);
    const categories = (Array.isArray(e.categories) ? e.categories : []).map(record).filter((c) => typeof c.id === "string" && typeof c.title === "string").map((c) => ({ id: c.id as string, title: c.title as string }));
    const geometry = (Array.isArray(e.geometry) ? e.geometry : []).map(record).filter((g) => {
      const c = g.coordinates;
      return g.type === "Point" && typeof g.date === "string" && Number.isFinite(Date.parse(g.date)) && Array.isArray(c) && c.length === 2 && typeof c[0] === "number" && typeof c[1] === "number" && Number.isFinite(c[0]) && Number.isFinite(c[1]) && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90;
    }).sort((a, b) => Date.parse(b.date as string) - Date.parse(a.date as string));
    const g = geometry[0];
    if (typeof e.id !== "string" || typeof e.title !== "string" || !categories.length || !g) { skipped++; continue; }
    const [lon, lat] = g.coordinates as number[];
    events.push({ id: e.id, title: e.title, categories, date: g.date as string, lat, lon, url: `https://eonet.gsfc.nasa.gov/api/v3/events/${encodeURIComponent(e.id)}` });
  }
  return { events: events.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)), skipped };
}
export function parseEarthImage(input: unknown): EarthImage | null {
  if (!Array.isArray(input)) throw new Error("Invalid EPIC response");
  const images = input.map(record).filter((v) => typeof v.image === "string" && /^epic_[a-zA-Z0-9_]+$/.test(v.image) && typeof v.date === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v.date) && Number.isFinite(Date.parse(v.date.replace(" ", "T") + "Z"))).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const v = images[0]; if (!v) return null;
  const day = (v.date as string).slice(0, 10).replaceAll("-", "/");
  return { url: `https://epic.gsfc.nasa.gov/archive/natural/${day}/jpg/${v.image}.jpg`, date: (v.date as string).replace(" ", "T") + "Z", caption: typeof v.caption === "string" ? v.caption : "NASA EPIC / DSCOVR" };
}
