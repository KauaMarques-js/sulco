export class AudioEngine {
  ctx: AudioContext; master: GainNode; analyser: AnalyserNode;
  constructor() {
    this.ctx = new AudioContext(); this.master = this.ctx.createGain(); this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 1024;
    this.master.connect(this.analyser); this.analyser.connect(this.ctx.destination);
  }
  resume() { return this.ctx.resume(); }
  setVolume(v01: number) { this.master.gain.value = v01 * 0.3; } // teto seguro
  note(freq: number, durSec: number, delay = 0) {
    const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.01); g.gain.linearRampToValueAtTime(0, t + durSec); // envelope sem cliques
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + durSec + 0.02);
    o.onended = () => { o.disconnect(); g.disconnect(); };
  }
  dispose() { this.ctx.close().catch(() => {}); }
}
