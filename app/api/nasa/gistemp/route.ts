import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseGistemp } from "../../../../lib/gistemp";
import { fetchText, errorBody, SourceError } from "../../../../lib/nasa/fetchText";
export const dynamic = "force-dynamic";
const URL_CSV = "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv";
const LOCAL = path.join(process.cwd(), "public", "data", "climate");

async function local() {
  try {
    const text = await readFile(path.join(LOCAL, "gistemp_monthly.csv"), "utf8");
    const meta = JSON.parse(await readFile(path.join(LOCAL, "metadata.json"), "utf8").catch(() => "{}"));
    return { text, meta };
  } catch { return null; }
}

export async function GET(req: Request) {
  const wantRemote = new URL(req.url).searchParams.get("source") === "remote";
  try {
    let text: string, origin: "local" | "remote", retrievedAt: string, sha256: string | null = null;
    const l = wantRemote ? null : await local();
    if (l) { text = l.text; origin = "local"; retrievedAt = l.meta.retrievedAt ?? "unknown"; sha256 = l.meta.sha256 ?? null; }
    else {
      const r = await fetchText(URL_CSV, "text/csv,text/plain,*/*", 3600);
      text = r.body; origin = "remote"; retrievedAt = new Date().toISOString();
      if (text.trimStart().startsWith("<")) throw new SourceError("Resposta HTML em vez de CSV (possível bloqueio)", { contentType: r.contentType, snippet: text.slice(0, 120) });
    }
    const { rows, skipped, missing } = parseGistemp(text);
    return Response.json({ source: URL_CSV, origin, dataset: "GISTEMP v4, Global-mean monthly Land-Ocean Temperature Index", units: "°C", baseline: "1951–1980",
      fetchedAt: retrievedAt, sha256, skippedMissing: skipped, missing: missing.slice(0, 200), firstYear: rows[0].year, lastYear: rows[rows.length - 1].year, rows });
  } catch (e) { return Response.json(errorBody("GISTEMP", e), { status: 502 }); }
}
