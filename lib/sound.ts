// Tiny WebAudio blips so we don't ship audio files.
let ctx: AudioContext | null = null;

function tone(freq: number, ms: number, type: OscillatorType = "sine", gain = 0.08, delay = 0) {
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime + delay / 1000;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + ms / 1000);
  } catch {
    /* audio not available */
  }
}

const vibrate = (p: number | number[]) => {
  try {
    navigator.vibrate?.(p);
  } catch {}
};

export const sfx = {
  tap: () => tone(520, 60, "triangle", 0.05),
  tick: () => tone(880, 50, "square", 0.03),
  correct: () => { tone(660, 120, "triangle"); tone(990, 180, "triangle", 0.08, 110); },
  wrong: () => { tone(220, 250, "sawtooth", 0.05); vibrate(120); },
  found: () => { tone(440, 100); tone(660, 100, "sine", 0.08, 100); tone(880, 160, "sine", 0.08, 200); vibrate([40, 40, 40]); },
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 220, "triangle", 0.09, i * 120)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, 260, "sine", 0.07, i * 160)),
};
