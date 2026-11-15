import { fetchData, errorBody, SourceError } from "../../../../lib/nasa/fetchText.ts";
import { OCEAN_BASINS, OCEAN_DAYS, parseErddapSstCsv, aggregateDailySst, type BasinDef } from "../../../../lib/oceans.ts";
export const revalidate = 3600;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const basinParam = (sp.get("basin") ?? "global") as BasinDef["id"];
  const daysParam = Number(sp.get("days") ?? 30);

  const basin = Object.hasOwn(OCEAN_BASINS, basinParam) ? OCEAN_BASINS[basinParam] : null;
  if (!basin) return Response.json({ error: "invalid_basin" }, { status: 400 });
  if (!OCEAN_DAYS.includes(daysParam as (typeof OCEAN_DAYS)[number])) {
    return Response.json({ error: "invalid_days" }, { status: 400 });
  }

  try {
    const infoUrl = "https://coastwatch.noaa.gov/erddap/info/noaacwBLENDEDCsstDaily/index.json";
    const info = await fetchData(infoUrl, "application/json", 3600, (body) => {
      const json = JSON.parse(body) as { table?: { rows?: unknown[][] } };
      const endRow = json.table?.rows?.find((r) => r[0] === "attribute" && r[1] === "NC_GLOBAL" && r[2] === "time_coverage_end");
      const endIso = String(endRow?.[4] ?? "");
      if (!Number.isFinite(Date.parse(endIso))) throw new SourceError("Cobertura temporal ausente no CoastWatch");
      return endIso;
    });
    const endIso = info.data, endMs = Date.parse(endIso);

    const startMs = endMs - (daysParam - 1) * 864e5;
    const startIso = `${new Date(startMs).toISOString().slice(0, 10)}T12:00:00Z`;
    const csvUrl = `https://coastwatch.noaa.gov/erddap/griddap/noaacwBLENDEDCsstDaily.csv?analysed_sst[(${startIso}):1:(${endIso})]${basin.erddapBox}`;

    const csv = await fetchData(csvUrl, "text/csv", 3600, (body) => {
      const parsed = parseErddapSstCsv(body);
      if (!parsed.rows.length) throw new SourceError("Sem medições válidas de SST no recorte selecionado");
      return parsed;
    });
    const { rows, skipped } = csv.data;
    const days = aggregateDailySst(rows);

    return Response.json({
      source: "NOAA NESDIS CoastWatch ERDDAP (noaacwBLENDEDCsstDaily)",
      dataset: "Geo-Polar Blended Sea Surface Temperature 5km NRT",
      unit: "°C",
      basin: basin.id,
      bbox: basin.bbox,
      gridStepDeg: basin.gridStepDeg,
      start: days[0].date,
      end: days[days.length - 1].date,
      collectedAt: csv.fetchedAt,
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
