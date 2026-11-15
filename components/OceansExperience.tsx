"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getJson, useApp, type Fail } from "./AppProvider";
import { usePlayback } from "./usePlayback";
import OceansControls, { useOceans } from "./OceansControls";
import OceansChart from "./OceansChart";
import Det from "./Det";
import ErrBox from "./ErrBox";
import { Icon } from "./Icons";
import { oceanFreq, type OceanDay } from "../lib/oceans";

type SvsMeta = {
  id: number;
  page: string;
  title: string | null;
  description: string | null;
  credits: string | null;
  video: string | null;
  image: string | null;
};

const SPEEDS = [0.5, 1, 1.5, 2] as const;

export default function OceansExperience() {
  const { d, lang, prefs } = useApp();
  const o = useOceans();
  const days = useMemo<OceanDay[]>(() => o.data?.days ?? [], [o.data]);

  const [svs, setSvs] = useState<SvsMeta | null>(null);
  const [svsErr, setSvsErr] = useState<Fail | null>(null);
  const [vSpeed, setVSpeed] = useState<number>(1);
  const [ended, setEnded] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [srLive, setSrLive] = useState("");
  const [pickIdx, setPickIdx] = useState(0);
  const vidRef = useRef<HTMLVideoElement>(null);
  const metaRequest = useRef<AbortController | null>(null);

  const loadSvs = () => {
    metaRequest.current?.abort();
    const controller = new AbortController(); metaRequest.current = controller;
    setSvsErr(null);
    getJson<SvsMeta>("/api/nasa/climate-spiral?id=5101", { signal: controller.signal })
      .then((value) => { if (!controller.signal.aborted) setSvs(value); })
      .catch((error) => { if (!controller.signal.aborted) setSvsErr(error); });
  };
  useEffect(() => { loadSvs(); return () => metaRequest.current?.abort(); }, []);

  useEffect(() => {
    if (vidRef.current) vidRef.current.playbackRate = vSpeed;
  }, [vSpeed, svs]);

  const { lo, hi, avg } = useMemo(() => {
    if (!days.length) return { lo: 0, hi: 0, avg: 0 };
    const vals = days.map((x) => x.sstMean);
    return {
      lo: Math.min(...vals),
      hi: Math.max(...vals),
      avg: vals.reduce((s, v) => s + v, 0) / vals.length,
    };
  }, [days]);

  const fmt = (v: number, digits = 2) =>
    v.toLocaleString(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  const describeDay = (day: OceanDay) => {
    const f = oceanFreq(day.sstMean, lo, hi);
    return d.oEvent(day.date, fmt(day.sstMean), fmt(day.sstMin, 1), fmt(day.sstMax, 1), f ? f.toFixed(0) : "—");
  };

  const pb = usePlayback<OceanDay>(days, {
    note: (day, speed, e) => {
      const f = oceanFreq(day.sstMean, lo, hi);
      if (f !== null) e.note(f, Math.max(0.12, 0.22 / speed));
    },
    step: (day) => {
      const line = describeDay(day);
      setEnded(false);
      setLog((prev) => (prev[prev.length - 1] === line ? prev : [...prev.slice(-119), line]));
      if (prefs.verbose) setSrLive(line);
    },
    end: () => { setEnded(true); setSrLive(d.ended); },
  });

  useEffect(() => {
    setEnded(false);
    setLog([]);
    setPickIdx(0);
    setSrLive("");
  }, [days]);

  const cur = days[Math.min(pb.idx, Math.max(0, days.length - 1))];
  const curFreq = cur ? oceanFreq(cur.sstMean, lo, hi) : null;
  const pct = cur && hi > lo ? Math.round(((cur.sstMean - lo) / (hi - lo)) * 100) : 50;
  const pitchTag = pct < 34 ? d.pitchLow : pct > 66 ? d.pitchHigh : d.pitchMid;

  const httpsVideo = svs?.video ? svs.video.replace(/^http:\/\//i, "https://") : null;
  const proxyImg = svs?.image ? `/api/nasa/media?u=${encodeURIComponent(svs.image.replace(/^http:\/\//i, "https://"))}` : null;

  const chartDesc = days.length
    ? d.oDesc(days[0].date, days[days.length - 1].date, fmt(lo), fmt(hi), fmt(avg), days.length)
    : "";

  return (
    <>
      <div style={{ marginBottom: "1rem" }}>
        <Link className="btn" href="/experiences">← {d.back}</Link>
      </div>

      <p className="eyebrow">NASA EIC · SVS 5101 / NOAA CoastWatch</p>
      <h1>{d.expTitles.oceans}</h1>
      <p style={{ maxWidth: "66ch" }}>{d.oIntro}</p>
      <p className="player-note">{d.noAudio}</p>

      {/* Step 1: Official NASA SVS 5101 Visualization */}
      <section className="card" aria-labelledby="o-s1" style={{ marginTop: "1.25rem" }}>
        <div className="section-head">
          <div>
            <p className="eyebrow">{d.officialViz}</p>
            <h2 id="o-s1" style={{ margin: 0 }}>{d.s1}</h2>
          </div>
          {svs && (
            <a className="btn" href={svs.page} target="_blank" rel="noopener">
              SVS 5101 <Icon name="external" size={14} />
            </a>
          )}
        </div>

        {!svs && !svsErr && <p role="status">{d.loading}</p>}
        {svsErr && <ErrBox d={d} f={svsErr} msg={d.failSvs} retry={loadSvs} />}
        {svs && (
          <>
            {svs.title && <p style={{ fontWeight: 600, marginBottom: ".6rem" }}>{svs.title}</p>}
            {httpsVideo ? (
              <video
                ref={vidRef}
                src={httpsVideo}
                poster={proxyImg ?? undefined}
                controls
                playsInline
                preload="metadata"
                style={{ width: "100%", maxHeight: "420px", borderRadius: "12px", background: "#05060b", display: "block" }}
              />
            ) : proxyImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proxyImg}
                alt={svs.title ?? d.expTitles.oceans}
                style={{ width: "100%", maxHeight: "420px", objectFit: "contain", borderRadius: "12px", background: "#05060b", display: "block" }}
              />
            ) : (
              <p className="mut">{d.videoMissing}</p>
            )}

            {httpsVideo && (
              <div className="row" style={{ marginTop: ".85rem", alignItems: "center" }}>
                <span className="mut" style={{ fontSize: ".9rem" }}>{d.videoSpeed}:</span>
                <div className="seg" role="group" aria-label={d.videoSpeed}>
                  {SPEEDS.map((s) => (
                    <button key={s} type="button" aria-pressed={vSpeed === s} onClick={() => setVSpeed(s)}>
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="mut" style={{ fontSize: ".85rem", marginTop: ".65rem" }}>{d.oVer5101}</p>
          </>
        )}
      </section>

      {/* Step 2: Select Basin & Window + Real Data Chart */}
      <section className="card" aria-labelledby="o-s2" style={{ marginTop: "1.25rem" }}>
        <div className="section-head">
          <div>
            <p className="eyebrow">NOAA NESDIS CoastWatch ERDDAP</p>
            <h2 id="o-s2" style={{ margin: 0 }}>{d.s2}</h2>
          </div>
          {o.data && <span className="badge is-ok">{d.available}</span>}
        </div>

        <OceansControls o={o} />

        {o.busy && !o.data && <p role="status">{d.loading}</p>}
        {o.err && <ErrBox d={d} f={o.err} msg={d.oFailData} retry={o.load} />}

        {o.data && (
          <>
            <div className="pill-row">
              <span className="chip">{o.data.dataset}</span>
              <span className="chip">{d.unit}: {o.data.unit}</span>
              <span className="chip">{d.oGridStep}: {o.data.gridStepDeg}°</span>
              <span className="chip">{o.data.start} → {o.data.end}</span>
              <span className="chip cool">{d.oMean}: {fmt(avg)} °C</span>
              <span className="chip">{o.data.samples.toLocaleString(lang)} {d.oSamples.toLowerCase()}</span>
              <span className="chip">{o.data.skipped.toLocaleString(lang)} {d.oSkipped}</span>
              <span className="chip">{d.fCollected}: {new Date(o.data.collectedAt).toLocaleString(lang)}</span>
            </div>

            {days.length === 0 ? (
              <p>{d.oNoData}</p>
            ) : (
              <OceansChart
                days={days}
                idx={pb.playing || pb.idx > 0 ? pb.idx : undefined}
                desc={chartDesc}
                onPick={(k) => {
                  setPickIdx(k);
                  pb.seek(k);
                  pb.hearOne(k);
                  setEnded(false);
                }}
              />
            )}
          </>
        )}
      </section>

      {/* Step 3: Sonification Studio & Accessible Outputs */}
      {days.length > 0 && (
        <section className="card" aria-labelledby="o-s3" style={{ marginTop: "1.25rem" }}>
          <div className="section-head">
            <div>
              <p className="eyebrow">{d.studio}</p>
              <h2 id="o-s3" style={{ margin: 0 }}>{d.s3}</h2>
            </div>
            {cur && curFreq !== null && (
              <span className="chip warm mono">
                {cur.date} · {fmt(cur.sstMean)} °C · {curFreq.toFixed(0)} {d.hz}
              </span>
            )}
          </div>

          <div className="row" style={{ marginBottom: "1rem", alignItems: "center" }}>
            {pb.playing ? (
              <button type="button" onClick={pb.pause}><Icon name="pause" size={16} /> {d.pause}</button>
            ) : pb.paused() ? (
              <button type="button" onClick={pb.play}><Icon name="play" size={16} /> {d.resume}</button>
            ) : (
              <button type="button" onClick={() => { setEnded(false); pb.play(); }}><Icon name="play" size={16} /> {d.play}</button>
            )}
            <button type="button" onClick={() => { pb.stop(); setEnded(false); }}><Icon name="stop" size={16} /> {d.stop}</button>
            <button type="button" onClick={() => { setEnded(false); pb.restart(); }}><Icon name="restart" size={16} /> {d.restart}</button>

            <span className="mut" style={{ fontSize: ".9rem", marginLeft: ".5rem" }}>{d.sonSpeed}:</span>
            <div className="seg" role="group" aria-label={d.sonSpeed}>
              {SPEEDS.map((s) => (
                <button key={s} type="button" aria-pressed={pb.speed === s} onClick={() => pb.setSpeed(s)}>
                  {s}x
                </button>
              ))}
            </div>

            <label style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", marginLeft: ".5rem" }}>
              <span>{d.volume} ({pb.vol}%)</span>
              <input type="range" min={0} max={100} value={pb.vol} onChange={(e) => pb.setVol(Number(e.target.value))} />
            </label>
          </div>

          <div className="row" style={{ marginBottom: "1rem", alignItems: "flex-end" }}>
            <label>
              {d.oPickDay}
              <select value={pickIdx} onChange={(e) => { const k = Number(e.target.value); setPickIdx(k); pb.seek(k); }}>
                {days.map((day, k) => (
                  <option key={day.date} value={k}>
                    {day.date} ({fmt(day.sstMean)} °C)
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                pb.seek(pickIdx);
                pb.hearOne(pickIdx);
                if (days[pickIdx]) {
                  const line = describeDay(days[pickIdx]);
                  setLog((prev) => [...prev.slice(-119), line]);
                  if (prefs.verbose) setSrLive(line);
                }
              }}
            >
              <Icon name="sound" size={16} /> {d.oHearDay}
            </button>
          </div>

          {/* Visual sound meter + real-time canvas */}
          {cur && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.03)",
                marginBottom: "1rem",
              }}
            >
              <div className="pill-row" style={{ marginTop: 0, marginBottom: ".65rem" }}>
                <span className="chip">{d.seeSound}: <strong>{pitchTag}</strong></span>
                <span className="chip cool">{d.oMean}: {fmt(cur.sstMean)} °C</span>
                <span className="chip">{d.oRange}: {fmt(cur.sstMin, 1)}–{fmt(cur.sstMax, 1)} °C</span>
                <span className="chip warm mono">{curFreq ? `${curFreq.toFixed(0)} Hz` : "—"}</span>
              </div>
              <div
                aria-hidden="true"
                style={{
                  height: prefs.visual ? "16px" : "8px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,.08)",
                  overflow: "hidden",
                  marginBottom: ".75rem",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #4cc9ec, #f7b56b)",
                    transition: prefs.rm ? "none" : "width .12s ease-out",
                  }}
                />
              </div>
              <canvas
                role="img"
                ref={pb.cv}
                width={560}
                height={110}
                aria-label={d.waveLabel}
                style={{ width: "100%", height: "110px", display: "block", borderRadius: "8px", background: "#05060b" }}
              />
            </div>
          )}

          {/* Captions & Transcript */}
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>{d.tCaptions}</h3>
            <p style={{ fontFamily: "ui-monospace, monospace", fontSize: ".95rem" }}>
              {ended ? d.ended : cur && (pb.playing || log.length > 0) ? describeDay(cur) : d.noAudio}
            </p>
            <div role="status" aria-live="polite" className="sr">{srLive}</div>

            {prefs.captions && !prefs.simple && (
              <details open={prefs.detailed}>
                <summary>{d.transcript} ({log.length})</summary>
                {log.length === 0 ? (
                  <p className="mut">{d.noTranscript}</p>
                ) : (
                  <div className="scroll" style={{ maxHeight: "180px", padding: ".5rem" }}>
                    <ol style={{ margin: 0, paddingLeft: "1.25rem" }}>
                      {log.map((line, i) => <li key={i} className="mono" style={{ fontSize: ".85rem" }}>{line}</li>)}
                    </ol>
                  </div>
                )}
              </details>
            )}
          </div>

          {/* Mapping, Table & References */}
          <Det summary={d.tMap}>
            <p>{d.oMapText}</p>
            <p>{d.oBoxNote}</p>
            <p>{d.speedNote}</p>
          </Det>

          <Det summary={`${d.showTable} (${days.length})`}>
            <div className="scroll">
              <table>
                <caption className="sr">{d.dsOceans}</caption>
                <thead>
                  <tr>
                    <th scope="col">{d.oDate}</th>
                    <th scope="col">{d.oMean}</th>
                    <th scope="col">{d.oMin}</th>
                    <th scope="col">{d.oMax}</th>
                    <th scope="col">{d.oSamples}</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day.date}>
                      <td>{day.date}</td>
                      <td>{fmt(day.sstMean)}</td>
                      <td>{fmt(day.sstMin, 2)}</td>
                      <td>{fmt(day.sstMax, 2)}</td>
                      <td>{day.samples}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Det>

          <Det summary={d.tRefs}>
            <ul>
              <li>
                <a href="https://svs.gsfc.nasa.gov/5101/" target="_blank" rel="noopener">
                  NASA SVS 5101 — Sea Surface Temperature (SST) - Near Real Time <Icon name="external" size={12} />
                </a>
                {svs?.credits && <span lang="en"> · {svs.credits}</span>}
              </li>
              <li>
                <a href="https://coastwatch.noaa.gov/erddap/griddap/noaacwBLENDEDCsstDaily.html" target="_blank" rel="noopener">
                  NOAA NESDIS CoastWatch ERDDAP — Geo-Polar Blended SST 5km NRT (noaacwBLENDEDCsstDaily) <Icon name="external" size={12} />
                </a>
              </li>
            </ul>
            <p className="mut">{d.limitsText}</p>
          </Det>

          <div className="row" style={{ marginTop: "1rem" }}>
            <Link className="btn" href="/data?ds=oceans">
              <Icon name="data" size={16} /> {d.openData}
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
