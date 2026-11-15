import assert from "node:assert/strict";
import { GET as discover } from "../app/api/nasa/discover/route.ts";
import { GET as fires } from "../app/api/nasa/fires/route.ts";
import { GET as climate } from "../app/api/nasa/gistemp/route.ts";
import { parseEvents, parseEarthImage } from "../lib/nasa/discover.ts";

const event = { id: "test", title: "Synthetic event", categories: [{ id: "wildfires", title: "Wildfires" }], geometry: [{ type: "Point", date: "2026-01-01T00:00:00Z", coordinates: [-55, -12] }, { type: "Point", date: "2026-01-02T00:00:00Z", coordinates: [-54, -11] }] };
assert.equal(parseEvents({ events: [event] }).events[0].lat, -11);
assert.equal(parseEvents({ events: [event, { ...event, geometry: [{ type: "Point", date: "bad", coordinates: [0, 0] }] }, { ...event, geometry: [{ type: "Point", date: "2026-01-01", coordinates: [181, 91] }] }] }).skipped, 2);
assert.throws(() => parseEvents({}));
assert.equal(parseEarthImage([{ image: "../../evil", date: "2026-01-01 00:00:00" }]), null);
assert.equal(parseEarthImage([{ image: "epic_test", date: "2026-01-01 00:00:00" }])?.url, "https://epic.gsfc.nasa.gov/archive/natural/2026/01/01/jpg/epic_test.jpg");
const originalFetch = globalThis.fetch;
const originalKey = process.env.FIRMS_MAP_KEY;
const csv = "Year,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec\n2026,1,1,1,1,1,1,1,1,1,1,***,***";
try {
  globalThis.fetch = async (url) => new Response(JSON.stringify(String(url).includes("eonet") ? { events: [event] } : [{ image: "epic_test", date: "2026-01-01 00:00:00" }]));
  let r = await discover(); let d = await r.json(); assert.equal(r.status, 200); assert.equal(d.events.length, 1); assert.equal(d.imageAvailable, true);
  globalThis.fetch = async (url) => new Response(String(url).includes("eonet") ? "{}" : "[]");
  r = await discover(); d = await r.json(); assert.equal(r.status, 502); assert.equal(d.eventsAvailable, false);
  globalThis.fetch = async (url) => new Response(String(url).includes("eonet") ? JSON.stringify({ events: [] }) : "{}");
  r = await discover(); d = await r.json(); assert.equal(r.status, 200); assert.equal(d.eventsAvailable, true); assert.equal(d.imageAvailable, false);
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
  console.log("OK API: NASA contracts, coordinates, image paths, partial failure, empty results, remote climate and explicit fallback");
} finally { globalThis.fetch = originalFetch; if (originalKey === undefined) delete process.env.FIRMS_MAP_KEY; else process.env.FIRMS_MAP_KEY = originalKey; }
