import assert from "node:assert/strict";
import { normalizeSvs, metadataText, descriptionText } from "../lib/nasa/svs.ts";
import { X509Certificate } from "node:crypto";
import { rootCertificates } from "node:tls";
import { fetchSource } from "../lib/nasa/fetchSource.ts";
import { YR2, ROOT_YR_BY_X1 } from "../lib/nasa/svsCertificates.ts";
import { GET as media } from "../app/api/nasa/media/route.ts";
const description = "The NASA climate spiral 1880-2022. This version is in Celsius. || GISTEMP_Spiral_60sec_C.01400_print.jpg (1024x1024) [283.8 KB] || GISTEMP_Spiral_30sec_C.mp4 (2160x2160) [20.3 MB] || C (2160x2160) [0 Item(s)] ||";
const credits = [{ role: "Visualizer", people: [{ name: "Mark SubbaRao", employer: "NASA/GSFC" }, { name: "Ed Hawkins", employer: "University of Reading" }] }, { role: "Technical support", people: [{ name: "Laurence Schuler", employer: "ADNET Systems, Inc." }] }];
const result = normalizeSvs({ title: "NASA Climate Spiral", description, credits, main_video: "https://svs.gsfc.nasa.gov/example.mp4" }, 5057);
assert.equal(result.description, "The NASA climate spiral 1880-2022. This version is in Celsius.");
assert.equal(result.creditGroups.length, 2); assert.equal(result.creditGroups[0].people.length, 2);
assert.ok(result.credits?.includes("Mark SubbaRao (NASA/GSFC)")); assert.ok(!result.credits?.includes('"people"')); assert.ok(!result.description?.includes("||"));
assert.equal(result.video, "https://svs.gsfc.nasa.gov/example.mp4");
assert.equal(metadataText({ nested: "not prose" }), null);
assert.equal(metadataText("A &amp; B&nbsp;&#233; &#x1f30d;"), "A & B é 🌍");
assert.equal(descriptionText("<p>Scientific explanation.</p> || image.png (100x100) [1 KB] || More scientific prose."), "Scientific explanation.\n\nMore scientific prose.");
assert.equal(normalizeSvs({ credits: [null, {role:"Unknown", people:[null,{}]}] }, 5190).credits, null);
assert.equal(normalizeSvs({ credits: "NASA's Scientific Visualization Studio" }, 5190).credits, "NASA's Scientific Visualization Studio");
console.log("OK SVS: prose without download inventory, structured credits, malformed metadata, entities, original media preserved");

// The supplied intermediates must chain to an existing trusted root, not a new anchor.
const intermediate = new X509Certificate(YR2), crossSigned = new X509Certificate(ROOT_YR_BY_X1);
const root = rootCertificates.map((pem) => new X509Certificate(pem)).find((c) => c.subject === crossSigned.issuer)!;
assert.ok(intermediate.verify(crossSigned.publicKey));
assert.ok(crossSigned.verify(root.publicKey));
assert.ok(Date.parse(intermediate.validTo) > Date.now());

const originalFetch = globalThis.fetch;
const url = "https://svs.gsfc.nasa.gov/example.mp4";
try {
  let calls = 0;
  const tlsError = new TypeError("fetch failed", { cause: { code: "UNABLE_TO_VERIFY_LEAF_SIGNATURE" } });
  const signal = AbortSignal.timeout(10000);
  globalThis.fetch = async (_url, init) => {
    calls++;
    assert.equal(init?.signal, signal);
    assert.equal(new Headers(init?.headers).get("range"), "bytes=0-3");
    if (calls === 1) throw tlsError;
    assert.ok("dispatcher" in init!);
    return new Response("data");
  };
  assert.equal(await (await fetchSource(url, { signal, headers: { Range: "bytes=0-3" } })).text(), "data");
  assert.equal(calls, 2);
  for (const [target, code] of [["https://example.test/", "UNABLE_TO_VERIFY_LEAF_SIGNATURE"], [url, "CERT_HAS_EXPIRED"], [url, "ERR_TLS_CERT_ALTNAME_INVALID"], [url, "ECONNRESET"], [url.replace("https:", "http:"), "UNABLE_TO_VERIFY_LEAF_SIGNATURE"]]) {
    calls = 0;
    globalThis.fetch = async () => { calls++; throw new TypeError("fetch failed", { cause: { code } }); };
    await assert.rejects(fetchSource(target)); assert.equal(calls, 1);
  }
  calls = 0;
  globalThis.fetch = async () => { calls++; throw tlsError; };
  await assert.rejects(fetchSource(url, { signal: AbortSignal.abort() })); assert.equal(calls, 1);

  globalThis.fetch = async () => { throw Error("Forbidden hosts must not be fetched"); };
  assert.equal((await media(new Request("http://localhost/api/nasa/media?u=https://example.test/file.mp4"))).status, 403);
  assert.equal((await media(new Request("http://localhost/api/nasa/media?u=https://svs.gsfc.nasa.gov:8443/file.mp4"))).status, 403);
  globalThis.fetch = async (target, init) => {
    assert.equal(String(target), url);
    assert.equal(init?.redirect, "error");
    assert.equal(new Headers(init?.headers).get("range"), "bytes=0-3");
    return new Response("data", { status: 206, headers: { "Content-Type": "video/mp4", "Content-Range": "bytes 0-3/100", "Content-Length": "4", "Accept-Ranges": "bytes" } });
  };
  const partial = await media(new Request(`http://localhost/api/nasa/media?u=${encodeURIComponent(url.replace("https:", "http:"))}`, { headers: { Range: "bytes=0-3" } }));
  assert.equal(partial.status, 206); assert.equal(await partial.text(), "data");
  assert.equal(partial.headers.get("content-range"), "bytes 0-3/100");
  assert.equal(partial.headers.get("accept-ranges"), "bytes");
  globalThis.fetch = async () => new Response(null, { status: 416, headers: { "Content-Range": "bytes */100" } });
  const invalidRange = await media(new Request(`http://localhost/api/nasa/media?u=${encodeURIComponent(url)}`));
  assert.equal(invalidRange.status, 416); assert.equal(invalidRange.headers.get("content-range"), "bytes */100");
  globalThis.fetch = async () => new Response("<html>not media</html>", { headers: { "Content-Type": "text/html" } });
  assert.equal((await media(new Request(`http://localhost/api/nasa/media?u=${encodeURIComponent(url)}`))).status, 415);
  console.log("OK SVS transport: verified intermediate chain, scoped TLS recovery, HTTPS media, byte ranges, forbidden hosts and invalid content");
} finally { globalThis.fetch = originalFetch; }
