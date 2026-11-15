"use client";
import { useApp } from "./AppProvider";
import { Icon } from "./Icons";
import type { usePlayback } from "./usePlayback";

type Playback = ReturnType<typeof usePlayback>;
export default function PlayerTransport({ pb, count, current, onReset, onPause }: { pb: Playback; count: number; current: string; onReset: () => void; onPause?: () => void }) {
  const { d, lang } = useApp(); const pt = lang === "pt-BR";
  const previous = pt ? "Registro anterior" : "Previous record", next = pt ? "Próximo registro" : "Next record";
  const seconds = Math.ceil(count * .15 / pb.speed);
  const duration = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return <div className="transport">
    <div className="transport-row">
      <div className="transport-actions">
        <button className="icon-btn" aria-label={previous} title={previous} disabled={pb.idx <= 0} onClick={() => pb.seek(pb.idx - 1)}>←</button>
        <button className="pri transport-play" onClick={() => { if (pb.playing) { pb.pause(); onPause?.(); } else { void pb.play(); } }}><Icon name={pb.playing ? "pause" : "play"} size={19} /><span className="transport-play-label">{pb.playing ? d.pause : pb.paused() ? d.resume : d.play}</span></button>
        <button className="icon-btn" aria-label={next} title={next} disabled={pb.idx >= count - 1} onClick={() => pb.seek(pb.idx + 1)}>→</button>
        <button className="icon-btn" aria-label={d.stop} title={d.stop} onClick={() => { pb.stop(); onReset(); }}><Icon name="stop" size={16} /></button>
        <button className="icon-btn" aria-label={d.restart} title={d.restart} onClick={() => { onReset(); void pb.restart(); }}><Icon name="restart" size={16} /></button>
      </div>
      <div className="transport-settings">
        <label>{d.sonSpeed}<select value={pb.speed} onChange={(e) => pb.setSpeed(+e.target.value)}>{[.5, .75, 1, 1.5, 2].map((s) => <option key={s} value={s}>{s}×</option>)}</select></label>
        <label>{d.volume} · {pb.vol}%<input type="range" min={0} max={100} value={pb.vol} onChange={(e) => pb.setVol(+e.target.value)} aria-valuetext={`${pb.vol}%`} /></label>
      </div>
    </div>
    <label className="transport-timeline"><span>{pt ? "Navegar pela série" : "Explore the series"}<span className="transport-position">{pb.idx + 1} / {count}</span></span><input type="range" min={0} max={Math.max(0, count - 1)} step={1} value={pb.idx} onChange={(e) => pb.seek(+e.target.value)} aria-valuetext={current} /></label>
    <div className="transport-meta"><span>{pb.playing ? (pt ? "Reproduzindo" : "Playing") : pb.paused() ? d.paused : (pt ? "Pronto para ouvir" : "Ready to listen")}</span><span>{pt ? "Duração aproximada da série" : "Approximate series duration"} · {duration}</span></div>
    {pb.audioError && <p className="warn" role="alert">{pt ? "Não foi possível iniciar o áudio. Verifique a permissão de som do navegador e tente novamente." : "Audio could not start. Check your browser’s sound permissions and try again."}</p>}
  </div>;
}
