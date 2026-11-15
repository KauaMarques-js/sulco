import { fetchText, errorBody, SourceError } from "../../../../lib/nasa/fetchText";
import { OCEAN_BASINS, OCEAN_DAYS, parseErddapSstCsv, aggregateDailySst, type BasinDef } from "../../../../lib/oceans";
export const revalidate = 3600;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const basinParam = (sp.get("basin") ?? "global") as BasinDef["id"];
  const daysParam = Number(sp.get("days") ?? 30);

  const basin = OCEAN_BASINS[basinParam];
  if (!basin) return Response.json({ error: "invalid_basin" }, { status: 400 });
  if (!OCEAN_DAYS.includes(daysParam as (typeof OCEAN_DAYS)[number])) {
    return Response.json({ error: "invalid_days" }, { status: 400 });
  }

  try {
    const infoUrl = "https://coastwatch.noaa.gov/erddap/info/noaacwBLENDEDCsstDaily/index.json";
    const { body: infoBody } = await fetchText(infoUrl, "application/json", 3600);
    let infoJson: { table?: { rows?: unknown[][] } };
    try { infoJson = JSON.parse(infoBody); } catch {
      throw new SourceError("CoastWatch metadata JSON inválido", { snippet: infoBody.slice(0, 120) });
    }
    const endRow = infoJson.table?.rows?.find(
      (r) => r[0] === "attribute" && r[1] === "NC_GLOBAL" && r[2] === "time_coverage_end",
    );
    const endIso = String(endRow?.[4] ?? "");
    const endMs = Date.parse(endIso);
    if (!Number.isFinite(endMs)) {
      throw new SourceError("Cobertura temporal ausente no CoastWatch", { snippet: infoBody.slice(0, 120) });
    }

    const startMs = endMs - (daysParam - 1) * 864e5;
    const startIso = `${new Date(startMs).toISOString().slice(0, 10)}T12:00:00Z`;
    const csvUrl = `https://coastwatch.noaa.gov/erddap/griddap/noaacwBLENDEDCsstDaily.csv?analysed_sst[(${startIso}):1:(${endIso})]${basin.erddapBox}`;

    const { body: csvBody } = await fetchText(csvUrl, "text/csv", 3600);
    const { rows, skipped } = parseErddapSstCsv(csvBody);
    const days = aggregateDailySst(rows);
    if (!days.length) {
      throw new SourceError("Sem medições válidas de SST no recorte selecionado", { snippet: csvBody.slice(0, 120) });
    }

    return Response.json({
      source: "NOAA NESDIS CoastWatch ERDDAP (noaacwBLENDEDCsstDaily)",
      dataset: "Geo-Polar Blended Sea Surface Temperature 5km NRT",
      unit: "°C",
      basin: basin.id,
      bbox: basin.bbox,
      gridStepDeg: basin.gridStepDeg,
      start: days[0].date,
      end: days[days.length - 1].date,
      collectedAt: new Date().toISOString(),
      samples: rows.length,
      skipped,
      days,
    });
  } catch (e) {
    return Response.json(
      { ...errorBody("CoastWatch", e), page: "https://coastwatch.noaa.gov/erddap/griddap/noaacwBLENDEDCsstDaily.html" },
      { status: 502 },
    );
  }
}
