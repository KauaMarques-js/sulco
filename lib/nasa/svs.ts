export type Media = { url: string; kind: "video" | "image"; hint?: string };
const VID = /\.(mp4|webm|m4v|mov)(\?|$)/i, IMG = /\.(jpe?g|png|webp)(\?|$)/i;

function asUrl(s: unknown): string | null {
  if (typeof s !== "string") return null;
  try { const u = new URL(s.trim()); return u.protocol === "https:" || u.protocol === "http:" ? u.href : null; } catch { return null; }
}
/** Percorre qualquer estrutura aninhada (strings, objetos, arrays) e classifica mídia por extensão. */
export function extractMedia(node: unknown, out: Media[] = [], seen = new Set<string>(), depth = 0): Media[] {
  if (depth > 12 || node == null) return out;
  const u = asUrl(node);
  if (u) { if (!seen.has(u)) { const kind = VID.test(u) ? "video" : IMG.test(u) ? "image" : null; if (kind) { seen.add(u); out.push({ url: u, kind }); } } return out; }
  if (Array.isArray(node)) node.forEach((n) => extractMedia(n, out, seen, depth + 1));
  else if (typeof node === "object") Object.values(node as object).forEach((n) => extractMedia(n, out, seen, depth + 1));
  return out;
}
const txt = (v: unknown) => (typeof v === "string" ? v : v && typeof v === "object" ? JSON.stringify(v) : null);

export function normalizeSvs(j: Record<string, unknown>, id: number) {
  const media = extractMedia([j.main_video, j.main_image, j.media_groups]);
  const videos = media.filter((m) => m.kind === "video"), images = media.filter((m) => m.kind === "image");
  return {
    id, page: `https://svs.gsfc.nasa.gov/${id}/`, title: txt(j.title), description: txt(j.description), credits: txt(j.credits),
    video: videos[0]?.url ?? null, image: images[0]?.url ?? null,
    diagnostics: { keys: Object.keys(j).slice(0, 40), videos: videos.length, images: images.length, mainVideoType: typeof j.main_video, mainImageType: typeof j.main_image },
  };
}
