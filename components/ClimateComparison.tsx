"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { usePlayback } from "./usePlayback";
import ErrBox from "./ErrBox";
import { climateFreq } from "../lib/audio/mapping";
import { completeAnnualMeans, periodStarts, compareClimate, type AnnualClimate } from "../lib/data/compareClimate";
import ComparisonChart from "./ComparisonChart";

const EMPTY: AnnualClimate[] = [];
const REFERENCE = [{ year: 0, anomaly: 0 }];
type Mode = "a" | "b" | "reference";
const copy = {
  "pt-BR": {
    back: "Voltar à espiral climática", title: "Ouça dois períodos do clima", intro: "Escolha dois recortes da série global da NASA e descubra como eles soam na mesma escala.",
    scale: "1. Conheça a escala", instructions: "Cada nota representa a média de um ano completo. Uma anomalia maior produz uma nota mais aguda; uma menor, uma nota mais grave. O zero da referência 1951–1980 corresponde a 440 Hz. A mesma anomalia sempre produz a mesma frequência nos dois períodos.",
    reference: "Ouvir referência de 440 Hz", readGuide: "Ouvir instruções", choose: "2. Escolha os períodos", duration: "Duração de cada período", years: "anos", a: "Período A", b: "Período B",
    completeness: "As opções incluem apenas anos com os 12 meses publicados. A comparação usa o mesmo número de anos em A e B.", unavailable: "Não há anos completos suficientes para comparar dois períodos de pelo menos cinco anos.", overlap: "Os períodos selecionados têm anos em comum.",
    listen: "3. Ouça e alterne", playA: "Ouvir período A", playB: "Ouvir período B", pause: "Pausar", resume: "Retomar", stop: "Parar som e leitura", speed: "Velocidade das notas", volume: "Volume", seek: "Ano selecionado", hearYear: "Ouvir ano selecionado", ready: "Escolha A ou B para começar. O áudio só inicia quando você pede.",
    mean: "Anomalia média", result: "4. Compare os valores", readResult: "Ouvir resultado", same: "As médias dos dois períodos são iguais na precisão dos dados usados.", above: "acima", below: "abaixo", chart: "Médias anuais na mesma escala", relative: "O gráfico alinha o primeiro ano de A ao primeiro de B, e assim por diante. As duas linhas usam o mesmo eixo de anomalia.",
    table: "Consultar todos os anos e frequências", position: "Posição", year: "Ano", anomaly: "Anomalia (°C)", frequency: "Frequência (Hz)", method: "Como a comparação é calculada", methodText: "Cada valor anual é a média dos 12 valores mensais GISTEMP v4 publicados, em °C, em relação a 1951–1980. A média do período usa esses anos completos, com o mesmo peso para cada ano. A diferença é B menos A. Meses ausentes não são preenchidos. O som mantém o mapeamento da experiência: 440 × 2^(anomalia ÷ 4), sem normalizar cada período separadamente.",
    source: "Fonte dos dados", sourceNote: "As médias anuais e a comparação são calculadas pelo SULCO a partir da série mensal da NASA. A frequência sonora é uma representação artística dos dados.", noSpeech: "A leitura em voz alta não está disponível neste navegador. As instruções e o resultado estão em texto.", speechError: "Não foi possível iniciar a leitura em voz alta. Você pode acompanhar o texto na página.", audioError: "Não foi possível iniciar o som. Verifique a permissão de áudio do navegador e tente novamente.", finished: "Leitura concluída.", heard: "Ouvidos até o fim", notHeard: "Ainda não ouvido até o fim", selected: "Selecionado", paused: "Reprodução pausada.", stopped: "Som e leitura interrompidos.", referenceNow: "Referência: anomalia zero, 440 Hz.", outside: "Os valores selecionados estão fora da faixa sonora disponível.",
  },
  en: {
    back: "Back to the climate spiral", title: "Hear two climate periods", intro: "Choose two windows of NASA's global series and discover how they sound on the same scale.",
    scale: "1. Learn the scale", instructions: "Each note represents the mean of one complete year. A higher anomaly produces a higher note; a lower anomaly produces a lower note. Zero relative to the 1951–1980 baseline corresponds to 440 Hz. The same anomaly always produces the same frequency in both periods.",
    reference: "Hear the 440 Hz reference", readGuide: "Read instructions aloud", choose: "2. Choose the periods", duration: "Length of each period", years: "years", a: "Period A", b: "Period B",
    completeness: "Options include only years with all 12 published months. A and B use the same number of years.", unavailable: "There are not enough complete years to compare two periods of at least five years.", overlap: "The selected periods have years in common.",
    listen: "3. Listen and switch", playA: "Hear period A", playB: "Hear period B", pause: "Pause", resume: "Resume", stop: "Stop sound and speech", speed: "Note speed", volume: "Volume", seek: "Selected year", hearYear: "Hear selected year", ready: "Choose A or B to start. Audio only begins when you request it.",
    mean: "Mean anomaly", result: "4. Compare the values", readResult: "Read result aloud", same: "Both periods have the same mean at the precision of the data used.", above: "above", below: "below", chart: "Annual means on the same scale", relative: "The chart aligns the first year of A with the first year of B, and so on. Both lines share the same anomaly axis.",
    table: "Inspect all years and frequencies", position: "Position", year: "Year", anomaly: "Anomaly (°C)", frequency: "Frequency (Hz)", method: "How the comparison is calculated", methodText: "Each annual value is the mean of the 12 published GISTEMP v4 monthly values, in °C relative to 1951–1980. The period mean uses these complete years, giving each year equal weight. The difference is B minus A. Missing months are not filled. Sound keeps the experience's mapping: 440 × 2^(anomaly ÷ 4), without normalizing each period separately.",
    source: "Data source", sourceNote: "Annual means and the comparison are calculated by SULCO from NASA's monthly series. Sound frequency is an artistic representation of the data.", noSpeech: "Read-aloud is not available in this browser. Instructions and results are available as text.", speechError: "Read-aloud could not start. You can follow the text on the page.", audioError: "Sound could not start. Check your browser's audio permission and try again.", finished: "Read-aloud finished.", heard: "Heard to the end", notHeard: "Not yet heard to the end", selected: "Selected", paused: "Playback paused.", stopped: "Sound and speech stopped.", referenceNow: "Reference: zero anomaly, 440 Hz.", outside: "The selected values are outside the available sound range.",
  },
};

