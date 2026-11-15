"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "./AppProvider";
import Badge from "./Badge";
import HomePlayer from "./HomePlayer";
import { Icon, type IconName } from "./Icons";
import { CATALOG, type Exp } from "../lib/eic/catalog";
import { CATS } from "../lib/eic/categories";
import type { Row } from "../lib/gistemp";

const ICON: Record<string, IconName> = {
  climate: "thermo",
  wildfires: "flame",
  oceans: "waves",
  air: "wind",
  ghg: "cloud",
  water: "drop",
  sealevel: "ruler",
  biodiversity: "leaf",
  energy: "bolt",
  disasters: "storm",
};
const HAS_PAGE = ["climate", "fires", "oceans"];
const DEVELOPERS = ["Arthur Loni", "Carlos Eduardo", "Kauan Marques", "Adrielly Andrade"];

const icon = (slug: string): IconName => ICON[slug] ?? "globe";

function ExpTile({ e }: { e: Exp }) {
  const { d } = useApp();
  const open = HAS_PAGE.includes(e.slug);
  const body = (
    <>
      <div className="viz">
        <Icon name={icon(e.key)} size={44} />
      </div>
      <Badge st={e.status} />
      <h3>{d.expTitles[e.key]}</h3>
      <p>{d.expDesc[e.key]}</p>
      <div className="tile-foot">
        {open ? <>{d.openExp} <Icon name="arrow" size={16} /></> : <span className="mut">{d.stValidating}</span>}
      </div>
    </>
  );
  return (
    <li>
      {open
        ? <Link className="card tile hoverable" href={`/experiences/${e.slug}`}>{body}</Link>
        : <div className="card tile dim">{body}</div>}
    </li>
  );
}

