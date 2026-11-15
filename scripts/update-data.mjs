// Uso: npm run update-data            (baixa da NASA)
//      npm run update-data -- --from-file C:\caminho\GLB.Ts+dSST.csv   (arquivo colocado manualmente)
//      --out <pasta> muda a pasta de saída (padrão: public/data/climate)
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseGistemp } from "../lib/gistemp.ts";
const URL_CSV = "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv";
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const out = arg("--out") ?? "public/data/climate", file = arg("--from-file");
let text, origin;
try {
  if (file) { text = await readFile(file, "utf8"); origin = `arquivo manual: ${file}`; }
  else {
    const r = await fetch(URL_CSV, { signal: AbortSignal.timeout(20000), headers: { "User-Agent": "SULCO/1.0 (NASA Space Apps; public data)" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`); text = await r.text(); origin = URL_CSV;
  }
  if (text.trimStart().startsWith("<")) throw new Error("A resposta é HTML, não CSV.");
  const { rows, skipped } = parseGistemp(text);
  const sha256 = createHash("sha256").update(text).digest("hex"), retrievedAt = new Date().toISOString();
  await mkdir(out, { recursive: true });
  await writeFile(`${out}/gistemp_monthly.csv`, text);
  const meta = { name: "GISTEMP v4 Global-mean monthly Land-Ocean Temperature Index", originalUrl: URL_CSV, obtainedFrom: origin, retrievedAt, sha256,
    variable: "temperature anomaly", unit: "°C", baseline: "1951–1980", firstYear: rows[0].year, lastYear: rows[rows.length - 1].year, validMonths: rows.length, missingMonthsSkipped: skipped,
    credits: "NASA Goddard Institute for Space Studies (GISS)", processing: "Parsed by lib/gistemp.ts; '***' and empty cells skipped; values unchanged." };
  await writeFile(`${out}/metadata.json`, JSON.stringify(meta, null, 2));
  await writeFile(`${out}/README-source.txt`, `Fonte: ${URL_CSV}\nObtido em: ${retrievedAt}\nSHA-256: ${sha256}\nAnomalias em °C relativas a 1951–1980. Meses ausentes ('***') não são preenchidos.\nPara atualizar: npm run update-data\nManual: baixe o CSV no navegador e rode npm run update-data -- --from-file CAMINHO\n`);
  console.log(`OK: ${rows.length} meses (${meta.firstYear}–${meta.lastYear}), ${skipped} ausentes. SHA-256 ${sha256.slice(0, 12)}… → ${out}`);
} catch (e) {
  console.error(`FALHA: ${e.message}\nBaixe manualmente ${URL_CSV}\nSalve o arquivo e rode: npm run update-data -- --from-file CAMINHO_DO_ARQUIVO\n(ou copie-o para ${out}/gistemp_monthly.csv e crie metadata.json).`);
  process.exit(1);
}
