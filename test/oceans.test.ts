import test from "node:test";
import assert from "node:assert/strict";
import { parseErddapSstCsv, aggregateDailySst, oceanFreq } from "../lib/oceans.ts";

const SAMPLE_CSV = [
  "time,latitude,longitude,analysed_sst",
  "UTC,degrees_north,degrees_east,degree_C",
  "2026-11-12T12:00:00Z,-20.0,-40.0,25.5",
  "2026-11-12T12:00:00Z,-15.0,-38.0,NaN",
  "2026-11-11T12:00:00Z,-20.0,-40.0,24.0",
  "2026-11-12T12:00:00Z,-10.0,-35.0,27.5",
  "bad-date,-10.0,-35.0,20.0",
].join("\n");

test("parseErddapSstCsv skips ERDDAP units row, NaNs, and invalid lines without gap-filling", () => {
  const { rows, skipped } = parseErddapSstCsv(SAMPLE_CSV);
  assert.equal(rows.length, 3);
  assert.equal(skipped, 2);
  assert.deepEqual(rows[0], { date: "2026-11-12", lat: -20, lon: -40, sst: 25.5 });
});

test("parseErddapSstCsv rejects unexpected CSV headers", () => {
  assert.throws(() => parseErddapSstCsv("foo,bar\n1,2"));
});

test("aggregateDailySst computes chronological mean/min/max without inventing missing days", () => {
  const { rows } = parseErddapSstCsv(SAMPLE_CSV);
  const days = aggregateDailySst(rows);
  assert.equal(days.length, 2);
  assert.equal(days[0].date, "2026-11-11");
  assert.equal(days[0].sstMean, 24.0);
  assert.equal(days[1].date, "2026-11-12");
  assert.equal(days[1].sstMean, 26.5);
  assert.equal(days[1].sstMin, 25.5);
  assert.equal(days[1].sstMax, 27.5);
  assert.equal(days[1].samples, 2);
});

test("oceanFreq maps min/mid/max SST across 220..880 Hz and guards edge cases", () => {
  assert.equal(oceanFreq(20, 20, 28), 220);
  assert.equal(oceanFreq(24, 20, 28), 440);
  assert.equal(oceanFreq(28, 20, 28), 880);
  assert.equal(oceanFreq(25, 25, 25), 440);
  assert.equal(oceanFreq(Number.NaN, 20, 28), null);
});

test("missing numeric cells, impossible dates and invalid coordinates are never invented as zero", () => {
  const csv = "time,latitude,longitude,analysed_sst\nUTC,degrees_north,degrees_east,degree_C\n2026-11-01T12:00:00Z,1,2,\n2026-11-01T12:00:00Z,,2,23\n2026-02-30T12:00:00Z,1,2,23\n2026-11-01T12:00:00Z,91,2,23\n2026-11-01T12:00:00Z,1,181,23";
  const result = parseErddapSstCsv(csv); assert.equal(result.rows.length, 0); assert.equal(result.skipped, 5);
});
