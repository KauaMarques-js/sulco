"use client";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type { Detection } from "../lib/firms";
import { useApp } from "./AppProvider";

export default function FireMap({ points, from, to, total, scope }: { points: Detection[]; from: string; to: string; total: number; scope: string }) {
  const { lang } = useApp(); const pt = lang === "pt-BR";
  const el = useRef<HTMLDivElement>(null), map = useRef<Leaflet.Map | null>(null), library = useRef<typeof Leaflet | null>(null), layer = useRef<Leaflet.LayerGroup | null>(null), fitted = useRef("");
  const [ready, setReady] = useState(0), [failed, setFailed] = useState(false), [tilesFailed, setTilesFailed] = useState(false), [table, setTable] = useState(false);
  const visible = points.filter((p) => p.date >= from && p.date <= to);
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      library.current = L;
      const m = L.map(el.current, { scrollWheelZoom: false, preferCanvas: true, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView([-13, -55], 4); map.current = m;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · NASA FIRMS' }).on("tileerror", () => setTilesFailed(true)).addTo(m);
      layer.current = L.layerGroup().addTo(m); fitted.current = ""; setReady((v) => v + 1);
      const resize = new ResizeObserver(() => m.invalidateSize()); resize.observe(el.current);
      m.on("unload", () => resize.disconnect());
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; map.current?.remove(); map.current = null; layer.current = null; };
  }, []);
  useEffect(() => {
    const L = library.current, m = map.current, group = layer.current; if (!L || !m || !group) return;
    group.clearLayers();
    for (const p of visible) {
      const text = document.createElement("div"); text.textContent = `${p.date} · ${p.frp.toLocaleString(lang)} MW · ${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}`;
      L.circleMarker([p.lat, p.lon], { radius: 4, stroke: true, weight: 1, color: "#7c2d12", fillColor: "#ea580c", fillOpacity: .8 }).bindPopup(text).addTo(group);
    }
    if (fitted.current !== scope && points.length) { m.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lon])), { padding: [25, 25], maxZoom: 9, animate: false }); fitted.current = scope; }
  }, [points, from, to, lang, ready, scope]);
  return <section className="fire-map-section" aria-labelledby="fire-map-title">
    <div className="map-heading"><h2 id="fire-map-title">{pt ? "Onde o satélite detectou calor" : "Where satellites detected heat"}</h2><span>{from === to ? to : `${from} → ${to}`}</span></div>
    {failed ? <p role="status">{pt ? "Mapa indisponível. As coordenadas estão na tabela abaixo." : "Map unavailable. Coordinates are listed below."}</p> : <div ref={el} className="fire-map" role="region" aria-label={pt ? "Mapa de detecções. Use as setas para mover e mais ou menos para aproximar." : "Detection map. Use arrow keys to pan and plus or minus to zoom."} />}
    {tilesFailed && <p className="query-source" role="status">{pt ? "O mapa de fundo não carregou completamente. As coordenadas dos pontos continuam disponíveis." : "The basemap did not fully load. Point coordinates are still available."}</p>}
    <p className="query-source">{visible.length.toLocaleString(lang)} {pt ? "pontos exibidos de" : "points shown out of"} {total.toLocaleString(lang)} {pt ? "detecções no intervalo. O mapa usa uma amostra de até 2.000 pontos; totais e som usam todos os registros. Cada ponto é uma detecção, não o contorno de um incêndio." : "detections in this interval. The map samples up to 2,000 points; totals and sound use every record. A point is a detection, not a fire perimeter."}</p>
    <details onToggle={(e) => setTable(e.currentTarget.open)}><summary>{pt ? "Coordenadas dos pontos exibidos" : "Coordinates of displayed points"}</summary>{table && <div className="scroll"><table><caption className="sr">NASA FIRMS</caption><thead><tr><th>{pt ? "Data" : "Date"}</th><th>Latitude</th><th>Longitude</th><th>FRP (MW)</th></tr></thead><tbody>{visible.map((p, i) => <tr key={i}><td>{p.date}</td><td>{p.lat}</td><td>{p.lon}</td><td>{p.frp}</td></tr>)}</tbody></table></div>}</details>
  </section>;
}
