import type { Row } from "../lib/gistemp";

/**
 * Monthly anomaly line chart. Rendered as a client-side SVG (no chart library):
 * area gradient, zero reference, axis ticks and a live cursor for the player.
 */
export default function LineChart({ rows, idx, desc }: { rows: Row[]; idx?: number; desc: string }) {
  if (rows.length < 2) return null;
  const W = 1000, H = 300;
  const M = { l: 48, r: 16, t: 26, b: 32 };
  const values = rows.map((r) => r.anomaly);
  const rawMin = Math.min(...values), rawMax = Math.max(...values);
  const lo = Math.min(rawMin, 0) - 0.1;
  const hi = Math.max(rawMax, 0) + 0.1;
  const X = (i: number) => M.l + (i / (rows.length - 1)) * (W - M.l - M.r);
  const Y = (a: number) => M.t + (1 - (a - lo) / (hi - lo || 1)) * (H - M.t - M.b);
  const line = rows.map((r, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(r.anomaly).toFixed(1)}`).join(" ");
  const area = `${line} L${X(rows.length - 1).toFixed(1)} ${Y(lo).toFixed(1)} L${X(0).toFixed(1)} ${Y(lo).toFixed(1)} Z`;
  const k = idx === undefined ? -1 : Math.max(0, Math.min(idx, rows.length - 1));
  const ticks = [hi, 0, lo].filter((v, i, a) => a.findIndex((x) => Math.abs(x - v) < 0.05) === i);
  const years = rows.map((r) => r.year);
  const midYear = years[Math.floor(years.length / 2)];
  const cursor = k >= 0 ? rows[k] : null;
  const cursorX = k >= 0 ? X(k) : 0;
  const labelX = Math.max(M.l + 30, Math.min(W - M.r - 30, cursorX));

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={desc}>
        <defs>
          <linearGradient id="line-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7fe7ff" stopOpacity=".32" />
            <stop offset=".65" stopColor="#3aa8d8" stopOpacity=".07" />
            <stop offset="1" stopColor="#7fe7ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#5bd4f0" />
            <stop offset=".7" stopColor="#7fe7ff" />
            <stop offset="1" stopColor="#c9b8ff" />
          </linearGradient>
          <filter id="line-glow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={Y(t)} y2={Y(t)} stroke={Math.abs(t) < 0.05 ? "rgba(247,181,107,.35)" : "rgba(255,255,255,.05)"} strokeDasharray={Math.abs(t) < 0.05 ? "5 6" : undefined} />
            <text x={M.l - 10} y={Y(t) + 4} textAnchor="end" fill="#6b7690" fontSize="11" fontFamily="ui-monospace, monospace">
              {t > 0 ? "+" : ""}{t.toFixed(1)}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#line-area)" />
        <path d={line} fill="none" stroke="url(#line-stroke)" strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" />

        {[years[0], midYear, years[years.length - 1]].map((y, i) => (
          <text key={`${y}-${i}`} x={i === 0 ? M.l : i === 1 ? W / 2 : W - M.r} y={H - 8} textAnchor={i === 0 ? "start" : i === 1 ? "middle" : "end"} fill="#6b7690" fontSize="11" fontFamily="ui-monospace, monospace">{y}</text>
        ))}

        {cursor && (
          <>
            <line x1={cursorX} x2={cursorX} y1={M.t - 6} y2={H - M.b} stroke="rgba(247,181,107,.55)" strokeWidth="1" strokeDasharray="3 4" />
            <circle cx={cursorX} cy={Y(cursor.anomaly)} r="12" fill="rgba(247,181,107,.16)" />
            <circle cx={cursorX} cy={Y(cursor.anomaly)} r="4.5" fill="#f7b56b" stroke="#05060b" strokeWidth="2" filter="url(#line-glow)" />
            <text x={labelX} y={Math.max(16, Y(cursor.anomaly) - 16)} textAnchor={labelX < W / 2 ? "start" : "end"} fill="#f7b56b" fontSize="12" fontFamily="ui-monospace, monospace">
              {cursor.year} · {cursor.anomaly > 0 ? "+" : ""}{cursor.anomaly.toFixed(2)} °C
            </text>
          </>
        )}
      </svg>
      <div className="chart-legend" aria-hidden="true">
        <span><i /> {years[0]} — {years[years.length - 1]}</span>
        <span style={{ color: "var(--go)" }}><i style={{ background: "var(--go)" }} /> 0 °C</span>
      </div>
    </div>
  );
}