/** Yearly mean of the monthly series, drawn as a compact area chart. */
function MiniSeries({ rows }: { rows: Row[] }) {
  const points = useMemo(() => {
    const byYear = new Map<number, { sum: number; n: number }>();
    for (const r of rows) {
      const cur = byYear.get(r.year) ?? { sum: 0, n: 0 };
      cur.sum += r.anomaly; cur.n += 1; byYear.set(r.year, cur);
    }
    return [...byYear.entries()].map(([year, v]) => ({ year, a: v.sum / v.n }));
  }, [rows]);

  if (points.length < 2) return <div style={{ height: 190 }} aria-hidden="true" />;

  const W = 560, H = 190, P = 10, TOP = 16;
  const mn = Math.min(...points.map((p) => p.a)), mx = Math.max(...points.map((p) => p.a));
  const X = (i: number) => P + (i / (points.length - 1)) * (W - 2 * P);
  const Y = (a: number) => H - P - ((a - mn) / (mx - mn || 1)) * (H - 2 * P - TOP) - TOP / 2;
  const line = points.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(p.a).toFixed(1)}`).join(" ");
  const area = `${line} L${X(points.length - 1).toFixed(1)} ${H - P} L${X(0).toFixed(1)} ${H - P} Z`;
  const last = points[points.length - 1];
  const zeroY = mn < 0 && mx > 0 ? Y(0) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sparkline" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="mini-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fe7ff" stopOpacity=".34" />
          <stop offset="1" stopColor="#7fe7ff" stopOpacity="0" />
        </linearGradient>
        <filter id="mini-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={P} x2={W - P} y1={H - P - f * (H - 2 * P - TOP)} y2={H - P - f * (H - 2 * P - TOP)} stroke="rgba(255,255,255,.055)" strokeWidth="1" />)}
      {zeroY !== null && <line x1={P} x2={W - P} y1={zeroY} y2={zeroY} stroke="rgba(247,181,107,.5)" strokeDasharray="4 5" strokeWidth="1" />}
      <path d={area} fill="url(#mini-fill)" />
      <path d={line} className="series-line" fill="none" stroke="#7fe7ff" strokeWidth="2" strokeLinecap="round" />
      <circle cx={X(points.length - 1)} cy={Y(last.a)} r="4.5" fill="#f7b56b" stroke="#05060b" strokeWidth="2" filter="url(#mini-glow)" />
      <text x={P} y={H - P + 1} fill="#6b7690" fontSize="10" fontFamily="ui-monospace, monospace">{points[0].year}</text>
      <text x={W - P} y={H - P + 1} fill="#6b7690" fontSize="10" textAnchor="end" fontFamily="ui-monospace, monospace">{last.year}</text>
    </svg>
  );
}

export function Home() {
  const { d, data, lang } = useApp();
  const years = data ? `${data.firstYear}—${data.lastYear}` : "1880—2026";
  const months = data ? data.rows.length.toLocaleString(lang) : "1,762";
  const rows = data?.rows ?? [];
  const lastRows = rows.slice(-12);
  const lastMean = lastRows.length ? lastRows.reduce((s, r) => s + r.anomaly, 0) / lastRows.length : null;
  const lastYear = rows.length ? rows[rows.length - 1].year : null;

  return (
    <>
      <section className="hero reveal">
        <div className="hero-copy">
          <p className="challenge"><span className="dot" aria-hidden="true" /> {d.nasaChallenge}</p>
          <h1>{d.heroTitle1} <em className="grad">{d.heroTitle2}</em></h1>
          <p className="lead">{d.heroLead}</p>
          <div className="hero-cta">
            <Link className="btn pri big" href="/experiences/climate">
              <Icon name="play" size={16} /> {d.heroCta}
            </Link>
            <Link className="btn ghost big" href="/about">{d.howItWorks}</Link>
          </div>
          <dl className="stats">
            <div><dt>{d.statRecords}</dt><dd>{years}</dd></div>
            <div><dt>{d.statMonths}</dt><dd>{months}</dd></div>
            <div><dt>{d.statSources}</dt><dd>3</dd></div>
            <div><dt>{d.statA11y}</dt><dd>WCAG <span>AA</span></dd></div>
          </dl>
        </div>
        <HomePlayer />
      </section>

      <section className="section" aria-labelledby="featured">
        <div className="card featured reveal">
          <div className="featured-copy">
            <p className="eyebrow">{d.featuredKicker}</p>
            <h2 id="featured">{d.expTitles.climate}</h2>
            <p>{d.featuredBody}</p>
            <div className="pill-row">
              <span className="chip cool">GISTEMP v4</span>
              <span className="chip">{years}</span>
              <span className="chip warm">0 °C → 440 Hz</span>
            </div>
            <div className="row" style={{ marginTop: "1.5rem" }}>
              <Link className="btn pri" href="/experiences/climate">{d.openExp} <Icon name="arrow" size={16} /></Link>
              <Link className="btn ghost" href="/data">{d.navData}</Link>
            </div>
          </div>
          <div className="featured-viz">
            <div className="mini-label">
              <span>{d.tempAnomaly} · °C</span>
              <span>1880 — {lastYear ?? "2026"}</span>
            </div>
            <MiniSeries rows={rows} />
            <div className="readout">
              <strong className={lastMean !== null && lastMean > 0 ? "" : "mut"}>
                {lastMean === null ? "—" : `${lastMean > 0 ? "+" : ""}${lastMean.toFixed(2)}`}
              </strong>
              <span>°C · {d.mean12}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="experiences">
        <div className="section-head">
          <div>
            <p className="eyebrow">{d.previewTitle}</p>
            <h2 id="experiences">{d.expTitle}</h2>
            <p>{d.expSub}</p>
          </div>
          <Link className="btn ghost" href="/experiences">{d.exploreAll} <Icon name="arrow" size={16} /></Link>
        </div>
        <ul className="tiles">{CATALOG.map((e) => <ExpTile key={e.slug} e={e} />)}</ul>
      </section>

      <section className="section" aria-labelledby="how">
        <div className="section-head">
          <div>
            <p className="eyebrow">{d.howItWorks}</p>
            <h2 id="how">{d.howTitle}</h2>
            <p>{d.howIntro}</p>
          </div>
        </div>
        <ol className="steps">
          <li><strong>{d.step1T}</strong><p>{d.step1}</p></li>
          <li><strong>{d.step2T}</strong><p>{d.step2}</p></li>
          <li><strong>{d.step3T}</strong><p>{d.step3}</p></li>
        </ol>
      </section>

      <section className="section" aria-labelledby="cta">
        <div className="card" style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", alignItems: "center", padding: "clamp(1.5rem,4vw,2.4rem)" }}>
          <div>
            <p className="eyebrow">{d.dataTitle}</p>
            <h2 id="cta" style={{ marginBottom: ".4rem" }}>{d.ctaTitle}</h2>
            <p style={{ margin: 0 }}>{d.ctaText}</p>
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <Link className="btn pri big" href="/data">{d.ctaBtn} <Icon name="arrow" size={16} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}

export function Discover() {
  const { d } = useApp();
  return (
    <>
      <p className="eyebrow">{d.navDiscover}</p>
      <h1>{d.discoverTitle}</h1>
      <p className="lead">{d.discoverIntro}</p>
      <ul className="tiles" style={{ marginTop: "2rem" }}>
        {CATS.map((c) => (
          <li key={c.k}>
            <div className={`card tile hoverable${c.st === "soon" ? " dim" : ""}`} style={{ padding: 0, overflow: "hidden" }}>
              <div className="viz">
                <Icon name={icon(c.k)} size={44} />
              </div>
              <div className="body" style={{ padding: "1.1rem 1.2rem 1.3rem", display: "flex", flexDirection: "column", height: "100%" }}>
                <Badge st={c.st} />
                <h3 style={{ margin: 0 }}>{d.cats[c.k]}</h3>
                <p style={{ marginTop: ".45rem" }}>{d.catsDesc[c.k]}</p>
                {c.href && (
                  <div className="tile-foot">
                    <Link href={c.href} style={{ display: "inline-flex", alignItems: "center", gap: ".4rem" }}>{d.openExp} <Icon name="arrow" size={15} /></Link>
                  </div>
                )}
                {c.st !== "available" && (
                  <details style={{ marginTop: c.href ? ".3rem" : "auto" }}>
                    <summary>{d.learnMore}</summary>
                    <p style={{ fontSize: ".85rem", margin: 0 }}>{c.st === "validation" ? d.stValidMsg : d.stSoonMsg}</p>
                    {c.ref && <p style={{ fontSize: ".8rem", margin: ".5rem 0 0" }}>{d.svsRef}: <a href={`https://svs.gsfc.nasa.gov/${c.ref}/`} target="_blank" rel="noopener">SVS {c.ref}</a></p>}
                  </details>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Experiences() {
  const { d } = useApp();
  return (
    <>
      <p className="eyebrow">{d.navExp}</p>
      <h1>{d.expTitle}</h1>
      <p className="lead">{d.expSub}</p>
      <ul className="tiles" style={{ marginTop: "2rem" }}>{CATALOG.map((e) => <ExpTile key={e.slug} e={e} />)}</ul>
      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="note-grid">
          <div className="note"><h3>{d.officialViz}</h3><p>NASA SVS 5057 · 5190 · 5113</p></div>
          <div className="note"><h3>{d.tData}</h3><p>NASA GISS · GISTEMP v4 · NASA FIRMS</p></div>
          <div className="note"><h3>{d.how}</h3><p>{d.speedNote}</p></div>
        </div>
      </div>
    </>
  );
}

