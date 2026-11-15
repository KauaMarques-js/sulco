/** Escolha artística de mapeamento (não é relação física): 0 °C → 440 Hz; +4 °C → 880 Hz. */
export function climateFreq(anomalyC: number): number | null {
  if (!Number.isFinite(anomalyC) || Math.abs(anomalyC) > 20) return null;
  return 440 * Math.pow(2, anomalyC / 4);
}
