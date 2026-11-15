import { Player } from "../lib/audio/player.ts";
import { climateFreq } from "../lib/audio/mapping.ts";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let fails = 0; const ok = (c: boolean, m: string) => { console.log(c ? "OK  " : "FAIL", m); if (!c) fails++; };
const mk = (n = 20) => { const notes: number[] = []; let ended = 0; const p = new Player({ onNote: (k) => notes.push(k), onEnd: () => ended++, onState: () => {} }, 10); p.setLength(n); return { p, notes, ended: () => ended }; };

(async () => {
  let t = mk(); t.p.play(); await sleep(55); t.p.pause(); const n1 = t.notes.length; await sleep(60);
  ok(t.notes.length === n1 && n1 > 2, "pause para e mantém a posição");
  t.p.play(); await sleep(25); ok(t.notes[n1] === n1, "retomada continua do próximo índice, sem repetir"); t.p.stop();
  t = mk(); t.p.play(); await sleep(30); t.p.stop(); ok(t.p.next === 0 && !t.p.playing, "stop zera a posição");
  const c = t.notes.length; await sleep(40); ok(t.notes.length === c, "stop cancela eventos pendentes");
  t = mk(); t.p.play(); await sleep(30); t.p.restart(); await sleep(5); ok(t.notes.slice(-1)[0] <= 1, "restart começa do primeiro evento"); t.p.stop();
  t = mk(100); t.p.play(); for (const s of [2, 4, 0.5, 8, 1]) { t.p.setSpeed(s); await sleep(3); } await sleep(40);
  const sorted = t.notes.every((v, i) => i === 0 || v === t.notes[i - 1] + 1); ok(sorted, "troca de velocidade não duplica sequências"); t.p.stop();
  t = mk(3); t.p.play(); await sleep(80); ok(t.ended() === 1 && !t.p.playing, "fim da sequência chama onEnd uma vez");
  t = mk(5); t.p.play(); t.p.play(); await sleep(15); t.p.stop(); ok(new Set(t.notes).size === t.notes.length, "play duplo não cria dois timers");
  ok(climateFreq(0) === 440 && Math.abs(climateFreq(4)! - 880) < 1e-9 && climateFreq(NaN) === null && climateFreq(99) === null, "mapeamento: 0→440, +4→880, inválidos→null");
  ok(climateFreq(-1)! < 440 && climateFreq(1)! > 440, "mapeamento monotônico");
  process.exit(fails ? 1 : 0);
})();
