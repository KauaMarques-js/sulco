"use client";
import { useApp } from "./AppProvider";
import type { OceanDay } from "../lib/oceans";

/**
 * Pure SVG time-series chart of daily mean Sea Surface Temperature (°C)
 * with period-mean reference line and highlighted playback cursor.
 */
export default function OceansChart({
  days,
  idx,
  desc,
  onPick,
}: {
  days: OceanDay[];
  idx?: number;
  desc: string;
  onPick?: (k: number) => void;
}) {
  const { lang, d } = useApp();
  if (!days.length) return null;

  const W = 720, H = 260, pL = 54, pR = 18, pT = 20, pB = 38;
  const cw = W - pL - pR, ch = H - pT - pB;
  const vals = days.map((x) => x.sstMean);
  const rawMin = Math.min(...vals), rawMax = Math.max(...vals);
  const span = Math.max(rawMax - rawMin, 0.05);
  const lo = rawMin - span * 0.1, hi = rawMax + span * 0.1;
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;

  const xAt = (k: number) => pL + (days.length === 1 ? cw / 2 : (k / (days.length - 1)) * cw);
  const yAt = (v: number) => pT + ch - ((v - lo) / (hi - lo || 1)) * ch;
  const pts = days.map((x, k) => `${xAt(k).toFixed(1)},${yAt(x.sstMean).toFixed(1)}`);
  const area = `${xAt(0).toFixed(1)},${(pT + ch).toFixed(1)} ${pts.join(" ")} ${xAt(days.length - 1).toFixed(1)},${(pT + ch).toFixed(1)}`;

  const active = typeof idx === "number" && idx >= 0 && idx < days.length ? idx : -1;
  const fmt = (v: number) => v.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const midIdx = Math.floor((days.length - 1) / 2);

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={desc} style={{ width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="ocean-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(76,201,236,.32)" />
            <stop offset="1" stopColor="rgba(76,201,236,0)" />
          </linearGradient>
        </defs>

        {[lo, (lo + hi) / 2, hi].map((v, i) => {
          const y = yAt(v);
          return (
            <g key={i}>
              <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="rgba(255,255,255,.08)" />
              <text x={pL - 8} y={y + 4} textAnchor="end" fill="#8e9ab5" fontSize="11" fontFamily="ui-monospace, monospace">
                {fmt(v)}°
              </text>
            </g>
          );
        })}

        <line x1={pL} x2={W - pR} y1={yAt(avg)} y2={yAt(avg)} stroke="rgba(247,181,107,.55)" strokeDasharray="5 5" />

        <polygon points={area} fill="url(#ocean-fill)" />
        <polyline points={pts.join(" ")} fill="none" stroke="#4cc9ec" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />

        {days.map((day, k) => (
          <circle
            key={day.date}
            cx={xAt(k)}
            cy={yAt(day.sstMean)}
            r={k === active ? 5.5 : 3.2}
            fill={k === active ? "#f7b56b" : "#7fe7ff"}
            stroke="#05060b"
            strokeWidth={k === active ? 2 : 1}
            style={onPick ? { cursor: "pointer" } : undefined}
            onClick={onPick ? () => onPick(k) : undefined}
          >
            <title>{`${day.date}: ${fmt(day.sstMean)} °C`}</title>
          </circle>
        ))}

        {[0, midIdx, days.length - 1]
          .filter((v, i, a) => a.indexOf(v) === i)
          .map((k) => (
            <text
              key={days[k].date}
              x={xAt(k)}
              y={H - 12}
              textAnchor={k === 0 ? "start" : k === days.length - 1 ? "end" : "middle"}
              fill="#8e9ab5"
              fontSize="11"
              fontFamily="ui-monospace, monospace"
            >
              {days[k].date.slice(5)}
            </text>
          ))}
      </svg>
      <div className="chart-legend" aria-hidden="true">
        <span><i /> {d.oMean} ({fmt(rawMin)} — {fmt(rawMax)} °C)</span>
        <span style={{ color: "var(--go)" }}><i style={{ background: "var(--go)" }} /> {fmt(avg)} °C</span>
      </div>
    </div>
  );
}
