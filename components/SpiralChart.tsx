import type { Row } from "../lib/gistemp";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/**
 * Climate spiral: one turn per year, angle = month, radius = anomaly.
 * The current month is highlighted with a warm marker.
 */
export default function SpiralChart({ rows, idx, label, desc, ring }: { rows: Row[]; idx: number; label: string; desc: string; ring: string }) {
  if (rows.length < 2) return null;
  const S = 640, C = S / 2, r0 = 74, R = 232;
  const mn = Math.min(...rows.map((r) => r.anomaly));
  const mx = Math.max(...rows.map((r) => r.anomaly));
  const rad = (a: number) => r0 + ((a - mn) / (mx - mn || 1)) * R;
  const pt = (r: Row) => {
    const th = ((r.month - 1) / 12) * 2 * Math.PI - Math.PI / 2;
    const rr = rad(r.anomaly);
    return [C + rr * Math.cos(th), C + rr * Math.sin(th)] as const;
  };
  const k = Math.max(0, Math.min(idx, rows.length - 1));
  const all = rows.map((r) => pt(r).map((v) => v.toFixed(1)).join(","));
  const cur = pt(rows[k]);
  const zeroR = mn < 0 && mx > 0 ? rad(0) : null;
  const firstYear = rows[0].year, lastYear = rows[rows.length - 1].year;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label={`${label}. ${desc}`}>
        <defs>
          <linearGradient id="spiral-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4cc9ec" />
            <stop offset=".55" stopColor="#7fe7ff" />
            <stop offset="1" stopColor="#c9b8ff" />
          </linearGradient>
          <radialGradient id="spiral-core" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="rgba(127,231,255,.10)" />
            <stop offset="1" stopColor="rgba(127,231,255,0)" />
          </radialGradient>
          <filter id="spiral-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <circle cx={C} cy={C} r={R + r0 + 6} fill="url(#spiral-core)" />
        <circle cx={C} cy={C} r={R + r0} fill="none" stroke="rgba(255,255,255,.07)" />
        <circle cx={C} cy={C} r={r0 - 10} fill="none" stroke="rgba(255,255,255,.06)" strokeDasharray="3 6" />

        {MONTHS.map((m, i) => {
          const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
          const rr = R + r0 + 16;
          return (
            <text key={i} x={C + rr * Math.cos(a)} y={C + rr * Math.sin(a) + 4} textAnchor="middle" fill="#8e9ab5" fontSize="13" fontFamily="ui-monospace, monospace">{m}</text>
          );
        })}

        {zeroR !== null && (
          <>
            <circle cx={C} cy={C} r={zeroR} fill="none" stroke="rgba(247,181,107,.5)" strokeDasharray="5 7" strokeWidth="1" />
            <text x={C + 6} y={C - zeroR - 6} fill="#f7b56b" fontSize="10" fontFamily="ui-monospace, monospace">{ring}</text>
          </>
        )}

        <polyline points={all.join(" ")} fill="none" stroke="rgba(127,231,255,.26)" strokeWidth="1.2" strokeLinejoin="round" />
        <polyline points={all.slice(0, k + 1).join(" ")} fill="none" stroke="url(#spiral-stroke)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={cur[0]} cy={cur[1]} r="14" fill="rgba(247,181,107,.16)" />
        <circle cx={cur[0]} cy={cur[1]} r="6" fill="#f7b56b" stroke="#05060b" strokeWidth="2" filter="url(#spiral-glow)" />

        <text x={C} y={C - 6} textAnchor="middle" fill="#8e9ab5" fontSize="10" letterSpacing="2" fontFamily="ui-monospace, monospace">SULCO</text>
        <text x={C} y={C + 14} textAnchor="middle" fill="#eef2fd" fontSize="17" fontFamily="ui-monospace, monospace" fontWeight="600">{rows[k].year}</text>
        <text x={C} y={C + 34} textAnchor="middle" fill="#6b7690" fontSize="10" fontFamily="ui-monospace, monospace">{firstYear} → {lastYear}</text>
      </svg>
      <div className="chart-legend" aria-hidden="true">
        <span><i /> {rows[k].month.toString().padStart(2, "0")}/{rows[k].year}</span>
        <span style={{ color: "var(--go)" }}><i style={{ background: "var(--go)" }} /> {ring}</span>
      </div>
    </div>
  );
}
