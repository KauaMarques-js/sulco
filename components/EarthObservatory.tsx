"use client";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "./AppProvider";
import { Icon } from "./Icons";
import type { Discovery } from "../lib/nasa/discover";

export default function EarthObservatory() {
  const { lang } = useApp(); const pt = lang === "pt-BR";
  const [data, setData] = useState<Discovery | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(false);
  const [category, setCategory] = useState("all"), [search, setSearch] = useState(""), [revision, setRevision] = useState(0), [imageError, setImageError] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(false);
    fetch("/api/nasa/discover", { signal: controller.signal }).then(async (r) => { if (!r.ok) throw new Error("Unavailable"); return r.json() as Promise<Discovery>; }).then((d) => { setData(d); setImageError(false); }).catch(() => { if (!controller.signal.aborted) setError(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  const categories = useMemo(() => [...new Map((data?.events ?? []).flatMap((e) => e.categories).map((c) => [c.id, c])).values()], [data]);
  const events = (data?.events ?? []).filter((e) => (category === "all" || e.categories.some((c) => c.id === category)) && e.title.toLocaleLowerCase(lang).includes(search.toLocaleLowerCase(lang)));
  const names: Record<string, string> = pt ? { wildfires: "Queimadas", severeStorms: "Tempestades", volcanoes: "Vulcões", seaLakeIce: "Gelo marinho", floods: "Inundações", drought: "Seca", dustHaze: "Poeira e névoa", landslides: "Deslizamentos", snow: "Neve", tempExtremes: "Temperaturas extremas", waterColor: "Cor da água", manmade: "Atividade humana" } : {};
  const date = (s: string) => new Date(s).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" });
  return <section className="observatory" aria-labelledby="observatory-title">
    <div className="observatory-hero">
      <div className="observatory-copy">
        <p className="eyebrow"><span className="ob-dot" /> NASA · EARTH OBSERVATORY</p>
        <h2 id="observatory-title">{pt ? "Um planeta.\nMil histórias acontecendo." : "One planet.\nA thousand stories unfolding."}</h2>
        <p>{pt ? "Acompanhe eventos naturais registrados pela NASA e veja a Terra pelos olhos do satélite DSCOVR." : "Explore NASA’s natural event records and see Earth through the eyes of the DSCOVR satellite."}</p>
        <div className="ob-stats">
          <div><strong>{data?.eventsAvailable ? data.events.length : "—"}</strong><span>{pt ? "eventos na consulta" : "events in this query"}</span></div>
          <div><strong>30</strong><span>{pt ? "dias consultados" : "days queried"}</span></div>
          <div><strong>EPIC</strong><span>{pt ? "a Terra vista do espaço" : "Earth from space"}</span></div>
        </div>
        <p className="ob-caption">{pt ? "Eventos abertos no EONET · até 100 registros · não representa todas as ocorrências no planeta." : "Open EONET events · up to 100 records · does not represent every event on Earth."}</p>
      </div>
      <figure className="earth-portrait">
        {data?.image && !imageError ? <img src={data.image.url} alt={pt ? "Terra em cores naturais, fotografada pela câmera NASA EPIC no DSCOVR" : "Earth in natural color, photographed by NASA’s EPIC camera on DSCOVR"} onError={() => setImageError(true)} /> : <div className="earth-placeholder"><Icon name="globe" size={100} /><span>{loading ? (pt ? "Buscando imagem da Terra…" : "Fetching Earth imagery…") : (pt ? "Imagem indisponível" : "Image unavailable")}</span></div>}
        <figcaption>NASA EPIC / NOAA DSCOVR{data?.image && !imageError && <><br />{date(data.image.date)}</>}</figcaption>
      </figure>
    </div>
    <div className="ob-feed">
      <div className="section-head"><div><p className="eyebrow">{pt ? "OBSERVAR · EXPLORAR · ENTENDER" : "OBSERVE · EXPLORE · UNDERSTAND"}</p><h2>{pt ? "Sinais da Terra" : "Signals from Earth"}</h2></div><button disabled={loading} onClick={() => setRevision((v) => v + 1)}><Icon name="restart" size={16} />{pt ? "Atualizar" : "Refresh"}</button></div>
      {loading && <p role="status">{pt ? "Consultando a NASA…" : "Querying NASA…"}</p>}
      {error && <p role="alert" className="warn">{pt ? "Não foi possível atualizar os dados. Tente novamente." : "Could not refresh the data. Please try again."}</p>}
      {data && <>
        {!data.eventsAvailable && <p role="status" className="warn">{pt ? "O serviço de eventos EONET está indisponível. A imagem EPIC é uma consulta independente." : "EONET events are unavailable. EPIC imagery is an independent query."}</p>}
        {data.eventsAvailable && <>
          <div className="ob-filters"><label>{pt ? "Buscar evento" : "Search events"}<input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={pt ? "Nome ou local…" : "Name or place…"} /></label><label>{pt ? "Tipo de evento" : "Event type"}<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">{pt ? "Todos os tipos" : "All types"}</option>{categories.map((c) => <option key={c.id} value={c.id}>{names[c.id] ?? c.title}</option>)}</select></label></div>
          <p className="mut" role="status">{events.length} {pt ? "eventos encontrados" : "events found"}</p>
          {!events.length && <p className="ob-empty">{pt ? "Nenhum evento para esta consulta. Experimente outro filtro." : "No events match this query. Try another filter."}</p>}
          <ul className="earth-events">{events.map((e) => <li key={e.id} className="earth-event"><div className="row">{e.categories.map((c) => <span className="chip" key={c.id}>{names[c.id] ?? c.title}</span>)}</div><h3>{e.title}</h3><p className="mut">{date(e.date)}</p><p className="ob-coords">{e.lat.toFixed(2)}° latitude · {e.lon.toFixed(2)}° longitude</p><a href={e.url} target="_blank" rel="noopener noreferrer">{pt ? "Ver registro na NASA" : "View NASA record"} ↗</a></li>)}</ul>
        </>}
        <p className="ob-caption">{pt ? "Consulta realizada em" : "Queried at"} {date(data.fetchedAt)}. {pt ? "Respostas podem ficar em cache por até 15 min (eventos) e 1 h (imagem). Os títulos originais são preservados." : "Responses may be cached for 15 min (events) and 1 h (imagery). Original event titles are preserved."}</p>
      </>}
      <p className="ob-caption"><a href="https://eonet.gsfc.nasa.gov/docs/v3" target="_blank" rel="noopener noreferrer">NASA EONET</a> · <a href="https://epic.gsfc.nasa.gov/about/api" target="_blank" rel="noopener noreferrer">NASA EPIC</a> · {pt ? "Eventos não são medições de temperatura nem validação das sonificações." : "Events are not temperature measurements or validation of sonifications."}</p>
    </div>
  </section>;
}
