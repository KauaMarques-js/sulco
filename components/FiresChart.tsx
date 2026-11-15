import { useMemo } from "react";

type FireDay = { date: string; count: number; frpMean: number };

/** Bars are memoised on `days`; only the highlighted bar changes during playback. */
export default function FiresChart({ days, idx, desc, onSelect }: { days: FireDay[]; idx?: number; desc: string; onSelect?: (index: number) => void }) {
  const geo = useMemo(() => {
    if (!days.length) return null;
    const W = 1000, H = 300, M = { l: 48, r: 16, t: 24, b: 34 };
    const mc = Math.max(...days.map((x) => x.count)) || 1;
    const mf = Math.max(...days.map((x) => x.frpMean)) || 1;
    const bw = (W - M.l - M.r) / days.length;
    const base = H - M.b;
    const X = (i: number) => M.l + i * bw;
    const YC = (v: number) => base - (v / mc) * (H - M.t - M.b);
    const YF = (v: number) => base - (v / mf) * (H - M.t - M.b);
    const ticks = [0.5, 1].map((f) => Math.round(mc * f));
    const barW = Math.max(2, bw - Math.min(4, bw * 0.35));
    const bars = days.map((x, i) => ({
      key: x.date,
      x: X(i) + (bw - barW) / 2,
      y: YC(x.count),
      h: Math.max(1, base - YC(x.count)),
      w: barW,
      rx: Math.min(3, barW / 2),
    }));
    const frp = days.map((x, i) => `${X(i) + bw / 2},${YF(x.frpMean)}`).join(" ");
    return { W, H, M, ticks, YC, bars, frp, X, bw, base };
  }, [days]);

  if (!geo) return null;
  const active = idx !== undefined && idx >= 0 && idx < days.length ? geo.bars[idx] : null;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${geo.W} ${geo.H}`} role={onSelect ? "group" : "img"} aria-label={desc}>
        <defs>
          <linearGradient id="fire-bars" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7fe7ff" stopOpacity=".95" />
            <stop offset="1" stopColor="#2f8fb8" stopOpacity=".35" />
          </linearGradient>
          <linearGradient id="fire-bars-hi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#f7b56b" />
          </linearGradient>
        </defs>

        {geo.ticks.map((t) => (
          <g key={t}>
            <line x1={geo.M.l} x2={geo.W - geo.M.r} y1={geo.YC(t)} y2={geo.YC(t)} stroke="rgba(255,255,255,.055)" strokeDasharray="4 6" />
            <text x={geo.M.l - 10} y={geo.YC(t) + 4} textAnchor="end" fill="#6b7690" fontSize="11" fontFamily="ui-monospace, monospace">{t}</text>
          </g>
        ))}

        {geo.bars.map((b) => (
          <rect key={b.key} x={b.x} width={b.w} y={b.y} height={b.h} rx={b.rx} fill="url(#fire-bars)" />
        ))}

        {active && <rect x={active.x} width={active.w} y={active.y} height={active.h} rx={active.rx} fill="url(#fire-bars-hi)" />}

        <polyline fill="none" stroke="#f7b56b" strokeWidth="2.4" strokeDasharray="7 5" strokeLinecap="round" points={geo.frp} />

        {onSelect && days.map((day, i) => <rect key={`select-${day.date}`} x={geo.X(i)} y={geo.M.t} width={geo.bw} height={geo.base - geo.M.t} fill="transparent" role="button" tabIndex={0} aria-label={`${day.date} · ${day.count} · ${day.frpMean.toFixed(1)} MW`} onClick={() => onSelect(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(i); } }} style={{ cursor: "pointer" }} />)}

        <text x={geo.M.l} y={geo.H - 8} fill="#6b7690" fontSize="11" fontFamily="ui-monospace, monospace">{days[0].date}</text>
        <text x={geo.W - geo.M.r} y={geo.H - 8} textAnchor="end" fill="#6b7690" fontSize="11" fontFamily="ui-monospace, monospace">{days[days.length - 1].date}</text>
      </svg>
      <div className="chart-legend" aria-hidden="true">
        <span><i /> {days[0].date} → {days[days.length - 1].date}</span>
        <span style={{ color: "var(--go)" }}><i style={{ background: "var(--go)" }} /> FRP</span>
      </div>
    </div>
  );
}
