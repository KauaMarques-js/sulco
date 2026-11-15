export default function FiresChart({ days, idx, desc, onSelect }: { days: { date: string; count: number; frpMean: number }[]; idx?: number; desc: string; onSelect?: (index: number) => void }) {
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

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role={onSelect ? "group" : "img"} aria-label={desc}>
        <defs>
          <linearGradient id="fire-bars" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7fe7ff" stopOpacity=".95" />
            <stop offset="1" stopColor="#2f8fb8" stopOpacity=".35" />
          </linearGradient>
          <linearGradient id="fire-bars-hi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#f7b56b" />
          </linearGradient>
          <filter id="fire-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={YC(t)} y2={YC(t)} stroke="rgba(255,255,255,.055)" strokeDasharray="4 6" />
            <text x={M.l - 10} y={YC(t) + 4} textAnchor="end" fill="#6b7690" fontSize="11" fontFamily="ui-monospace, monospace">{t}</text>
          </g>
        ))}

        {days.map((x, i) => {
          const w = Math.max(2, bw - Math.min(4, bw * 0.35));
          return <rect key={x.date} x={X(i) + (bw - w) / 2} width={w} y={YC(x.count)} height={Math.max(1, base - YC(x.count))} rx={Math.min(3, w / 2)} fill={i === idx ? "url(#fire-bars-hi)" : "url(#fire-bars)"} filter={i === idx ? "url(#fire-glow)" : undefined} />;
        })}

        <polyline fill="none" stroke="#f7b56b" strokeWidth="2.4" strokeDasharray="7 5" strokeLinecap="round" points={days.map((x, i) => `${X(i) + bw / 2},${YF(x.frpMean)}`).join(" ")} />

        {onSelect && days.map((x, i) => <rect key={`select-${x.date}`} x={X(i)} y={M.t} width={bw} height={base - M.t} fill="transparent" role="button" tabIndex={0} aria-label={`${x.date} · ${x.count} · ${x.frpMean.toFixed(1)} MW`} onClick={() => onSelect(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(i); } }} style={{ cursor: "pointer" }} />)}

        <text x={M.l} y={H - 8} fill="#6b7690" fontSize="11" fontFamily="ui-monospace, monospace">{days[0].date}</text>
        <text x={W - M.r} y={H - 8} textAnchor="end" fill="#6b7690" fontSize="11" fontFamily="ui-monospace, monospace">{days[days.length - 1].date}</text>
      </svg>
      <div className="chart-legend" aria-hidden="true">
        <span><i /> {days[0].date} → {days[days.length - 1].date}</span>
        <span style={{ color: "var(--go)" }}><i style={{ background: "var(--go)" }} /> FRP</span>
      </div>
    </div>
  );
}
