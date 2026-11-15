import assert from "node:assert/strict";
import { GET as fires } from "../app/api/nasa/fires/route.ts";
import { GET as climate } from "../app/api/nasa/gistemp/route.ts";
import { GET as availability } from "../app/api/nasa/fires/availability/route.ts";
import { parseAvailability } from "../lib/nasa/firms-availability.ts";
import { sampleDetections, parseFirms } from "../lib/firms.ts";

assert.throws(() => parseAvailability("Invalid MAP_KEY"));
assert.deepEqual(parseAvailability("data_id,min_date,max_date\nVIIRS_SNPP_NRT,2026-08-01,2026-11-02\nVIIRS_NOAA21_NRT,2026-02-30,2026-11-02"), [{ id: "VIIRS_SNPP_NRT", first: "2026-08-01", last: "2026-11-02" }]);
const observations = Array.from({length: 3000}, (_, i) => ({date: `2026-01-0${i % 3 + 1}`, lat:-12, lon:-55, frp:i}));
const sample = sampleDetections(observations); assert.equal(sample.length, 2000); assert.equal(new Set(sample.map((r) => r.date)).size, 3); assert.ok(sample.every((r) => observations.includes(r)));
assert.equal(parseFirms("latitude,longitude,acq_date,frp\n91,20,2026-01-01,3\n12,20,2026-01-01,\n12,181,2026-01-01,3").rows.length, 0);
const originalFetch = globalThis.fetch;
const originalKey = process.env.FIRMS_MAP_KEY;
const csv = "Year,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec\n2026,1,1,1,1,1,1,1,1,1,1,***,***";
try {
  let r: Response; let d;
  delete process.env.FIRMS_MAP_KEY;
  r = await availability(); assert.equal(r.status, 503);
  process.env.FIRMS_MAP_KEY = "synthetic-test-key";
  globalThis.fetch = async () => new Response("data_id,min_date,max_date\nVIIRS_SNPP_NRT,2026-08-01,2026-11-02");
  r = await availability(); d = await r.json(); assert.equal(r.status, 200); assert.equal(d.products[0].last, "2026-11-02"); assert.equal(JSON.stringify(d).includes("synthetic-test-key"), false);
  globalThis.fetch = async () => new Response("invalid source response");
  r = await availability(); assert.equal(r.status, 502);
  globalThis.fetch = async () => new Response(csv);
  r = await climate(new Request("http://localhost/api/nasa/gistemp")); d = await r.json(); assert.equal(d.origin, "remote"); assert.equal(d.rows.length, 10); assert.match(d.sha256, /^[a-f0-9]{64}$/);
  globalThis.fetch = async () => new Response("<html>unavailable</html>");
  r = await climate(new Request("http://localhost/api/nasa/gistemp")); d = await r.json(); assert.equal(d.origin, "local"); assert.equal(d.fallback, true);
  r = await climate(new Request("http://localhost/api/nasa/gistemp?source=remote")); assert.equal(r.status, 502);
  r = await climate(new Request("http://localhost/api/nasa/gistemp?source=invalid")); assert.equal(r.status, 400);
  delete process.env.FIRMS_MAP_KEY;
  r = await fires(new Request("http://localhost/api/nasa/fires")); assert.equal(r.status, 503);
  process.env.FIRMS_MAP_KEY = "synthetic-test-key";
  for (const query of ["area=constructor", "sat=toString", "days=2.5", "end=2026-02-30"]) {
    r = await fires(new Request("http://localhost/api/nasa/fires?" + query)); assert.equal(r.status, 400);
  }
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response("latitude,longitude,acq_date,frp,version\n-12,-55,2026-01-01,10,2.0NRT"); };
  r = await fires(new Request("http://localhost/api/nasa/fires?days=10&sat=snpp&end=2026-01-10")); d = await r.json(); assert.equal(r.status, 200); assert.equal(calls, 2); assert.equal(d.start, "2026-01-01"); assert.equal(d.end, "2026-01-10"); assert.equal(JSON.stringify(d).includes("synthetic-test-key"), false);
  console.log("OK API: FIRMS availability, invalid coordinates, map sampling, private key, query dates, remote climate and explicit fallback");
} finally { globalThis.fetch = originalFetch; if (originalKey === undefined) delete process.env.FIRMS_MAP_KEY; else process.env.FIRMS_MAP_KEY = originalKey; }
