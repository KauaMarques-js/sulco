"use client";
import { useApp } from "./AppProvider";
import { Icon } from "./Icons";
export default function ExperienceIntro({ kind }: { kind: "climate" | "fires" }) {
  const { lang } = useApp(); const pt = lang === "pt-BR", climate = kind === "climate";
  return <div className={`experience-intro ${climate ? "climate-intro" : "fires-intro"}`}>
    <div><p className="eyebrow">SULCO / {climate ? "01" : "02"} · {pt ? "ESTÚDIO DE SONIFICAÇÃO" : "SONIFICATION STUDIO"}</p>
      <h2>{climate ? (pt ? "Cada mês, uma nota.\nUma história para ouvir." : "Every month, a note.\nA story to listen to.") : (pt ? "O fogo deixa sinais.\nExplore cada pulso." : "Fire leaves a signal.\nExplore every pulse.")}</h2>
      <p>{climate ? (pt ? "Escolha um período, dê play e acompanhe a temperatura se transformar em som." : "Choose a period, press play and follow temperature as it turns into sound.") : (pt ? "Consulte uma região e escute os registros de satélite, um dia por vez." : "Query a region and listen to satellite records, one day at a time.")}</p>
      <a className="btn pri" href="#experience-studio"><Icon name={climate ? "sound" : "flame"} size={17} />{pt ? "Ir para o estúdio" : "Go to the studio"} ↓</a>
    </div>
    <div className="experience-orbit" aria-hidden="true"><div className="experience-disc"><Icon name={climate ? "thermo" : "flame"} size={42} /><span>{climate ? "GISTEMP v4" : "VIIRS / FIRMS"}</span></div><span className="orbit-label">{climate ? "0 °C → 440 Hz" : "FRP → Hz"}</span></div>
  </div>;
}
