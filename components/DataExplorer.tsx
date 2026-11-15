"use client";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "./AppProvider";
import LineChart from "./LineChart";
import FiresChart from "./FiresChart";
import OceansChart from "./OceansChart";
import ErrBox from "./ErrBox";
import { FiresControls, useFires } from "./FiresControls";
import OceansControls, { useOceans } from "./OceansControls";
import { Icon } from "./Icons";

function save(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function DataExplorer() {
  const { lang, d, data, dataErr, loadData } = useApp();
  const [ds, setDs] = useState<"climate" | "fires" | "oceans">("climate"), [y1, setY1] = useState(0), [y2, setY2] = useState(0), [tbl, setTbl] = useState(false);
  const f = useFires();
  const o = useOceans(ds === "oceans");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("ds");
    if (q === "fires" || q === "oceans" || q === "climate") setDs(q);
  }, []);
  const nf = (v: number, n = 2) => v.toLocaleString(lang, { minimumFractionDigits: n, maximumFractionDigits: n });
  useEffect(() => { if (data) { setY1(data.firstYear); setY2(data.lastYear); } }, [data]);
  const sel = useMemo(() => (data ? data.rows.filter((r) => r.year >= y1 && r.year <= y2) : []), [data, y1, y2]);
  const mn = sel.length ? Math.min(...sel.map((r) => r.anomaly)) : 0, mx = sel.length ? Math.max(...sel.map((r) => r.anomaly)) : 0, avg = sel.length ? sel.reduce((s, r) => s + r.anomaly, 0) / sel.length : 0;
  const desc = sel.length ? d.chartDesc(sel[0].year, sel[sel.length - 1].year, nf(mn), nf(mx), nf(avg)) : "";

  return (
    <>
      <p className="eyebrow">{d.navData}</p>
      <h1>{d.dataTitle}</h1>
      <p className="lead">{d.dataSub}</p>

      <div className="row" style={{ margin: "1.8rem 0 1rem" }}>
        <div className="seg" role="group" aria-label={d.dataPick}>
          <button aria-pressed={ds === "climate"} onClick={() => setDs("climate")}>{d.dsClimate}</button>
          <button aria-pressed={ds === "fires"} onClick={() => setDs("fires")}>{d.dsFires}</button>
          <button aria-pressed={ds === "oceans"} onClick={() => setDs("oceans")}>{d.dsOceans}</button>
        </div>
      </div>

      {ds === "climate" && <section className="card" aria-labelledby="dc">
        <div className="section-head" style={{ marginBottom: "1rem" }}>
          <div><p className="eyebrow">NASA GISS</p><h2 id="dc" style={{ margin: 0 }}>{d.dsClimate}</h2></div>
          {data && <span className={`badge${data.origin === "local" ? " is-ok" : ""}`}>{data.origin === "local" ? d.originLocal : d.originRemote}</span>}
        </div>
        {!data && !dataErr && <p role="status">{d.loading}</p>}
        {dataErr && <ErrBox d={d} f={dataErr} msg={d.failData} retry={() => loadData()} />}
        {data && <>
          <div className="pill-row" style={{ marginTop: 0 }}>
            <span className="chip">{data.dataset}</span>
            <span className="chip">{d.unit}: {data.units}</span>
            <span className="chip">{data.baseline}</span>
            <span className="chip">{d.stored}: {new Date(data.fetchedAt).toLocaleDateString(lang)}</span>
            {data.sha256 && <span className="chip mono" title={data.sha256}>{d.sha}: {data.sha256.slice(0, 12)}…</span>}
          </div>
          <p className="mut" style={{ fontSize: ".85rem" }}>{d.staleNote} <a href={data.source} target="_blank" rel="noopener">{d.source} <Icon name="external" size={11} style={{ display: "inline", verticalAlign: "-1px" }} /></a></p>
          <p style={{ fontSize: ".9rem" }}><strong>{d.missingT}:</strong>{" "}
            {data.skippedMissing === 0 ? d.noneMissing : `${data.skippedMissing} (${(data.missing ?? []).slice(0, 24).map((m) => `${m.year}-${String(m.month).padStart(2, "0")}`).join(", ")}${data.skippedMissing > 24 ? "…" : ""})`}
          </p>

          <div className="row" style={{ margin: "1rem 0" }}>
            <label>{d.startYear}<input type="number" value={y1} min={data.firstYear} max={y2} onChange={(e) => setY1(Math.min(Math.max(+e.target.value || data.firstYear, data.firstYear), y2))} /></label>
            <label>{d.endYear}<input type="number" value={y2} min={y1} max={data.lastYear} onChange={(e) => setY2(Math.max(Math.min(+e.target.value || y2, data.lastYear), y1))} /></label>
          </div>

          {sel.length > 0 && <>
            <div className="pill-row" style={{ marginTop: 0 }}>
              <span className="chip cool">{sel.length} {d.statMonths}</span>
              <span className="chip">min {nf(mn)} °C</span>
              <span className="chip">max {nf(mx)} °C</span>
              <span className="chip warm">{d.mean12}: {nf(avg)} °C</span>
            </div>
            <LineChart rows={sel} desc={desc} />
            <p className="mut" style={{ fontSize: ".8rem" }}>{desc}</p>
          </>}

          <p className="mut" style={{ fontSize: ".85rem" }}>{d.procText}</p>
          <div className="row" style={{ marginTop: "1rem" }}>
            <button onClick={() => save("gistemp_selected.csv", "year,month,anomaly_c,source_dataset,baseline_period\n" + sel.map((r) => `${r.year},${r.month},${r.anomaly},GISTEMP v4,1951-1980`).join("\n"))}><Icon name="download" size={16} /> {d.download}</button>
            {data.origin === "local" && <a className="btn" href="/data/climate/gistemp_monthly.csv" download><Icon name="download" size={16} /> {d.downloadOrig}</a>}
            <button onClick={() => loadData(true)}><Icon name="restart" size={16} /> {d.checkNasa}</button>
          </div>
          <p className="player-note">{d.derivedNote}</p>

          <details onToggle={(e) => setTbl((e.target as HTMLDetailsElement).open)}>
            <summary>{d.showTable} ({sel.length})</summary>
            {tbl && <div className="scroll">
              <table>
                <caption className="sr">{d.dsClimate}</caption>
                <thead><tr><th scope="col">{d.year}</th><th scope="col">{d.month}</th><th scope="col">°C</th></tr></thead>
                <tbody>{sel.map((r) => <tr key={r.year * 12 + r.month}><td>{r.year}</td><td>{new Date(2000, r.month - 1, 1).toLocaleString(lang, { month: "long" })}</td><td>{nf(r.anomaly)}</td></tr>)}</tbody>
              </table>
            </div>}
          </details>
        </>}
      </section>}

      {ds === "fires" && <section className="card" aria-labelledby="df">
        <div className="section-head" style={{ marginBottom: "1rem" }}>
          <div><p className="eyebrow">NASA FIRMS · VIIRS</p><h2 id="df" style={{ margin: 0 }}>{d.dsFires}</h2></div>
        </div>
        <FiresControls f={f} />
        {f.err?.missingKey && <p className="warn" role="alert">{d.fNeedKey}</p>}
        {f.err && !f.err.missingKey && <p className="warn" role="alert">{d.failData}</p>}
        {f.data && <div className="pill-row">
          <span className="chip">{d.fCollected}: {new Date(f.data.collectedAt).toLocaleString(lang)}</span>
          <span className="chip">{f.data.products.join(", ")}</span>
          <span className="chip">{f.data.start} → {f.data.end}</span>
          <span className="chip warm">{f.data.detections.toLocaleString(lang)} {d.fCount.toLowerCase()}</span>
        </div>}
        {f.data && (f.data.days.length === 0 ? <p>{d.fNoData}</p> : <>
          <FiresChart days={f.data.days} desc={d.fDesc(f.data.days[0].date, f.data.days[f.data.days.length - 1].date, f.data.days.reduce((s, x) => s + x.count, 0), "", 0)} />
          <p className="mut" style={{ fontSize: ".85rem" }}>{d.procText}</p>
          <div className="row">
            <button onClick={() => save("firms_daily.csv", "date,detections,frp_mean_mw,frp_sum_mw\n" + f.data!.days.map((x) => `${x.date},${x.count},${x.frpMean},${x.frpSum}`).join("\n"))}><Icon name="download" size={16} /> {d.download}</button>
          </div>
          <p className="player-note">{d.derivedNote}</p>
          <div className="scroll" style={{ marginTop: "1rem" }}>
            <table>
              <caption className="sr">{d.dsFires}</caption>
              <thead><tr><th scope="col">{d.fEnd}</th><th scope="col">{d.fCount}</th><th scope="col">{d.fFrp}</th><th scope="col">{d.fFrpSum}</th></tr></thead>
              <tbody>{f.data.days.map((x) => <tr key={x.date}><td>{x.date}</td><td>{x.count}</td><td>{nf(x.frpMean, 1)}</td><td>{nf(x.frpSum, 1)}</td></tr>)}</tbody>
            </table>
          </div>
        </>)}
      </section>}

      {ds === "oceans" && <section className="card" aria-labelledby="do">
        <div className="section-head" style={{ marginBottom: "1rem" }}>
          <div><p className="eyebrow">NASA SVS 5101 · NOAA CoastWatch ERDDAP</p><h2 id="do" style={{ margin: 0 }}>{d.dsOceans}</h2></div>
          {o.data && <span className="badge is-ok">{d.available}</span>}
        </div>
        <OceansControls o={o} />
        {o.busy && !o.data && <p role="status">{d.loading}</p>}
        {o.err && <ErrBox d={d} f={o.err} msg={d.oFailData} retry={o.load} />}
        {o.data && <div className="pill-row">
          <span className="chip">{d.fCollected}: {new Date(o.data.collectedAt).toLocaleString(lang)}</span>
          <span className="chip">{o.data.dataset}</span>
          <span className="chip">{d.unit}: {o.data.unit}</span>
          <span className="chip">{d.oGridStep}: {o.data.gridStepDeg}°</span>
          <span className="chip">{o.data.start} → {o.data.end}</span>
          <span className="chip cool">{o.data.samples.toLocaleString(lang)} {d.oSamples.toLowerCase()}</span>
          <span className="chip">{o.data.skipped.toLocaleString(lang)} {d.oSkipped}</span>
        </div>}
        {o.data && (o.data.days.length === 0 ? <p>{d.oNoData}</p> : <>
          {(() => {
            const vals = o.data.days.map((x) => x.sstMean);
            const omn = Math.min(...vals), omx = Math.max(...vals), oavg = vals.reduce((s, v) => s + v, 0) / vals.length;
            const odesc = d.oDesc(o.data.days[0].date, o.data.days[o.data.days.length - 1].date, nf(omn), nf(omx), nf(oavg), o.data.days.length);
            return <OceansChart days={o.data.days} desc={odesc} />;
          })()}
          <p className="mut" style={{ fontSize: ".85rem" }}>{d.procText} {d.oBoxNote}</p>
          <div className="row">
            <button onClick={() => save(`coastwatch_sst_${o.data!.basin}.csv`, "date,basin,sst_mean_c,sst_min_c,sst_max_c,samples,source\n" + o.data!.days.map((x) => `${x.date},${o.data!.basin},${x.sstMean.toFixed(4)},${x.sstMin.toFixed(4)},${x.sstMax.toFixed(4)},${x.samples},NOAA_CoastWatch_noaacwBLENDEDCsstDaily`).join("\n"))}><Icon name="download" size={16} /> {d.download}</button>
          </div>
          <p className="player-note">{d.derivedNote}</p>
          <div className="scroll" style={{ marginTop: "1rem" }}>
            <table>
              <caption className="sr">{d.dsOceans}</caption>
              <thead><tr><th scope="col">{d.oDate}</th><th scope="col">{d.oMean}</th><th scope="col">{d.oMin}</th><th scope="col">{d.oMax}</th><th scope="col">{d.oSamples}</th></tr></thead>
              <tbody>{o.data.days.map((x) => <tr key={x.date}><td>{x.date}</td><td>{nf(x.sstMean)}</td><td>{nf(x.sstMin)}</td><td>{nf(x.sstMax)}</td><td>{x.samples}</td></tr>)}</tbody>
            </table>
          </div>
        </>)}
      </section>}
    </>
  );
}
