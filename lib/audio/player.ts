/** Sequenciador sem Web Audio: só índice + timers. Um único timer pendente por vez. */
export class Player {
  private i = 0; private timer: ReturnType<typeof setTimeout> | null = null;
  private on = false; private len = 0; speed = 1;
  private cb: { onNote: (k: number) => void; onEnd: () => void; onState: (playing: boolean) => void }; stepMs: number;
  constructor(cb: { onNote: (k: number) => void; onEnd: () => void; onState: (playing: boolean) => void }, stepMs = 150) { this.cb = cb; this.stepMs = stepMs; }
  get playing() { return this.on; }
  get next() { return this.i; }
  private clear() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } }
  private set(on: boolean) { if (this.on !== on) { this.on = on; this.cb.onState(on); } }
  private tick = () => {
    this.timer = null; if (!this.on) return;
    if (this.i >= this.len) { this.set(false); this.cb.onEnd(); return; }
    const k = this.i++; this.cb.onNote(k);
    this.timer = setTimeout(this.tick, this.stepMs / this.speed);
  };
  setLength(n: number) { this.stop(); this.len = n; }
  play() { if (this.on || !this.len) return; if (this.i >= this.len) this.i = 0; this.set(true); this.tick(); }
  pause() { this.clear(); this.set(false); }
  stop() { this.pause(); this.i = 0; }
  restart() { this.stop(); this.play(); }
  seek(k: number) { this.i = Math.max(0, Math.min(this.len - 1, k)); }
  setSpeed(s: number) { this.speed = s; if (this.on) { this.clear(); this.timer = setTimeout(this.tick, this.stepMs / s); } }
  dispose() { this.stop(); }
}
