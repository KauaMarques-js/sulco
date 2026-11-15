"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { rolling, type Day } from "../lib/firms";
import { numFmt } from "../lib/format";
import { useApp } from "./AppProvider";
import { usePlayback } from "./usePlayback";
import { FiresControls, useFires } from "./FiresControls";
import FiresChart from "./FiresChart";
import Det from "./Det";
import { Icon } from "./Icons";

type Item = Day & { f: number; pulses: number };

export default function FiresExperience() {
  const { lang, d, prefs } = useApp();
  const f = useFires();
  const [roll, setRoll] = useState(true), [live, setLive] = useState(""), [tr, setTr] = useState<string[]>([]);
  const nf = (v: number, n = 1) => numFmt(lang, 0, n).format(v);

  const items = useMemo<Item[]>(() => {
    if (!f.data || !f.data.days.length) return [];
    const days = roll ? rolling(f.data.days, 5) : f.data.days, fr = days.map((x) => x.frpMean).filter((v) => v > 0);
    if (!fr.length) return [];
    const lo = Math.log(Math.min(...fr)), hi = Math.log(Math.max(...fr)), mc = Math.max(...days.map((x) => x.count));
    return days.map((x) => ({ ...x, f: 220 * Math.pow(2, 2 * ((Math.log(Math.max(x.frpMean, 1e-6)) - lo) / (hi - lo || 1))), pulses: 1 + Math.round((5 * x.count) / mc) }));
  }, [f.data, roll]);

  const evt = (x: Item) => d.fEvent(x.date, x.count, nf(x.frpMean), nf(x.f), x.pulses);
  const pb = usePlayback<Item>(items, {
    note: (x, sp, e) => { const step = 0.15 / sp; for (let i = 0; i < x.pulses; i++) e.note(x.f, 0.05 / sp, (i * step) / x.pulses); },
    step: (x) => { setTr((t) => [...t.slice(-99), evt(x)]); if (prefs.verbose) setLive(evt(x)); },
    end: () => setLive(d.ended),
  });

  const cur = items[Math.min(pb.idx, items.length - 1)];
  const peak = items.reduce((a, x) => (x.count > a.count ? x : a), items[0] ?? ({ date: "", count: 0 } as Item));
  const desc = items.length ? d.fDesc(items[0].date, items[items.length - 1].date, items.reduce((s, x) => s + x.count, 0), peak.date, peak.count) : "";

  return (
    <article>
      <Link className="back" href="/experiences">← {d.back}</Link>
      <p className="eyebrow">{d.expTitles.wildfires} · NASA FIRMS</p>
      <h1>{d.expTitles.wildfires}</h1>
      <p className="lead">{d.fIntro}</p>
      <p className="warn">{d.fValid}</p>

      <section className="card" aria-labelledby="f1">
        <div className="section-head" style={{ marginBottom: "1rem" }}>
          <div><p className="eyebrow">{d.s2}</p><h2 id="f1" style={{ margin: 0 }}>{d.s2}</h2></div>
        </div>
        <FiresControls f={f} />
        <label className="row" style={{ marginTop: "1rem", textTransform: "none", letterSpacing: 0, fontSize: ".9rem", color: "var(--tx-soft)" }}>
          <input type="checkbox" checked={roll} onChange={(e) => setRoll(e.target.checked)} /> {d.fRoll}
        </label>
        {f.err?.missingKey && <p className="warn" role="alert">{d.fNeedKey}</p>}
        {f.err && !f.err.missingKey && <p className="warn" role="alert">{d.failData}{f.err.detail && process.env.NODE_ENV !== "production" ? ` (${f.err.detail})` : ""}</p>}
        {f.data && <div className="pill-row" style={{ marginTop: "1rem" }}>
          <span className="chip">{d.fCollected}: {new Date(f.data.collectedAt).toLocaleString(lang)}</span>
          <span className="chip">{f.data.start} → {f.data.end}</span>
          <span className="chip warm">{f.data.detections.toLocaleString(lang)} {d.fCount.toLowerCase()}</span>
        </div>}
        {f.data && !items.length && <p>{d.fNoData}</p>}
      </section>

      {items.length > 0 && cur && <>
        <section className="card" aria-labelledby="f2">
          <h2 id="f2" className="sr">{d.s3}</h2>
          <div className="player">
            <div className="player-top">
              <div className="player-readout">
                <p className="eyebrow" style={{ margin: 0 }}>{d.s3}</p>
                <span className="when mono" style={{ fontSize: "clamp(1.3rem,3.4vw,1.9rem)" }}>{cur.date}</span>
                <div className="player-chips">
                  <span className="chip warm">{nf(cur.count, 0)} {d.fCount.toLowerCase()}</span>
                  <span className="chip">{nf(cur.frpMean)} MW</span>
                  <span className="chip cool">{nf(cur.f)} {d.hz}</span>
                </div>
              </div>
              <div className="player-controls">
                {pb.playing
                  ? <button className="pri" onClick={pb.pause}><Icon name="pause" size={16} /> {d.pause}</button>
                  : <button className="pri" onClick={() => pb.play()}><Icon name="play" size={16} /> {pb.paused() ? d.resume : d.play}</button>}
                <button className="icon-btn" onClick={() => { pb.stop(); setTr([]); }} aria-label={d.stop} title={d.stop}><Icon name="stop" size={16} /></button>
                <button className="icon-btn" onClick={() => { setTr([]); pb.restart(); }} aria-label={d.restart} title={d.restart}><Icon name="restart" size={16} /></button>
                <label>{d.sonSpeed}
                  <select value={pb.speed} onChange={(e) => pb.setSpeed(+e.target.value)}>{[0.5, 0.75, 1, 1.5, 2].map((s) => <option key={s} value={s}>{s}x</option>)}</select>
                </label>
                <label className="vol" style={{ flex: 1 }}>{d.volume}
                  <input type="range" min={0} max={100} value={pb.vol} onChange={(e) => pb.setVol(+e.target.value)} aria-valuetext={`${pb.vol}%`} />
                </label>
              </div>
            </div>
            <p className="sr" role="status" aria-live="polite">{live}</p>
            <progress value={pb.idx + 1} max={items.length} aria-label={d.now} />
            <p className="player-note">{d.noAudio}</p>

            <FiresChart days={items} idx={pb.idx} desc={desc} />
            <p className="mut" style={{ fontSize: ".8rem", margin: 0 }}>{desc}</p>

            <div>
              <p className="eyebrow" style={{ marginBottom: ".5rem" }}>{d.seeSound}</p>
              <canvas ref={pb.cv} width={1000} height={150} role="img" aria-label={d.waveLabel} />
            </div>

            {prefs.visual && <div aria-hidden="true">
              <div className="bar"><div style={{ width: `${Math.min(100, (cur.pulses / 6) * 100)}%` }} /></div>
              <p className="big" style={{ marginTop: ".5rem" }}>{cur.pulses} · {nf(cur.f)} {d.hz}</p>
            </div>}

            <Det summary={d.showTable}>
              <div className="scroll">
                <table>
                  <thead><tr><th scope="col">{d.fEnd}</th><th scope="col">{d.fCount}</th><th scope="col">{d.fFrp}</th><th scope="col">{d.fFrpSum}</th></tr></thead>
                  <tbody>{items.map((x) => <tr key={x.date}><td>{x.date}</td><td>{x.count}</td><td>{nf(x.frpMean)}</td><td>{nf(x.frpSum)}</td></tr>)}</tbody>
                </table>
              </div>
            </Det>
          </div>
        </section>

        {prefs.captions && <section className="card" aria-labelledby="f3">
          <p className="eyebrow">{d.catHearing}</p>
          <h2 id="f3" style={{ marginBottom: ".6rem" }}>{d.tCaptions}</h2>
          <p className="cap" aria-hidden="true">{evt(cur)}</p>
          <Det summary={d.transcript}>{tr.length ? <ol className="tr">{tr.map((t, i) => <li key={i}>{t}</li>)}</ol> : <p>{d.noTranscript}</p>}</Det>
        </section>}
      </>}

      <section className="card" aria-labelledby="f4">
        <p className="eyebrow">{d.how}</p>
        <h2 id="f4">{d.tMap}</h2>
        <p>{d.fMapText}</p>
        <p className="mut" style={{ marginBottom: 0 }}>{d.fBox}</p>
      </section>

      <section className="card" aria-labelledby="f5">
        <p className="eyebrow">{d.sources}</p>
        <h2 id="f5">{d.tRefs}</h2>
        <ul>
          <li><a href="https://svs.gsfc.nasa.gov/5113/" target="_blank" rel="noopener">NASA SVS 5113</a></li>
          <li><a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noopener">NASA FIRMS</a></li>
        </ul>
      </section>
    </article>
  );
}
