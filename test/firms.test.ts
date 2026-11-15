import { parseFirms, aggregateDaily, rolling } from "../lib/firms.ts";
let fails = 0; const ok = (c: boolean, m: string) => { console.log(c ? "OK  " : "FAIL", m); if (!c) fails++; };
// CSV SINTÉTICO apenas para testar a lógica (não são dados do FIRMS).
const csv = `latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
-10,-55,330,0.4,0.4,2026-01-01,0100,N,VIIRS,n,2.0NRT,290,10.0,D
-11,-56,330,0.4,0.4,2026-01-01,0100,N,VIIRS,n,2.0NRT,290,20.0,D
-11,-56,330,0.4,0.4,2026-01-02,0100,N,VIIRS,h,2.0NRT,290,30.0,N
-11,-56,330,0.4,0.4,bad-date,0100,N,VIIRS,h,2.0NRT,290,30.0,N
-11,-56,330,0.4,0.4,2026-01-03,0100,N,VIIRS,h,2.0NRT,290,abc,N`;
const p = parseFirms(csv), d = aggregateDaily(p.rows);
ok(p.rows.length === 3 && p.skipped === 2 && p.versions[0] === "2.0NRT", "parser: 3 válidas, 2 inválidas ignoradas, versão registrada");
ok(d.length === 2 && d[0].count === 2 && d[0].frpMean === 15 && d[0].frpSum === 30, "agregação diária: contagem, FRP médio e soma separados");
const r = rolling(d, 5); ok(r[1].count === 3 && r[1].frpSum === 60 && r[1].frpMean === 20, "janela móvel de 5 dias soma detecções e FRP");
let threw = false; try { parseFirms("Invalid MAP_KEY"); } catch { threw = true; } ok(threw, "resposta que não é CSV gera erro");
process.exit(fails ? 1 : 0);
