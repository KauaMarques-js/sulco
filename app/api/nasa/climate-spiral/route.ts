import { fetchData, errorBody, SourceError } from "../../../../lib/nasa/fetchText.ts";
import { normalizeSvs } from "../../../../lib/nasa/svs.ts";
export const revalidate = 86400;

export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id") ?? 5190);
  if (![5190, 5057, 5101].includes(id)) return Response.json({ error: "invalid_id" }, { status: 400 });
  try {
    const result = await fetchData(`https://svs.gsfc.nasa.gov/api/${id}/`, "application/json", 86400, (body) => {
      let value: unknown;
      try { value = JSON.parse(body); } catch { throw new SourceError("Resposta SVS não é JSON"); }
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new SourceError("Metadados SVS inválidos");
      const normalized = normalizeSvs(value as Record<string, unknown>, id);
      if (!normalized.title && !normalized.video && !normalized.image) throw new SourceError("Metadados SVS vazios");
      return normalized;
    });
    return Response.json({ ...result.data, fetchedAt: result.fetchedAt });
  } catch (e) { return Response.json({ ...errorBody("SVS", e), page: `https://svs.gsfc.nasa.gov/${id}/` }, { status: 502 }); }
}
