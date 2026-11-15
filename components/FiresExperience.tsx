"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { rolling, type Day } from "../lib/firms";
import { numFmt } from "../lib/format";
import { useApp } from "./AppProvider";
import { usePlayback } from "./usePlayback";
import { FiresControls, useFires } from "./FiresControls";
import FiresChart from "./FiresChart";
import Det from "./Det";
import PlayerTransport from "./PlayerTransport";
import FireMap from "./FireMap";
import { Icon } from "./Icons";

type Item = Day & { f: number; pulses: number };

export default function FiresExperience() {
  const { lang, d, prefs } = useApp();
  const f = useFires(true);
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
  }, prefs.rm);

  useEffect(() => { setTr([]); }, [items]);

  const cur = items[Math.min(pb.idx, items.length - 1)];
  const peak = items.reduce((a, x) => (x.count > a.count ? x : a), items[0] ?? ({ date: "", count: 0 } as Item));
  const desc = items.length ? (roll
    ? (lang === "pt-BR" ? `Janelas móveis de 5 dias terminando entre ${items[0].date} e ${items[items.length - 1].date}. Total de detecções no período consultado: ${f.data?.detections ?? 0}. Maior janela: ${peak.count}, terminando em ${peak.date}.` : `Rolling 5-day windows ending between ${items[0].date} and ${items[items.length - 1].date}. Total detections in the queried period: ${f.data?.detections ?? 0}. Largest window: ${peak.count}, ending ${peak.date}.`)
    : d.fDesc(items[0].date, items[items.length - 1].date, f.data?.detections ?? 0, peak.date, peak.count)) : "";

  const mapFrom = cur ? (roll ? new Date(Date.parse(cur.date + "T00:00:00Z") - 4 * 864e5).toISOString().slice(0, 10) : cur.date) : "";
  const mapCount = f.data?.days.filter((x) => x.date >= mapFrom && x.date <= (cur?.date ?? "")).reduce((sum, x) => sum + x.count, 0) ?? 0;
  return (
    <article>
      <Link className="back" href="/experiences">← {d.back}</Link>
      <p className="eyebrow">{d.expTitles.wildfires} · NASA FIRMS</p>
      <h1>{d.expTitles.wildfires}</h1>
      <p className="lead">{d.fIntro}</p>


      <section id="experience-studio" className="card studio-filters" aria-labelledby="f1">
        <div className="section-head" style={{ marginBottom: "1rem" }}>
          <div><p className="eyebrow">{d.s2}</p><h2 id="f1" style={{ margin: 0 }}>{d.s2}</h2></div>
        </div>
        <FiresControls f={f} />
        <label className="row" style={{ marginTop: "1rem", textTransform: "none", letterSpacing: 0, fontSize: ".9rem", color: "var(--tx-soft)" }}>
          <input type="checkbox" checked={roll} onChange={(e) => setRoll(e.target.checked)} /> {d.fRoll}
        </label>
        {f.err?.missingKey && <div className="setup-notice" role="alert"><Icon name="flame" size={26} /><div><h3>{lang === "pt-BR" ? "Conecte sua chave NASA FIRMS" : "Connect your NASA FIRMS key"}</h3><p>{d.fNeedKey}</p><a className="btn" href="https://firms.modaps.eosdis.nasa.gov/api/map_key/" target="_blank" rel="noopener noreferrer">{lang === "pt-BR" ? "Obter chave gratuita" : "Get a free key"} ↗</a></div></div>}
        {f.err && !f.err.missingKey && <p className="warn" role="alert">{d.failData}{f.err.detail && process.env.NODE_ENV !== "production" ? ` (${f.err.detail})` : ""}</p>}
        {f.data && <div className="pill-row" style={{ marginTop: "1rem" }}>
          <span className="chip">{d.fCollected}: {new Date(f.data.collectedAt).toLocaleString(lang)}</span>
          <span className="chip">{f.data.start} → {f.data.end}</span>
          <span className="chip warm">{f.data.detections.toLocaleString(lang)} {d.fCount.toLowerCase()}</span>
        </div>}
        {f.data && !items.length && <p>{d.fNoData}</p>}
      </section>

      {!f.data && !f.loading && !f.err && <div className="studio-empty"><Icon name="sound" size={32} /><h2>{lang === "pt-BR" ? "Sua próxima escuta começa aqui" : "Your next listening session starts here"}</h2><p>{lang === "pt-BR" ? "Escolha uma região, os satélites e o período acima. Depois, carregue os dados para explorar o som dos registros." : "Choose a region, satellites and a period above. Then load the data to explore the sound of the records."}</p></div>}
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
          </div>
          <PlayerTransport pb={pb} count={items.length} current={cur.date} onReset={() => setTr([])} />
            <p className="sr" role="status" aria-live="polite">{live}</p>
            <p className="player-note">{d.noAudio}</p>

            <FiresChart days={items} idx={pb.idx} desc={desc} onSelect={(i) => pb.seek(i)} />
            <p className="query-source">{lang === "pt-BR" ? "Clique em um dia no gráfico para mudar a seleção." : "Select a day in the chart to change the selection."}</p>
            {f.data?.points && <FireMap points={f.data.points} from={mapFrom} to={cur.date} total={mapCount} scope={`${f.data.area}-${f.data.collectedAt}`} />}
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
