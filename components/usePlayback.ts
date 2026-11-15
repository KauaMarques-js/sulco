"use client";
import { useEffect, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { Player } from "../lib/audio/player";
import { AudioEngine } from "../lib/audio/engine";

type CB<T> = { note: (it: T, speed: number, e: AudioEngine) => void; step?: (it: T, k: number) => void; end?: () => void };
/** Player + áudio + onda/espectro em tempo real. Callbacks lidos via ref (sem closures velhas). */
export function usePlayback<T>(items: T[], cb: CB<T>) {
  const { prefs } = useApp();
  const [idx, setIdx] = useState(0), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(0.5), [vol, setVol] = useState(40);
  const P = useRef<Player | null>(null), E = useRef<AudioEngine | null>(null), itemsRef = useRef(items), cbRef = useRef(cb), cv = useRef<HTMLCanvasElement>(null);
  cbRef.current = cb;
  useEffect(() => {
    const p = new Player({
      onNote: (k) => { const it = itemsRef.current[k]; if (it === undefined) return; if (E.current) cbRef.current.note(it, p.speed, E.current); setIdx(k); cbRef.current.step?.(it, k); },
      onEnd: () => cbRef.current.end?.(), onState: setPlaying,
    });
    P.current = p;
    return () => { p.dispose(); E.current?.dispose(); E.current = null; P.current = null; };
  }, []);
  useEffect(() => { itemsRef.current = items; P.current?.setLength(items.length); setIdx(0); }, [items]);
  useEffect(() => { P.current?.setSpeed(speed); }, [speed]);
  useEffect(() => { E.current?.setVolume(vol / 100); }, [vol]);
  useEffect(() => {
    const c = cv.current; if (!c) return; const g = c.getContext("2d")!; g.clearRect(0, 0, c.width, c.height); if (!playing || prefs.rm || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; let id = 0;
    const loop = () => {
      const a = E.current?.analyser;
      if (a) {
        const W = c.width, H = c.height, t = new Uint8Array(a.fftSize), f = new Uint8Array(a.frequencyBinCount); a.getByteTimeDomainData(t); a.getByteFrequencyData(f);
        g.clearRect(0, 0, W, H); g.strokeStyle = "#35e0ff"; g.lineWidth = 2; g.beginPath();
        for (let i = 0; i < t.length; i++) { const x = (i / t.length) * W, y = (t[i] / 255) * (H / 2); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
        g.fillStyle = "#ffa23a"; for (let i = 0; i < 64; i++) { const h = (f[i * 2] / 255) * (H / 2); g.fillRect(i * (W / 64), H - h, W / 64 - 2, h); }
      }
      id = requestAnimationFrame(loop);
    };
    loop(); return () => cancelAnimationFrame(id);
  }, [playing, prefs.rm]);
  const ensure = async () => { if (!E.current) E.current = new AudioEngine(); await E.current.resume(); E.current.setVolume(vol / 100); };
  return {
    idx, setIdx, playing, speed, setSpeed, vol, setVol, cv,
    play: async () => { await ensure(); P.current?.play(); }, pause: () => P.current?.pause(), stop: () => { P.current?.stop(); setIdx(0); },
    restart: async () => { await ensure(); P.current?.restart(); }, seek: (k: number) => { P.current?.seek(k); setIdx(k); },
    hearOne: async (k: number) => { await ensure(); const it = itemsRef.current[k]; if (it !== undefined && E.current) cbRef.current.note(it, 0.3, E.current); },
    paused: () => !playing && idx > 0 && idx < items.length - 1,
  };
}
