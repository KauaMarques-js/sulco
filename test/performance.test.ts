import assert from "node:assert/strict";
import { fetchText } from "../lib/nasa/fetchText.ts";
import { mapConcurrent } from "../lib/nasa/parallel.ts";
const original = globalThis.fetch;
try {
  let calls = 0;
  globalThis.fetch = async () => { calls++; await new Promise((r) => setTimeout(r, 20)); return new Response("real-source-contract-fixture", { headers: { "content-type": "text/csv" } }); };
  const results = await Promise.all(Array.from({length: 8}, () => fetchText("https://example.test/same", "text/csv", 3600)));
  assert.equal(calls, 1); assert.ok(results.every((r) => r.body === results[0].body));
  await fetchText("https://example.test/same", "text/csv", 3600); assert.equal(calls, 1);
  await fetchText("https://example.test/same", "text/csv", 0); assert.equal(calls, 2);
  let active = 0, peak = 0;
  const output = await mapConcurrent([0,1,2,3,4,5], 3, async (n) => { peak = Math.max(peak, ++active); await new Promise((r) => setTimeout(r, 20)); active--; return n * 2; });
  assert.equal(peak, 3); assert.deepEqual(output, [0,2,4,6,8,10]);
  calls = 0; globalThis.fetch = async () => { calls++; return new Response("invalid credential", { status: 403 }); };
  await assert.rejects(fetchText("https://example.test/forbidden", "text/plain")); assert.equal(calls, 1);
  globalThis.fetch = async () => new Response("recovered");
  assert.equal((await fetchText("https://example.test/forbidden", "text/plain")).body, "recovered");
  console.log("OK performance: concurrent request deduplication, TTL cache, explicit bypass, bounded concurrency, deterministic output, no caching of errors and no 403 retry");
} finally { globalThis.fetch = original; }
