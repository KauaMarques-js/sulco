export class SourceError extends Error {
  info: { status?: number; contentType?: string; snippet?: string };
  constructor(msg: string, info: SourceError["info"] = {}) { super(msg); this.info = info; }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET com User-Agent, timeout, 1 nova tentativa e checagem de conteúdo (bloqueios costumam devolver HTML). */
async function requestText(url: string, accept: string) {
  let last: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "SULCO/1.0 (NASA Space Apps; public data)", Accept: accept },
        // Only the validated application cache may retain upstream responses.
        cache: "no-store",
      });
      const contentType = r.headers.get("content-type") ?? "";
      const body = await r.text();
      if (!r.ok) throw new SourceError(`HTTP ${r.status}`, { status: r.status, contentType, snippet: body.slice(0, 120) });
      return { body, contentType, fetchedAt: new Date().toISOString() };
    } catch (e) {
      last = e;
      if (e instanceof SourceError && e.info.status && e.info.status < 500 && e.info.status !== 429) throw e;
      if (attempt < 2) await sleep(600);
    }
  }
  throw last instanceof SourceError ? last : new SourceError(String((last as Error)?.message ?? last));
}

// Bounded per-process cache also works on force-dynamic routes. No failed response is cached.
type TextResult = { body: string; contentType: string; fetchedAt: string };
const responses = new Map<string, { value: TextResult; expires: number; bytes: number }>();
const inflight = new Map<string, Promise<TextResult>>();
const MAX_BYTES = 16 * 1024 * 1024;
let bytes = 0;
export async function fetchText(url: string, accept: string, revalidate = 86400, validate?: (body: string) => void): Promise<TextResult> {
  if (revalidate <= 0) { const value = await requestText(url, accept); validate?.(value.body); return value; }
  const key = `${accept}:${url}`;
  const cached = responses.get(key);
  if (cached && cached.expires > Date.now()) {
    try { validate?.(cached.value.body); return cached.value; }
    catch (error) { bytes -= cached.bytes; responses.delete(key); throw error; }
  }
  if (cached) { bytes -= cached.bytes; responses.delete(key); }
  const pending = inflight.get(key); if (pending) { const value = await pending; validate?.(value.body); return value; }
  const promise = requestText(url, accept).then((value) => {
    validate?.(value.body);
    const size = Buffer.byteLength(value.body, "utf8");
    if (size <= 4 * 1024 * 1024) {
      while (responses.size && (bytes + size > MAX_BYTES || responses.size >= 32)) {
        const oldest = responses.keys().next().value!;
        bytes -= responses.get(oldest)!.bytes; responses.delete(oldest);
      }
      responses.set(key, { value, expires: Date.now() + revalidate * 1000, bytes: size }); bytes += size;
    }
    return value;
  }).finally(() => inflight.delete(key));
  inflight.set(key, promise); return promise;
}

/** Parse before admitting a successful HTTP response into the cache. */
export async function fetchData<T>(url: string, accept: string, revalidate: number, parse: (body: string) => T) {
  let data!: T;
  const response = await fetchText(url, accept, revalidate, (body) => { data = parse(body); });
  return { ...response, data };
}

export function errorBody(source: string, e: unknown) {
  const dev = process.env.NODE_ENV !== "production";
  const se = e instanceof SourceError ? e : null;
  return { error: "source_unavailable", source, ...(dev ? { detail: String((e as Error)?.message ?? e), info: se?.info } : {}) };
}