export default function ClimateComparison() {
  const { lang, d, prefs, data, dataErr, loadData } = useApp();
  const t = copy[lang], pt = lang === "pt-BR";
  const annual = useMemo(() => completeAnnualMeans(data?.rows ?? []), [data]);
  const lengths = useMemo(() => [5, 10, 20, 30].filter(n => {
    const options = periodStarts(annual, n); return options.length > 1 && options[options.length - 1] - options[0] >= n;
  }), [annual]);
  const [length, setLength] = useState(10), [startA, setStartA] = useState<number | null>(null), [startB, setStartB] = useState<number | null>(null);
  const effectiveLength = lengths.includes(length) ? length : lengths[0] ?? 10;
  const starts = useMemo(() => periodStarts(annual, effectiveLength), [annual, effectiveLength]);
  const a = startA !== null && starts.includes(startA) ? startA : starts[0];
  const b = startB !== null && starts.includes(startB) ? startB : starts[starts.length - 1];
  const model = useMemo(() => lengths.length && a !== undefined && b !== undefined ? compareClimate(annual, a, b, effectiveLength) : null, [annual, lengths, a, b, effectiveLength]);
  const [mode, setMode] = useState<Mode>("a"), [request, setRequest] = useState(0), [live, setLive] = useState("");
  const [heard, setHeard] = useState({ a: false, b: false });
  const [speechAvailable, setSpeechAvailable] = useState(false), [speaking, setSpeaking] = useState(false);
  const speech = useRef<SpeechSynthesisUtterance | null>(null), wanted = useRef(false), intent = useRef(0);
  const number = useMemo(() => new Intl.NumberFormat(lang, { minimumFractionDigits: 2, maximumFractionDigits: 4 }), [lang]);
  const nf = (value: number) => number.format(value);
  const hz = (anomaly: number) => { const frequency = climateFreq(anomaly); return frequency === null ? "—" : nf(frequency); };
  const items = useMemo(() => mode === "reference" ? REFERENCE : model?.[mode].years ?? EMPTY, [model, mode]);
  const periodLabel = (key: "a" | "b") => model ? `${t[key]} · ${model[key].start}–${model[key].end}` : t[key];
  const describe = (point: AnnualClimate) => `${mode === "reference" ? t.referenceNow : `${t[mode]}, ${point.year}: ${nf(point.anomaly)} °C, ${hz(point.anomaly)} Hz.`}`;
  const pb = usePlayback<AnnualClimate>(items, {
    note: (point, speed, engine) => { const f = climateFreq(point.anomaly); if (f !== null) engine.note(f, .135 / speed); },
    step: (point) => { if (prefs.verbose && mode !== "reference") setLive(describe(point)); },
    end: () => {
      wanted.current = false;
      if (mode === "reference") setLive(t.referenceNow);
      else {
        setHeard(value => ({ ...value, [mode]: true }));
        setLive(pt ? `${periodLabel(mode)} concluído. Você pode ouvir o outro período ou consultar o resultado.` : `${periodLabel(mode)} finished. You can hear the other period or inspect the result.`);
      }
    },
  }, prefs.rm);
  const cancelSpeech = () => { if (speech.current) { speech.current = null; window.speechSynthesis.cancel(); } setSpeaking(false); };
  const stop = (message = "") => { intent.current++; wanted.current = false; pb.stop(); cancelSpeech(); setLive(message); };
  useEffect(() => { pb.setSpeed(.25); setSpeechAvailable("speechSynthesis" in window && "SpeechSynthesisUtterance" in window); }, []); // initial listening pace
  useEffect(() => {
    wanted.current = false; pb.stop(); cancelSpeech(); setHeard({ a: false, b: false }); setLive(""); document.title = `${t.title} · SULCO`;
  }, [annual, lang]);
  useEffect(() => () => { if (speech.current) { speech.current = null; window.speechSynthesis.cancel(); } }, []);
  useEffect(() => { if (request > 0 && wanted.current) void pb.play(); }, [request]);
  const begin = (next: Mode) => {
    stop(); wanted.current = true;
    // Unlock audio in the user gesture; playback starts after the new series commits.
    const id = intent.current;
    void pb.prepare().then(available => { if (!available && wanted.current && id === intent.current) { wanted.current = false; setLive(t.audioError); } });
    setMode(next); setRequest(value => value + 1);
    setLive(next === "reference" ? t.referenceNow : pt ? `Ouvindo ${periodLabel(next)}.` : `Listening to ${periodLabel(next)}.`);
  };
  const speak = (text: string) => {
    stop(); if (!speechAvailable) { setLive(t.noSpeech); return; }
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = lang; utterance.rate = .95;
    const voices = window.speechSynthesis.getVoices();
    const matching = voices.find(v => v.lang === lang) ?? voices.find(v => v.lang.startsWith(pt ? "pt" : "en"));
    if (matching) utterance.voice = matching;
    utterance.onend = () => { if (speech.current === utterance) { speech.current = null; setSpeaking(false); setLive(t.finished); } };
    utterance.onerror = () => { if (speech.current === utterance) { speech.current = null; setSpeaking(false); setLive(t.speechError); } };
    speech.current = utterance; setSpeaking(true); window.speechSynthesis.speak(utterance);
  };
  const configure = (change: () => void) => { stop(); setHeard({ a: false, b: false }); change(); };
  const current = items[Math.min(pb.idx, Math.max(0, items.length - 1))];
  const playable = !!model && [...model.a.years, ...model.b.years].every(row => climateFreq(row.anomaly) !== null);
  const result = model ? Math.abs(model.delta) < 1e-12 ? t.same : pt
    ? `A média de B (${nf(model.b.mean)} °C) está ${nf(Math.abs(model.delta))} °C ${model.delta > 0 ? t.above : t.below} da média de A (${nf(model.a.mean)} °C).`
    : `B's mean (${nf(model.b.mean)} °C) is ${nf(Math.abs(model.delta))} °C ${model.delta > 0 ? t.above : t.below} A's mean (${nf(model.a.mean)} °C).` : "";
  const fullResult = model ? `${periodLabel("a")}: ${nf(model.a.mean)} °C. ${periodLabel("b")}: ${nf(model.b.mean)} °C. ${result}` : "";

  return <article className="climate-comparison">
    <Link className="back" href="/experiences/climate">← {t.back}</Link>
    <p className="eyebrow">NASA GISS · GISTEMP v4</p><h1>{t.title}</h1><p className="lead">{t.intro}</p>
    {!data && !dataErr && <p role="status">{d.loading}</p>}
    {dataErr && <ErrBox d={d} f={dataErr} msg={d.failData} retry={() => loadData()} />}
    {data && !model && <p role="status" className="warn">{t.unavailable}</p>}
    {model && <>
      <section className="card" aria-labelledby="compare-scale">
        <h2 id="compare-scale">{t.scale}</h2><p>{t.instructions}</p>
        <div className="row"><button onClick={() => begin("reference")} disabled={!playable}>{t.reference}</button><button disabled={!speechAvailable} onClick={() => speak(t.instructions)}>{t.readGuide}</button></div>
        {!speechAvailable && <p className="mut">{t.noSpeech}</p>}
      </section>
      <section className="card" aria-labelledby="compare-periods">
        <h2 id="compare-periods">{t.choose}</h2>
        <div className="comparison-length"><label htmlFor="compare-length">{t.duration}</label><select id="compare-length" value={effectiveLength} onChange={e => configure(() => { setLength(Number(e.target.value)); setStartA(null); setStartB(null); })}>{lengths.map(n => <option key={n} value={n}>{n} {t.years}</option>)}</select></div>
        <fieldset className="comparison-periods"><legend className="sr">{t.choose}</legend>{(["a", "b"] as const).map(key => <div key={key}>
          <label htmlFor={`compare-${key}`}>{t[key]}</label><select id={`compare-${key}`} value={model[key].start} onChange={e => configure(() => key === "a" ? setStartA(Number(e.target.value)) : setStartB(Number(e.target.value)))}>{starts.map(start => <option key={start} value={start}>{start}–{start + effectiveLength - 1}</option>)}</select>
          <p>{t.mean}: <strong>{nf(model[key].mean)} °C</strong></p>
        </div>)}</fieldset>
        <p className="mut">{t.completeness}</p>{model.overlap && <p role="status">{t.overlap}</p>}
      </section>
      <section className="card" aria-labelledby="compare-listen">
        <h2 id="compare-listen">{t.listen}</h2>
        <div className="comparison-actions"><button aria-pressed={mode === "a"} disabled={!playable} onClick={() => begin("a")}>{t.playA} · {model.a.start}–{model.a.end}</button><button aria-pressed={mode === "b"} disabled={!playable} onClick={() => begin("b")}>{t.playB} · {model.b.start}–{model.b.end}</button></div>
        <div className="row comparison-controls"><button disabled={!pb.playing} onClick={() => { wanted.current = false; pb.pause(); setLive(t.paused); }}>{t.pause}</button><button disabled={!pb.paused() || speaking} onClick={() => { cancelSpeech(); void pb.play(); }}>{t.resume}</button><button onClick={() => stop(t.stopped)}>{t.stop}</button></div>
        <div className="row comparison-settings"><div><label htmlFor="compare-speed">{t.speed}</label><select id="compare-speed" value={pb.speed} onChange={e => pb.setSpeed(Number(e.target.value))}>{[.25, .5, 1].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></div><div><label htmlFor="compare-volume">{t.volume} · {pb.vol}%</label><input id="compare-volume" type="range" min="0" max="100" value={pb.vol} aria-valuetext={`${pb.vol}%`} onChange={e => pb.setVol(Number(e.target.value))} /></div></div>
        <p className="comparison-status" role="status" aria-live="polite" aria-atomic="true">{live || t.ready}</p>
        {pb.audioError && <p role="alert" className="warn">{t.audioError}</p>}{!playable && <p role="alert">{t.outside}</p>}
        {current && <p className="cap" aria-live="off">{describe(current)}</p>}
        {mode !== "reference" && current && <div className="comparison-seek"><label htmlFor="compare-seek">{t.seek} · {t[mode]}</label><input id="compare-seek" type="range" min="0" max={items.length - 1} step="1" value={pb.idx} aria-valuetext={`${current.year}, ${nf(current.anomaly)} °C, ${hz(current.anomaly)} Hz`} onChange={e => { wanted.current = false; cancelSpeech(); pb.pause(); pb.seek(Number(e.target.value)); setLive(`${t.selected}: ${items[Number(e.target.value)].year}.`); }} /><button onClick={() => { wanted.current = false; cancelSpeech(); pb.pause(); void pb.hearOne(pb.idx); setLive(describe(current)); }}>{t.hearYear}</button></div>}
        <p className="mut">A: {heard.a ? t.heard : t.notHeard} · B: {heard.b ? t.heard : t.notHeard}</p>
      </section>
      <section className="card" aria-labelledby="compare-result"><h2 id="compare-result">{t.result}</h2><p className="comparison-result">{result}</p><button disabled={!speechAvailable} onClick={() => speak(fullResult)}>{t.readResult}</button>
        <ComparisonChart model={model} active={mode === "reference" ? undefined : mode} index={pb.idx} title={t.chart} description={`${fullResult} ${t.relative}`} lang={lang} />
        <p>{t.relative}</p><details><summary>{t.table}</summary><div className="scroll" tabIndex={0} role="region" aria-label={t.table}><table><caption>{periodLabel("a")} / {periodLabel("b")} · °C · 1951–1980</caption><thead><tr><th scope="col">{t.position}</th>{(["a", "b"] as const).flatMap(key => [<th key={`${key}-y`} scope="col">{t[key]} · {t.year}</th>, <th key={`${key}-a`} scope="col">{t[key]} · {t.anomaly}</th>, <th key={`${key}-f`} scope="col">{t[key]} · {t.frequency}</th>])}</tr></thead><tbody>{model.a.years.map((row, k) => <tr key={row.year}><th scope="row">{k + 1}</th>{([row, model.b.years[k]]).flatMap((point, j) => [<td key={`${j}-y`}>{point.year}</td>, <td key={`${j}-a`}>{nf(point.anomaly)}</td>, <td key={`${j}-f`}>{hz(point.anomaly)}</td>])}</tr>)}</tbody></table></div></details>
      </section>
      <section className="card" aria-labelledby="compare-method"><h2 id="compare-method">{t.method}</h2><p>{t.methodText}</p><p>{t.sourceNote}</p><a href={data!.source} target="_blank" rel="noopener">{t.source} · NASA GISS GISTEMP v4 ↗</a>{data?.fallback && <p role="status">{d.apiFallback}</p>}</section>
    </>}
  </article>;
}
