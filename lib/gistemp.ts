export type Row = { year: number; month: number; anomaly: number };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const MONTHS_PT = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

/** Parses GISTEMP GLB.Ts+dSST.csv. Values are °C anomalies vs 1951-1980; "***" = missing. */
export function parseGistemp(text: string): { rows: Row[]; skipped: number; missing: { year: number; month: number }[] } {
  const lines = text.split(/\r?\n/);
  const h = lines.findIndex((l) => l.trim().startsWith("Year,"));
  if (h < 0) throw new Error("Cabeçalho 'Year,' não encontrado no CSV.");
  const head = lines[h].split(",").map((s) => s.trim());
  const col = MONTHS.map((m) => head.indexOf(m));
  if (col.some((c) => c < 0)) throw new Error("Colunas mensais ausentes no CSV.");
  const rows: Row[] = [];
  let skipped = 0; const missing: { year: number; month: number }[] = [];
  for (const line of lines.slice(h + 1)) {
    const c = line.split(",");
    const year = Number(c[0]);
    if (!Number.isInteger(year) || year < 1800) continue;
    col.forEach((ci, m) => {
      const raw = (c[ci] ?? "").trim();
      const v = Number(raw);
      if (raw === "" || raw.includes("*") || !Number.isFinite(v)) { skipped++; missing.push({ year, month: m + 1 }); return; }
      rows.push({ year, month: m + 1, anomaly: v });
    });
  }
  if (!rows.length) throw new Error("Nenhum valor válido encontrado.");
  return { rows, skipped, missing };
}
