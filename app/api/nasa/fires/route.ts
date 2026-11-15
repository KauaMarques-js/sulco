import { AREAS, SOURCES, parseFirms, aggregateDaily } from "../../../../lib/firms";
import { fetchText, SourceError } from "../../../../lib/nasa/fetchText";
export const dynamic = "force-dynamic";
const iso = (t: number) => new Date(t * 864e5).toISOString().slice(0, 10);

export async function GET(req: Request) {
  const key = process.env.FIRMS_MAP_KEY;
  if (!key) return Response.json({ error: "missing_key", message: "FIRMS_MAP_KEY não está definida no servidor." }, { status: 503 });
  const q = new URL(req.url).searchParams;
  const area = q.get("area") ?? "mt", sat = q.get("sat") ?? "both", days = Math.min(30, Math.max(1, Number(q.get("days") ?? 10)));
  const today = Math.floor(Date.now() / 864e5), endStr = q.get("end") ?? iso(today);
  if (!AREAS[area] || !SOURCES[sat] || !/^\d{4}-\d{2}-\d{2}$/.test(endStr) || !Number.isFinite(days)) return Response.json({ error: "invalid_params" }, { status: 400 });
  const end = Math.floor(Date.parse(endStr + "T00:00:00Z") / 864e5);
  if (!Number.isFinite(end) || end > today) return Response.json({ error: "invalid_params", message: "Data final inválida." }, { status: 400 });
  const scrub = (s: string) => s.split(key).join("***");
  try {
    const all = []; let skipped = 0; const versions = new Set<string>();
    for (const src of SOURCES[sat]) for (let off = 0; off < days; off += 5) { // FIRMS: janelas curtas por requisição
      const n = Math.min(5, days - off), start = end - days + 1 + off;
      const { body } = await fetchText(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${src}/${AREAS[area]}/${n}/${iso(start)}`, "text/csv,*/*", 3600);
      const p = parseFirms(body); all.push(...p.rows); skipped += p.skipped; p.versions.forEach((v) => versions.add(v));
    }
    return Response.json({ source: "NASA FIRMS", products: SOURCES[sat], area, bbox: AREAS[area], start: iso(end - days + 1), end: endStr, collectedAt: new Date().toISOString(),
      versions: [...versions], detections: all.length, skipped, unit: "MW (FRP)", days: aggregateDaily(all) });
  } catch (e) {
    const se = e instanceof SourceError ? e : null;
    const dev = process.env.NODE_ENV !== "production";
    return Response.json({ error: "source_unavailable", source: "FIRMS", ...(dev ? { detail: scrub(String((e as Error).message)), info: se ? { status: se.info.status } : undefined } : {}) }, { status: 502 });
  }
}