export function About() {
  const { d } = useApp();
  return (
    <>
      <article>
        <p className="eyebrow">{d.navAbout}</p>
        <h1>{d.aboutTitle}</h1>
        <p className="lead">{d.aboutText}</p>

        <div className="grid2" style={{ marginTop: "2rem" }}>
          <section className="card" aria-labelledby="son" style={{ margin: 0 }}>
            <h2 id="son">{d.sonifTitle}</h2>
            <p>{d.sonifText}</p>
            <p style={{ margin: 0 }} className="mut">{d.speedNote}</p>
          </section>
          <section className="card" aria-labelledby="method" style={{ margin: 0 }}>
            <h2 id="method">{d.how}</h2>
            <p>{d.howText}</p>
          </section>
        </div>

        <section className="section" aria-labelledby="hw">
          <div className="section-head">
            <div><p className="eyebrow">{d.howItWorks}</p><h2 id="hw">{d.howTitle}</h2></div>
          </div>
          <ol className="steps">
            <li><strong>{d.step1T}</strong><p>{d.step1}</p></li>
            <li><strong>{d.step2T}</strong><p>{d.step2}</p></li>
            <li><strong>{d.step3T}</strong><p>{d.step3}</p></li>
          </ol>
        </section>

        <section className="section" aria-labelledby="lc">
          <div className="section-head"><div><p className="eyebrow">{d.tRefs}</p><h2 id="lc">{d.aboutLimitsTitle}</h2></div></div>
          <div className="card">
            <p>{d.aboutLimits}</p>
            <p className="warn" style={{ marginBottom: 0 }}>{d.aboutDisclaimer}</p>
          </div>
        </section>

        <section className="section" aria-labelledby="devs">
          <div className="section-head">
            <div>
              <p className="eyebrow">{d.devsEyebrow}</p>
              <h2 id="devs">{d.devsTitle}</h2>
              <p>{d.devsIntro}</p>
            </div>
          </div>
          <ul className="grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {DEVELOPERS.map((name) => (
              <li key={name} className="card" style={{ margin: 0 }}>
                <strong style={{ display: "block", fontSize: "1.02rem", marginBottom: ".55rem" }}>{name}</strong>
                <span className="chip">{d.devsNationality}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section" aria-labelledby="sc">
          <div className="section-head"><div><p className="eyebrow">NASA</p><h2 id="sc">{d.sources}</h2></div></div>
          <ul className="sources">
            {CATALOG.map((e) => (
              <li key={e.slug}>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: ".4rem" }}>
                  <strong>{d.expTitles[e.key]}</strong><Badge st={e.status} />
                </div>
                <a href={e.url} target="_blank" rel="noopener">NASA SVS {e.svsId} <Icon name="external" size={12} style={{ display: "inline", verticalAlign: "-1px" }} /></a>
                {" · "}
                <a href={e.dataUrl} target="_blank" rel="noopener">{d.expMeta[e.key]?.source ?? e.dataSource} <Icon name="external" size={12} style={{ display: "inline", verticalAlign: "-1px" }} /></a>
                <div className="pill-row" style={{ marginTop: ".6rem" }}>
                  <span className="chip">{d.expMeta[e.key]?.variable ?? e.variable}</span>
                  <span className="chip">{d.expMeta[e.key]?.unit ?? e.unit}</span>
                  <span className="chip">{d.expMeta[e.key]?.period ?? e.period}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="mut" style={{ marginTop: "1.2rem", fontSize: ".85rem" }}>
            NASA Scientific Visualization Studio · NASA GISS · NASA FIRMS. {d.aboutDisclaimer}
          </p>
        </section>
      </article>
    </>
  );
}
