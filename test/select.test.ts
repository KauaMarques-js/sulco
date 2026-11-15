import { indexFor } from "../lib/data/select.ts";
import { climateFreq } from "../lib/audio/mapping.ts";
let fails = 0; const ok = (c: boolean, m: string) => { console.log(c ? "OK  " : "FAIL", m); if (!c) fails++; };
// Série SINTÉTICA apenas para teste de lógica (não são dados da NASA).
const rows: { year: number; month: number; anomaly: number }[] = [];
for (const y of [1989, 1990, 2025]) for (let m = 1; m <= (y === 2025 ? 8 : 12); m++) rows.push({ year: y, month: m, anomaly: (y - 1990) / 10 + m / 100 });
const i = indexFor(rows, 1990, 3);
ok(rows[i].year === 1990 && rows[i].month === 3, "março de 1990 aponta para o registro de março de 1990");
ok(climateFreq(rows[i].anomaly) === 440 * 2 ** (rows[i].anomaly / 4), "frequência vem do mesmo registro selecionado");
ok(rows[indexFor(rows, 2025, 11)].month === 8, "mês inexistente no ano em andamento usa o mais próximo do mesmo ano");
ok(indexFor(rows, 1700, 1) === -1, "ano fora do intervalo → -1");
ok(indexFor(rows, 1990, 13) === -1 && indexFor(rows, 1990, 0) === -1 && indexFor(rows, 1990, 2.5) === -1, "mês inválido → -1");
process.exit(fails ? 1 : 0);
