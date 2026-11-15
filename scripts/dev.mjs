// One development server per checkout: two Next processes corrupt the same .next cache.
import { openSync, readFileSync, writeFileSync, closeSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
const lock = resolve(".sulco-dev.lock");
const args = process.argv.slice(2);
let acquired = false;
for (let attempt = 0; attempt < 2; attempt++) {
  try { const fd = openSync(lock, "wx"); writeFileSync(fd, JSON.stringify({ pid: process.pid })); closeSync(fd); acquired = true; break; }
  catch (e) {
    if (e.code !== "EEXIST") throw e;
    let pid;
    try { pid = JSON.parse(readFileSync(lock, "utf8")).pid; } catch {}
    if (Number.isInteger(pid)) {
      try { process.kill(pid, 0); console.error("Já existe um servidor de desenvolvimento neste projeto. Use a prévia aberta ou pare esse processo antes de iniciar outro."); process.exit(1); }
      catch (error) { if (error.code !== "ESRCH") throw error; }
    }
    try { unlinkSync(lock); } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
}
if (!acquired) process.exit(1);
const cleanup = () => { try { if (JSON.parse(readFileSync(lock, "utf8")).pid === process.pid) unlinkSync(lock); } catch {} };
const child = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "dev", ...args], { stdio: "inherit", env: process.env });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("error", (error) => { console.error(error.message); cleanup(); process.exit(1); });
child.on("exit", (code, signal) => { cleanup(); process.exit(code ?? (signal ? 130 : 1)); });
process.on("exit", cleanup);
