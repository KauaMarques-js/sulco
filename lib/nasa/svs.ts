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
/** Metadata text is untrusted prose, never a JSON serialization of an object. */
export function metadataText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const entities: Record<string, string> = { amp: "&", nbsp: " ", quot: '"', apos: "'", lt: "<", gt: ">" };
  const text = value.replace(/<[^>]+>/g, " ").replace(/&(#x[0-9a-f]+|#\d+|amp|nbsp|quot|apos|lt|gt);/gi, (match, entity: string) => {
    if (!entity.startsWith("#")) return entities[entity.toLowerCase()] ?? match;
    const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "�";
  }).replace(/\s+/g, " ").trim();
  return text || null;
}
export type CreditGroup = { role: string; people: { name: string; employer: string | null }[] };
export function creditGroups(value: unknown): CreditGroup[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((group) => {
    if (!group || typeof group !== "object") return [];
    const role = metadataText(group.role);
    if (!role || !Array.isArray(group.people)) return [];
    const people = group.people.flatMap((p: unknown) => {
      if (!p || typeof p !== "object") return [];
      const person = p as Record<string, unknown>, name = metadataText(person.name);
      return name ? [{ name, employer: metadataText(person.employer) }] : [];
    });
    return people.length ? [{ role, people }] : [];
  });
}
/** SVS descriptions may append a download inventory separated by double pipes. */
export function descriptionText(value: unknown): string | null {
  const text = metadataText(value); if (!text) return null;
  const prose = text.split("||").map((part) => part.trim()).filter((part) => part && !/\.(?:jpe?g|png|webp|mp4|webm|mov|m4v|zip)\b/i.test(part) && !/\(\d+\s*[x×]\s*\d+\)\s*\[/i.test(part));
  return prose.join("\n\n") || null;
}

export function normalizeSvs(j: Record<string, unknown>, id: number) {
  const media = extractMedia([j.main_video, j.main_image, j.media_groups]);
  const videos = media.filter((m) => m.kind === "video"), images = media.filter((m) => m.kind === "image");
  const groups = creditGroups(j.credits);
  const credits = groups.length ? groups.map((g) => `${g.role}: ${g.people.map((p) => p.name + (p.employer ? ` (${p.employer})` : "")).join(", ")}`).join("; ") : metadataText(j.credits);
  return {
    id, page: `https://svs.gsfc.nasa.gov/${id}/`, title: metadataText(j.title), description: descriptionText(j.description), credits, creditGroups: groups,
    video: videos[0]?.url ?? null, image: images[0]?.url ?? null,
    diagnostics: { keys: Object.keys(j).slice(0, 40), videos: videos.length, images: images.length, mainVideoType: typeof j.main_video, mainImageType: typeof j.main_image },
  };
}
