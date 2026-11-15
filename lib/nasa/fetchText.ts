export class SourceError extends Error {
  info: { status?: number; contentType?: string; snippet?: string };
  constructor(msg: string, info: SourceError["info"] = {}) { super(msg); this.info = info; }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET com User-Agent, timeout, 1 nova tentativa e checagem de conteúdo (bloqueios costumam devolver HTML). */
export async function fetchText(url: string, accept: string, revalidate = 86400) {
  let last: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "SULCO/1.0 (NASA Space Apps; public data)", Accept: accept },
        next: { revalidate },
      });
      const contentType = r.headers.get("content-type") ?? "";
      const body = await r.text();
      if (!r.ok) throw new SourceError(`HTTP ${r.status}`, { status: r.status, contentType, snippet: body.slice(0, 120) });
      return { body, contentType };
    } catch (e) { last = e; if (attempt < 2) await sleep(600); }
  }
  throw last instanceof SourceError ? last : new SourceError(String((last as Error)?.message ?? last));
}

export function errorBody(source: string, e: unknown) {
  const dev = process.env.NODE_ENV !== "production";
  const se = e instanceof SourceError ? e : null;
  return { error: "source_unavailable", source, ...(dev ? { detail: String((e as Error)?.message ?? e), info: se?.info } : {}) };
}
