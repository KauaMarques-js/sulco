import assert from "node:assert/strict";
import { AudioEngine } from "../lib/audio/engine.ts";
const original = globalThis.AudioContext;
const stopped: number[] = [];
let disconnected = 0;
const param = () => ({value:1,setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}});
class Context {
  currentTime = 10; destination = {};
  createGain() { return {gain:param(),connect(){},disconnect(){disconnected++;}}; }
  createAnalyser() { return {fftSize:0,connect(){}}; }
  createOscillator() { return {type:'sine',frequency:{value:440},connect(){},start(){},stop(time:number){stopped.push(time);},disconnect(){disconnected++;},onended:null}; }
  resume() { return Promise.resolve(); } close(){return Promise.resolve();}
}
try {
  globalThis.AudioContext = Context as unknown as typeof AudioContext;
  const engine = new AudioEngine(); engine.note(440,.5); engine.note(500,.1,5);
  assert.deepEqual(stopped,[10.52,15.12]);
  engine.cancel(); assert.deepEqual(stopped.slice(-2),[10.02,10.02]);
  engine.cancel(); assert.equal(stopped.length,4); engine.note(660,.1); engine.dispose(); assert.equal(stopped.at(-1),10.02);
  console.log('OK audio: pause/stop cancels current and future notes, cancellation is repeatable, playback can start again');
} finally { globalThis.AudioContext = original; }
