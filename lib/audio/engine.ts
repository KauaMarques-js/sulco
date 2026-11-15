export class AudioEngine {
  private voices = new Set<{ oscillator: OscillatorNode; gain: GainNode }>();
  ctx: AudioContext; master: GainNode; analyser: AnalyserNode;
  constructor() {
    this.ctx = new AudioContext(); this.master = this.ctx.createGain(); this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 1024;
    this.master.connect(this.analyser); this.analyser.connect(this.ctx.destination);
  }
  resume() { return this.ctx.resume(); }
  setVolume(v01: number) { this.master.gain.value = v01 * 0.3; } // teto seguro
  note(freq: number, durSec: number, delay = 0) {
    const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    const voice = { oscillator: o, gain: g }; this.voices.add(voice);
    o.type = "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.01); g.gain.linearRampToValueAtTime(0, t + durSec); // envelope sem cliques
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + durSec + 0.02);
    o.onended = () => { this.voices.delete(voice); o.disconnect(); g.disconnect(); };
  }
  cancel() {
    const time = this.ctx.currentTime;
    for (const { oscillator, gain } of this.voices) {
      gain.gain.cancelScheduledValues(time); gain.gain.setTargetAtTime(0, time, .005);
      oscillator.stop(time + .02);
    }
    this.voices.clear();
  }
  dispose() { this.cancel(); this.ctx.close().catch(() => {}); }
}
