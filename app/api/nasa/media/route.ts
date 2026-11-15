export const revalidate = 86400;

/** Proxy for NASA SVS poster frames only (avoids mixed content on HTTPS deployments). */
const HOSTS = new Set(["svs.gsfc.nasa.gov", "svs.gsfc.nasa.gov.edgesuite.net"]);

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("u");
  if (!raw) return new Response("missing url", { status: 400 });
  let target: URL;
  try { target = new URL(raw); } catch { return new Response("invalid url", { status: 400 }); }
  if (!/^https?:$/.test(target.protocol) || !HOSTS.has(target.hostname)) return new Response("host not allowed", { status: 403 });
  try {
    const upstream = await fetch(target, { headers: { "User-Agent": "SULCO/1.0 (NASA Space Apps; public data)" }, signal: AbortSignal.timeout(20000) });
    const type = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok) return new Response("upstream error", { status: 502 });
    if (!type.startsWith("image/")) return new Response("only images are proxied", { status: 415 });
    return new Response(upstream.body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response("upstream unavailable", { status: 502 });
  }
}
