import { parseGistemp } from "../lib/gistemp.ts";
// Amostra SINTÉTICA só para testar o formato do parser (não são dados da NASA).
const s = `Land-Ocean: Global Means
Year,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,J-D,D-N,DJF,MAM,JJA,SON
1880,-0.19,-0.25,-0.09,-0.17,-0.10,-0.22,-0.20,-0.12,-0.08,-0.15,-0.20,-0.17,-0.16,***,***,-0.14,-0.18,-0.14
2024,1.2,1.3,1.4,1.3,1.1,1.0,1.0,1.1,1.2,1.3,1.2,***,1.2,1.2,1.2,1.3,1.0,1.2
`;
const { rows, skipped } = parseGistemp(s);
const ok = rows.length === 23 && skipped === 1 && rows[0].year === 1880 && rows[0].anomaly === -0.19 && rows[rows.length - 1].month === 11;
console.log(ok ? "OK parser" : "FALHOU", rows.length, skipped);
const f = (a: number) => 440 * 2 ** (a / 4);
console.log("0 °C:", f(0), "Hz | 1.0 °C:", f(1).toFixed(1), "Hz | -0.5 °C:", f(-0.5).toFixed(1), "Hz");
process.exit(ok ? 0 : 1);
