import { useMemo } from "react";
import type { compareClimate } from "../lib/data/compareClimate";

type Model = ReturnType<typeof compareClimate>;
export default function ComparisonChart({ model, active, index, title, description, lang }: { model: Model; active?: "a" | "b"; index: number; title: string; description: string; lang: string }) {
  const geometry = useMemo(() => {
    const values = [...model.a.years, ...model.b.years].map(row => row.anomaly);
    const low = Math.min(0, ...values) - .1, high = Math.max(0, ...values) + .1;
    const x = (k: number) => 80 + k / Math.max(1, model.a.years.length - 1) * 850;
    const y = (value: number) => 245 - (value - low) / (high - low) * 200;
    const path = (key: "a" | "b") => model[key].years.map((point, k) => `${k ? "L" : "M"}${x(k)} ${y(point.anomaly)}`).join(" ");
    return { x, y, a: path("a"), b: path("b"), low, high };
  }, [model]);
  const cursor = active ? model[active].years[Math.min(index, model[active].years.length - 1)] : null;
  const nf = new Intl.NumberFormat(lang, { maximumFractionDigits: 2 });
  return <figure className="comparison-chart"><figcaption><strong>{title}</strong><span>A: {model.a.start}–{model.a.end} (━━) · B: {model.b.start}–{model.b.end} (┄┄)</span></figcaption><svg viewBox="0 0 1000 300" role="img" aria-label={description}>
    <line x1="80" x2="930" y1={geometry.y(0)} y2={geometry.y(0)} className="comparison-zero" />
    <path d={geometry.a} className="comparison-line-a" /><path d={geometry.b} className="comparison-line-b" />
    <g className="comparison-axis">{Math.abs(geometry.y(0) + 8 - 50) > 30 && <text x="10" y="50">{nf.format(geometry.high)}</text>}<text x="10" y={geometry.y(0) + 8}>0</text>{Math.abs(geometry.y(0) + 8 - 250) > 30 && <text x="10" y="250">{nf.format(geometry.low)}</text>}<text x="80" y="290">1</text><text x="930" y="290" textAnchor="end">{model.a.years.length}</text></g>
    {cursor && <circle cx={geometry.x(Math.min(index, model.a.years.length - 1))} cy={geometry.y(cursor.anomaly)} r="9" className="comparison-cursor" />}
  </svg></figure>;
}
