import { fetchData } from "../../../../../lib/nasa/fetchText.ts";
import { parseAvailability } from "../../../../../lib/nasa/firms-availability.ts";
export const dynamic = "force-dynamic";
export async function GET() {
  const key = process.env.FIRMS_MAP_KEY;
  if (!key) return Response.json({ error: "missing_key", products: [] }, { status: 503 });
  try {
    const result = await fetchData(`https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/${key}/ALL`, "text/csv,*/*", 3600, (body) => {
      const products = parseAvailability(body);
      if (!products.length) throw new Error("No supported FIRMS products");
      return products;
    });
    return Response.json({ products: result.data, checkedAt: result.fetchedAt });
  } catch { return Response.json({ error: "source_unavailable", source: "FIRMS availability", products: [] }, { status: 502 }); }
}
