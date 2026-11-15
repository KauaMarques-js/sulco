import { fetchText, errorBody, SourceError } from "../../../../lib/nasa/fetchText";
import { normalizeSvs } from "../../../../lib/nasa/svs";
export const revalidate = 86400;

export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id") ?? 5190);
  if (![5190, 5057].includes(id)) return Response.json({ error: "invalid_id" }, { status: 400 });
  try {
    const { body } = await fetchText(`https://svs.gsfc.nasa.gov/api/${id}/`, "application/json");
    let j: Record<string, unknown>;
    try { j = JSON.parse(body); } catch { throw new SourceError("Resposta SVS não é JSON", { snippet: body.slice(0, 120) }); }
    return Response.json({ ...normalizeSvs(j, id), fetchedAt: new Date().toISOString() });
  } catch (e) { return Response.json({ ...errorBody("SVS", e), page: `https://svs.gsfc.nasa.gov/${id}/` }, { status: 502 }); }
}
