import type { Row } from "../gistemp.ts";
export const validMonth = (m: number) => Number.isInteger(m) && m >= 1 && m <= 12;
/** Índice do registro (ano, mês). Se o mês não existir naquele ano (ex.: ano em andamento), usa o mais próximo do MESMO ano. -1 se não houver dado. */
export function indexFor(sel: Row[], year: number, month: number): number {
  if (!validMonth(month) || !Number.isInteger(year)) return -1;
  const exact = sel.findIndex((r) => r.year === year && r.month === month);
  if (exact >= 0) return exact;
  let best = -1;
  sel.forEach((r, i) => { if (r.year === year && (best < 0 || Math.abs(r.month - month) < Math.abs(sel[best].month - month))) best = i; });
  return best;
}
