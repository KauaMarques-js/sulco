"use client";
import { useEffect, useRef } from "react";
import { useApp } from "./AppProvider";
import { DEF, type Prefs } from "../lib/prefs";
import { Icon } from "./Icons";

type B = Exclude<keyof Prefs, "size">;

// <dialog>.showModal(): keeps focus inside, closes with Esc and restores focus to the opener.
export default function A11yDialog() {
  const { d, lang, prefs, setPrefs, a11yOpen, setA11yOpen } = useApp();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (a11yOpen && !el.open) el.showModal();
    if (!a11yOpen && el.open) el.close();
  }, [a11yOpen]);

  const sw = (k: B, label: string, help: string) => (
    <div className="swrow" key={k}>
      <div>
        <div id={`sw-${k}`} className="swl">{label}</div>
        <p id={`help-${k}`} className="swh">{help}</p>
      </div>
      <button role="switch" aria-checked={prefs[k]} aria-labelledby={`sw-${k}`} aria-describedby={`help-${k}`} className="switch" onClick={() => setPrefs({ ...prefs, [k]: !prefs[k] })}>
        {prefs[k] ? d.on : d.off}
      </button>
    </div>
  );
  const info = (t: string) => <p className="swh" style={{ padding: ".6rem 0", display: "flex", gap: ".5rem" }}><Icon name="info" size={15} /> <span>{t}</span></p>;

  return (
    <dialog ref={ref} className="dlg" aria-describedby="a11y-intro" aria-labelledby="a11y-t" onClose={() => setA11yOpen(false)} onClick={(e) => { if (e.target === ref.current) setA11yOpen(false); }}>
      <div className="dlgin">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: ".5rem" }}>SULCO</p>
            <h2 id="a11y-t" style={{ margin: 0 }}>{d.a11yTitle}</h2>
          </div>
          <button className="icon-btn" onClick={() => setA11yOpen(false)} aria-label={d.done}><Icon name="close" size={18} /></button>
        </div>
        <p id="a11y-intro" style={{ fontSize: ".92rem" }}>{d.a11yIntro}</p>

        <h3>{d.catVision}</h3>
        <div className="swrow">
          <div id="sw-size" className="swl">{d.swSize}</div>
          <div className="seg" role="group" aria-labelledby="sw-size">
            {["A", "A+", "A++"].map((t, i) => (
              <button key={t} aria-pressed={prefs.size === i} aria-label={`${d.swSize} ${["100%", "120%", "140%"][i]}`} onClick={() => setPrefs({ ...prefs, size: i })}>{t}</button>
            ))}
          </div>
        </div>
        {sw("hc", d.swHc, d.swHcH)}
        {sw("rm", d.swRm, d.swRmH)}
        {sw("verbose", d.swSr, d.swSrH)}
        {info(d.infoSr)}

        <h3>{d.catHearing}</h3>
        {sw("visual", d.swVis, d.swVisH)}
        {sw("captions", d.swCap, d.swCapH)}
        {info(d.infoVis)}
        {lang === "pt-BR" ? sw("vlibras", "Libras · VLibras", "Traduz textos em português para Libras. Tradução automática complementar; não substitui intérprete humano.") : process.env.NEXT_PUBLIC_HANDTALK_TOKEN ? sw("asl", "American Sign Language · Hand Talk", "Translate English text into ASL. Automatic translation is complementary and does not replace a human interpreter.") : <p className="swh">ASL translation via Hand Talk requires activation for this website. Captions, transcripts and visual information are available without it.</p>}


        <h3>{d.catNav}</h3>
        {sw("targets", d.swTarg, d.swTargH)}
        {sw("focus", d.swFocus, d.swFocusH)}
        {info(d.infoKeys)}

        <h3>{d.catRead}</h3>
        {sw("simple", d.swSimple, d.swSimpleH)}
        {sw("detailed", d.swDet, d.swDetH)}
        {info(d.infoClear)}

        <div className="row" style={{ marginTop: "1.5rem" }}>
          <button className="pri" onClick={() => setA11yOpen(false)}><Icon name="check" size={16} /> {d.done}</button>
          <button onClick={() => setPrefs(DEF)}>{d.reset}</button>
        </div>
      </div>
    </dialog>
  );
}
