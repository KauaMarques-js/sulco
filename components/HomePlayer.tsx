"use client";
import { useEffect, useMemo } from "react";
import { useApp } from "./AppProvider";
import { usePlayback } from "./usePlayback";
import { climateFreq } from "../lib/audio/mapping";
import { Icon } from "./Icons";
import type { Row } from "../lib/gistemp";

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Hero record. Plays the most recent 10 years of GISTEMP so the visitor hears
 * the acceleration without waiting through 146 years of data.
 */
export default function HomePlayer() {
  const { d, data, lang } = useApp();
  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    const all = data.rows;
    return all.filter((r) => r.year >= data.lastYear - 9);
  }, [data]);

  const pb = usePlayback<Row>(rows, {
    note: (r, speed, e) => {
      const f = climateFreq(r.anomaly);
      if (f !== null) e.note(f, 0.16 / speed);
    },
  });
  useEffect(() => { pb.setSpeed(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = rows[Math.min(pb.idx, Math.max(0, rows.length - 1))];
  const active = pb.playing || pb.idx > 0;
  const months = lang === "pt-BR" ? MONTHS_PT : MONTHS_EN;
  const freq = cur ? climateFreq(cur.anomaly) : null;
  const fmt = (v: number) => v.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const range = rows.length ? `${rows[0].year}—${rows[rows.length - 1].year}` : "1880—2026";
  const label = pb.playing ? d.pause : d.listenNow;

  return (
    <div className="disc-stage">
      <div className="disc-halo" aria-hidden="true" />
      <div
        className={`disc${pb.playing ? " playing" : ""}`}
        role="img"
        aria-label={active && cur && freq !== null ? `${months[cur.month - 1]} ${cur.year}: ${fmt(cur.anomaly)} °C, ${freq.toFixed(0)} Hz.` : range}
      >
        <div className="disc-label">
          <span className="disc-brand">SULCO</span>
          <span className="disc-year">{active && cur ? cur.year : "1880—2026"}</span>
          <span className="disc-sub">{active && cur && freq !== null ? `${fmt(cur.anomaly)} °C · ${freq.toFixed(0)} Hz` : "GISTEMP v4"}</span>
        </div>
        <span className="disc-hole" aria-hidden="true" />
      </div>

      <button
        className="disc-play"
        onClick={() => (pb.playing ? pb.pause() : pb.play())}
        disabled={!rows.length}
        aria-label={label}
        title={label}
      >
        <Icon name={pb.playing ? "pause" : "play"} size={22} />
      </button>

      <div className={`disc-card${pb.playing ? " active" : ""}`}>
        <div className="wave" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div>
          <strong>{pb.playing ? d.now : d.listenNow}</strong>
          <small>
            {pb.playing && cur
              ? `${months[cur.month - 1]} ${cur.year} · ${fmt(cur.anomaly)} °C`
              : `${range} · GISTEMP v4`}          </small>
        </div>
      </div>
    </div>
  );
}