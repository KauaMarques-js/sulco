import { fetchSource } from "../../../../lib/nasa/fetchSource.ts";

export const revalidate = 86400;

/** Stream NASA SVS media over verified HTTPS, including byte ranges for seeking. */
const HOSTS = new Set(["svs.gsfc.nasa.gov", "svs.gsfc.nasa.gov.edgesuite.net"]);

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("u");
  if (!raw) return new Response("missing url", { status: 400 });
  let target: URL;
  try { target = new URL(raw); } catch { return new Response("invalid url", { status: 400 }); }
  if (!/^https?:$/.test(target.protocol) || !HOSTS.has(target.hostname)) return new Response("host not allowed", { status: 403 });
  if (target.username || target.password || (target.port && target.port !== "443" && target.port !== "80")) return new Response("invalid url", { status: 403 });
  target.protocol = "https:"; target.port = "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const headers: Record<string, string> = { "User-Agent": "SULCO/1.0 (NASA Space Apps; public data)" };
    const range = req.headers.get("range");
    if (range) headers.Range = range;
    const upstream = await fetchSource(target, { headers, cache: "no-store", redirect: "error", signal: AbortSignal.any([controller.signal, req.signal]) });
    // The timeout covers connection/headers; long video streams follow the client signal.
    clearTimeout(timeout);
    const type = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok || (!type.startsWith("image/") && !type.startsWith("video/"))) {
      await upstream.body?.cancel();
      const contentRange = upstream.headers.get("content-range");
      if (upstream.status === 416) return new Response(null, { status: 416, headers: contentRange ? { "Content-Range": contentRange } : {} });
      return new Response(upstream.ok ? "only images and videos are proxied" : "upstream error", { status: upstream.ok ? 415 : 502 });
    }
    const responseHeaders = new Headers({
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    });
    for (const name of ["content-range", "content-length", "accept-ranges", "etag", "last-modified"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return new Response("upstream unavailable", { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
