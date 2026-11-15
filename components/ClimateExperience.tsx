"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CreditGroup } from "../lib/nasa/svs";
import type { Row } from "../lib/gistemp";
import { climateFreq } from "../lib/audio/mapping";
import { indexFor } from "../lib/data/select";
import { useApp, getJson, type Fail } from "./AppProvider";
import { usePlayback } from "./usePlayback";
import SpiralChart from "./SpiralChart";
import LineChart from "./LineChart";
import ErrBox from "./ErrBox";
import Det from "./Det";
import PlayerTransport from "./PlayerTransport";
import { Icon } from "./Icons";

type Meta = { creditGroups?: CreditGroup[]; id: number; page: string; title: string | null; description: string | null; credits: string | null; video: string | null; image: string | null };
const strip = (s: string | null) => (s ?? "").replace(/<[^>]+>/g, "");
const protoRelative = (u: string) => u.replace(/^https?:/i, "");
const proxied = (u: string) => `/api/nasa/media?u=${encodeURIComponent(u)}`;

export default function ClimateExperience() {
  const { lang, d, prefs, data, dataErr, loadData } = useApp();
  const [svsId, setSvsId] = useState(5190), [meta, setMeta] = useState<Meta | null>(null), [metaErr, setMetaErr] = useState<Fail | null>(null);
  const [y1, setY1] = useState(0), [y2, setY2] = useState(0), [live, setLive] = useState(""), [tr, setTr] = useState<string[]>([]), [vspeed, setVspeed] = useState(0.5);
  const [mediaErr, setMediaErr] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const nf = (v: number) => v.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const mname = (m: number) => new Date(2000, m - 1, 1).toLocaleString(lang, { month: "long" });
  const loadMeta = (id: number) => { setMetaErr(null); setMeta(null); setMediaErr(false); getJson<Meta>(`/api/nasa/climate-spiral?id=${id}`).then(setMeta).catch(setMetaErr); };
  useEffect(() => { loadMeta(svsId); }, [svsId]);
  useEffect(() => { if (video.current) video.current.playbackRate = vspeed; }, [vspeed, meta]);

  const all = useMemo(() => (data ? data.rows.filter((r) => svsId !== 5057 || r.year <= 2022) : []), [data, svsId]);
  useEffect(() => { if (all.length) { setY1(all[0].year); setY2(all[all.length - 1].year); } }, [all]);
  const sel = useMemo(() => all.filter((r) => r.year >= y1 && r.year <= y2), [all, y1, y2]);
  const evt = (r: Row) => d.event(mname(r.month), r.year, nf(r.anomaly), (climateFreq(r.anomaly) ?? 0).toFixed(1), r.anomaly > 0 ? d.above : r.anomaly < 0 ? d.below : d.ref);

  const pb = usePlayback<Row>(sel, {
    note: (r, sp, e) => { const f = climateFreq(r.anomaly); if (f !== null) e.note(f, 0.135 / sp); },
    step: (r) => { setTr((t) => [...t.slice(-199), evt(r)]); if (prefs.verbose || r.month === 1) setLive(d.yearAnn(r.year, mname(r.month), nf(r.anomaly))); },
    end: () => setLive(d.ended),
  }, prefs.rm);
  useEffect(() => { setTr([]); }, [sel]);
  const cur = sel[Math.min(pb.idx, sel.length - 1)], freq = cur ? climateFreq(cur.anomaly) : null;
  const fr = sel.map((r) => climateFreq(r.anomaly)).filter((v): v is number => v !== null), fmin = Math.min(...fr), fmax = Math.max(...fr);
  const pos = freq === null ? 0.5 : (freq - fmin) / (fmax - fmin || 1);
  const mn = sel.length ? Math.min(...sel.map((r) => r.anomaly)) : 0, mx = sel.length ? Math.max(...sel.map((r) => r.anomaly)) : 1, avg = sel.length ? sel.reduce((s, r) => s + r.anomaly, 0) / sel.length : 0;
  const desc = sel.length ? d.chartDesc(sel[0].year, sel[sel.length - 1].year, nf(mn), nf(mx), nf(avg)) : "";
  const years = useMemo(() => [...new Set(sel.map((r) => r.year))], [sel]);
  const goTo = (year: number, month: number) => {
    const k = indexFor(sel, year, month); if (k < 0) { setLive(d.noRecord); return; } pb.seek(k); const r = sel[k];
    setLive(d.selected(mname(r.month), r.year, nf(r.anomaly), (climateFreq(r.anomaly) ?? 0).toFixed(1)));
  };

  return (
    <article>
      <Link className="back" href="/experiences">← {d.back}</Link>
      <p className="eyebrow">{d.expTitles.climate} · GISTEMP v4</p>
      <h1>{d.expTitles.climate}</h1>
      <p className="lead">{d.exWhat}</p>
      <p>{d.climIntro}</p>
      <div className="pill-row" style={{ marginBottom: "2rem" }}>
        <span className="chip cool">NASA GISS</span>
        <span className="chip">SVS {svsId}</span>
        <span className="chip">{d.unit}: °C</span>
      </div>



      <section id="experience-studio" className="card studio-filters" aria-labelledby="c3">
        <div className="section-head" style={{ marginBottom: "1rem" }}>
          <div><p className="eyebrow">{d.period}</p><h2 id="c3" style={{ margin: 0 }}>{d.s2}</h2></div>
          {data && sel.length > 0 && <div className="row">
          <label style={{ minWidth: 190 }}>{d.variant}
            <select value={svsId} onChange={(e) => setSvsId(+e.target.value)}>
              <option value={5057}>SVS 5057 (1880–2022)</option>
              <option value={5190}>SVS 5190</option>
            </select>
          </label>
            <label>{d.startYear}<input type="number" value={y1} min={all[0].year} max={y2} onChange={(e) => setY1(Math.min(Math.max(+e.target.value || all[0].year, all[0].year), y2))} /></label>
            <label>{d.endYear}<input type="number" value={y2} min={y1} max={all[all.length - 1].year} onChange={(e) => setY2(Math.max(Math.min(+e.target.value || y2, all[all.length - 1].year), y1))} /></label>
          </div>}
        </div>
        {all.length > 0 && <div className="period-presets" role="group" aria-label={lang === "pt-BR" ? "Atalhos de período" : "Period shortcuts"}>{[0, 30, 10].map((n) => {
          const start = n ? Math.max(all[0].year, all[all.length - 1].year - n + 1) : all[0].year;
          const end = all[all.length - 1].year;
          return <button key={n} aria-pressed={y1 === start && y2 === end} onClick={() => { setY1(start); setY2(end); }}>{n ? (lang === "pt-BR" ? `Últimos ${n} anos` : `Last ${n} years`) : (lang === "pt-BR" ? "Todo o período" : "Full record")}</button>;
        })}</div>}
        {!data && !dataErr && <p role="status">{d.loading}</p>}
        {dataErr && <ErrBox d={d} f={dataErr} msg={d.failData} retry={() => loadData()} />}
      </section>

      {data && sel.length > 0 && cur && <section className="card" aria-labelledby="c4">
        <h2 id="c4" className="sr">{d.s3}</h2>
        <div className="studio-summary"><div><span>{d.period}</span><strong>{y1}–{y2}</strong></div><div><span>{d.statMonths}</span><strong>{sel.length.toLocaleString(lang)}</strong></div><div><span>{lang === "pt-BR" ? "Menor anomalia" : "Lowest anomaly"}</span><strong>{nf(mn)} °C</strong></div><div><span>{lang === "pt-BR" ? "Maior anomalia" : "Highest anomaly"}</span><strong>{nf(mx)} °C</strong></div></div>
        <div className="player">
          <div className="player-top">
            <div className="player-readout">
              <p className="eyebrow" style={{ margin: 0 }}>{d.s3}</p>
              <span className="when">{mname(cur.month)} <span>{cur.year}</span></span>
              <div className="player-chips">
                <span className="chip warm">{cur.anomaly > 0 ? "+" : ""}{nf(cur.anomaly)} °C</span>
                {freq !== null && <span className="chip cool">{freq.toFixed(1)} {d.hz}</span>}
                <span className="chip">{sel.length} {d.statMonths}</span>
              </div>
            </div>
          </div>
          <PlayerTransport pb={pb} count={sel.length} current={`${mname(cur.month)} ${cur.year}`} onReset={() => setTr([])} onPause={() => setLive(`${d.paused}: ${mname(cur.month)} ${cur.year}, ${nf(cur.anomaly)} °C.`)} />
          <p className="sr" role="status" aria-live="polite">{live}</p>
          <p className="player-note">{d.speedNote} {d.noAudio}</p>

          <div className="viz-split">
            <div>
              <SpiralChart rows={sel} idx={pb.idx} label={d.spiralLabel} desc={d.spiralDesc} ring="0 °C" />
              <p className="mut" style={{ fontSize: ".8rem" }}>{d.derived}</p>
            </div>
            <div className="viz-side">
              {!prefs.simple && <>
                <LineChart rows={sel} idx={pb.idx} desc={desc} onSelect={(i) => pb.seek(i)} />
                <p className="query-source">{lang === "pt-BR" ? "Clique em um mês no gráfico ou use a linha do tempo para navegar pelo teclado." : "Click a month in the chart or use the timeline to navigate with the keyboard."}</p>
                <p className="mut" style={{ fontSize: ".8rem", margin: 0 }}>{desc}</p>
              </>}
              <div className="wave">
                <p className="eyebrow" style={{ marginBottom: ".5rem" }}>{d.seeSound}</p>
                <canvas ref={pb.cv} width={1000} height={210} role="img" aria-label={d.waveLabel} />
              </div>
            </div>
          </div>

          {prefs.visual && freq !== null && <div aria-hidden="true">
            <div className="bar"><div style={{ width: `${pos * 100}%` }} /></div>
            <p className="big" style={{ marginTop: ".5rem" }}>{freq.toFixed(0)} {d.hz} · {pos < 0.34 ? d.pitchLow : pos < 0.67 ? d.pitchMid : d.pitchHigh}</p>
          </div>}

          {!prefs.simple && <Det summary={d.soundSettings}>
            <div className="row">
              <label>{d.year}<select value={cur.year} onChange={(e) => goTo(+e.target.value, cur.month)}>{years.map((y) => <option key={y}>{y}</option>)}</select></label>
              <label>{d.month}<select value={cur.month} onChange={(e) => goTo(cur.year, +e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{mname(i + 1)}</option>)}</select></label>
              <button onClick={() => pb.hearOne(pb.idx)}><Icon name="sound" size={16} /> {d.hearMonth}</button>
            </div>
          </Det>}
        </div>
      </section>}

      {prefs.captions && data && cur && <section className="card" aria-labelledby="c5">
        <p className="eyebrow">{d.catHearing}</p>
        <h2 id="c5" style={{ marginBottom: ".6rem" }}>{d.tCaptions}</h2>
        <p className="cap" aria-hidden="true">{evt(cur)}</p>
        <Det summary={d.transcript}>{tr.length ? <ol className="tr">{tr.map((t, i) => <li key={i}>{t}</li>)}</ol> : <p>{d.noTranscript}</p>}</Det>
      </section>}

      <section className="card" aria-labelledby="c1">
        <div className="section-head" style={{ marginBottom: "1.2rem" }}>
          <div>
            <p className="eyebrow">NASA SVS</p>
            <h2 id="c1" style={{ margin: 0 }}>{d.s1}</h2>
          </div>

        </div>
        <p className="mut" style={{ fontSize: ".88rem" }}>{svsId === 5057 ? d.clipped : d.ver5190}</p>
        {!meta && !metaErr && <p role="status">{d.loading}</p>}
        {metaErr && <ErrBox d={d} f={metaErr} msg={d.failSvs} retry={() => loadMeta(svsId)} />}
        {meta && <>
          <div className="media">
            {meta.video && !mediaErr ? (
              <video
                key={meta.video}
                ref={video}
                controls
                preload="none"
                playsInline
                poster={meta.image ? proxied(meta.image) : undefined}
                src={protoRelative(meta.video)}
                aria-label={meta.title ?? d.expTitles.climate}
                onError={() => setMediaErr(true)}
                onLoadedMetadata={() => { if (video.current) video.current.playbackRate = vspeed; }}
              />
            ) : meta.image ? (
              <img src={proxied(meta.image)} alt={meta.title ?? d.expTitles.climate} />
            ) : (
              <div className="media-empty"><Icon name="globe" size={30} /><span>{d.videoMissing}</span></div>
            )}
            <span className="media-tag">NASA SVS {meta.id}</span>
          </div>
          {meta.video && !mediaErr && (
            <label style={{ maxWidth: 220, marginTop: ".8rem" }}>{d.videoSpeed}
              <select value={vspeed} onChange={(e) => setVspeed(+e.target.value)}>{[0.5, 0.75, 1, 1.5, 2].map((s) => <option key={s} value={s}>{s}x</option>)}</select>
            </label>
          )}
          <p style={{ marginTop: "1rem", marginBottom: 0 }}><strong>{meta.title}</strong>{" · "}<a href={meta.page} target="_blank" rel="noopener">NASA SVS {meta.id} <Icon name="external" size={12} style={{ display: "inline", verticalAlign: "-1px" }} /></a></p>
          <Det summary={d.readMore}>
            {meta.description && <><p className="mut">{lang === "pt-BR" ? "Descrição original da NASA (em inglês)" : "Original NASA description"}</p><p lang="en" style={{ whiteSpace: "pre-line" }}>{strip(meta.description)}</p></>}
            {meta.creditGroups?.length ? <dl className="source-credits">{meta.creditGroups.map((group, i) => <div key={i}>
              <dt>{lang === "pt-BR" ? ({ Visualizer: "Visualização", "Technical support": "Apoio técnico", "Web administrator": "Administração do site" } as Record<string, string>)[group.role] ?? <span lang="en">{group.role}</span> : group.role}</dt>
              <dd>{group.people.map((person, k) => <span key={k} lang="en">{k > 0 ? "; " : ""}{person.name}{person.employer ? ` (${person.employer})` : ""}</span>)}</dd>
            </div>)}</dl> : meta.credits && <p lang="en">{strip(meta.credits)}</p>}
          </Det>
        </>}
      </section>

      <section className="card" aria-labelledby="c2">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ maxWidth: "62ch" }}>
            <p className="eyebrow">NASA GISTEMP</p>
            <h2 id="c2" style={{ marginBottom: ".4rem" }}>{d.tData}</h2>
            <p>{d.anomalyNote}</p>
            <p className="mut" style={{ marginBottom: 0 }}>{d.dataSplit}</p>
          </div>
          <Link className="btn" href="/data"><Icon name="data" size={16} /> {d.openData}</Link>
        </div>
        {data?.fallback && <p role="status" className="warn">{d.apiFallback}</p>}
        {data && <div className="pill-row" style={{ marginTop: "1.1rem" }}><span className="chip">{data.dataset}</span><span className="chip">{data.units}</span><span className="chip">{data.baseline}</span><span className="chip">{data.firstYear}–{data.lastYear}</span></div>}
      </section>

      <section className="card" aria-labelledby="c6">
        <p className="eyebrow">{d.how}</p>
        <h2 id="c6">{d.tMap}</h2>
        <p style={{ marginBottom: 0 }}>{d.howText}</p>
      </section>

      <section className="card" aria-labelledby="c7">
        <p className="eyebrow">{d.sources}</p>
        <h2 id="c7">{d.tRefs}</h2>
        <p>{d.limitsText}</p>
        <ul>
          <li><a href={`https://svs.gsfc.nasa.gov/${svsId}/`} target="_blank" rel="noopener">NASA SVS {svsId}</a> (NASA Scientific Visualization Studio)</li>
          <li><a href="https://data.giss.nasa.gov/gistemp/" target="_blank" rel="noopener">NASA GISS GISTEMP v4</a></li>
        </ul>
        {data && <p className="player-note" style={{ marginBottom: 0 }}>{d.stored}: {new Date(data.fetchedAt).toLocaleString(lang)}. {d.staleNote}</p>}
      </section>
    </article>
  );
}
