"use client";
import { useEffect, useRef } from "react";
import { useApp } from "./AppProvider";
import { DEF, type Prefs } from "../lib/prefs";
import { Icon } from "./Icons";

type B = Exclude<keyof Prefs, "size">;

// Native modal semantics, Escape and focus restoration; wrap Tab before browser chrome.
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
    <dialog ref={ref} className="dlg" aria-describedby="a11y-intro" aria-labelledby="a11y-t" onClose={() => setA11yOpen(false)} onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'))
        .filter((el) => el.tabIndex >= 0 && !el.matches(':disabled, [inert], [inert] *') && el.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} onClick={(e) => { if (e.target === ref.current) setA11yOpen(false); }}>
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
        {lang === "pt-BR" ? info("O botão do VLibras fica disponível automaticamente na página para tradução em Libras.") : process.env.NEXT_PUBLIC_HANDTALK_TOKEN ? info("The ASL translator is available automatically from its button on the page.") : null}


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
