import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { parseGistemp } from "../../../../lib/gistemp.ts";
import { fetchText, errorBody, SourceError } from "../../../../lib/nasa/fetchText.ts";
export const dynamic = "force-dynamic";
const URL_CSV = "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv";
const LOCAL = path.join(process.cwd(), "public", "data", "climate");

function payload(text: string, origin: "local" | "remote", fetchedAt: string, fallback: boolean) {
  const { rows, skipped, missing } = parseGistemp(text);
  return { source: URL_CSV, origin, fallback, dataset: "GISTEMP v4, Global-mean monthly Land-Ocean Temperature Index", units: "°C", baseline: "1951–1980",
    fetchedAt, sha256: createHash("sha256").update(text).digest("hex"), skippedMissing: skipped, missing: missing.slice(0, 200), firstYear: rows[0].year, lastYear: rows[rows.length - 1].year, rows };
}
async function local(fallback: boolean) {
  const text = await readFile(path.join(LOCAL, "gistemp_monthly.csv"), "utf8");
  const meta = JSON.parse(await readFile(path.join(LOCAL, "metadata.json"), "utf8").catch(() => "{}"));
  return payload(text, "local", meta.retrievedAt ?? "unknown", fallback);
}
export async function GET(req: Request) {
  const source = new URL(req.url).searchParams.get("source") ?? "auto";
  if (!["auto", "local", "remote"].includes(source)) return Response.json({ error: "invalid_source" }, { status: 400 });
  try {
    if (source === "local") return Response.json(await local(false));
    try {
      const r = await fetchText(URL_CSV, "text/csv,text/plain,*/*", source === "remote" ? 0 : 3600);
      if (r.body.trimStart().startsWith("<")) throw new SourceError("Resposta HTML em vez de CSV");
      return Response.json(payload(r.body, "remote", new Date().toISOString(), false));
    } catch (e) {
      if (source === "remote") throw e;
      return Response.json(await local(true));
    }
  } catch (e) { return Response.json(errorBody("GISTEMP", e), { status: 502 }); }
}
