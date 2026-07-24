// Clarity — ambient sound for focus sessions, synthesised in the browser.
//
// Every layer here is generated from noise and oscillators, so the app ships no
// audio files at all: no megabytes to download, no loop seam to hear, and it
// keeps working offline in the Capacitor build.
import type { SoundscapeId } from "./clarityStore";

export const SOUNDSCAPES: { id: SoundscapeId; name: string; detail: string }[] = [
  { id: "none", name: "Silence", detail: "No sound at all" },
  { id: "wind", name: "Open sand", detail: "Low wind over dunes" },
  { id: "drone", name: "Deep hum", detail: "A steady room tone" },
  { id: "rain", name: "Rain", detail: "Steady, close rainfall" },
];

/** A couple of seconds of brown noise, looped. Brown falls off faster than
 *  white, so it reads as "wind" rather than "static". */
function brownNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buf;
}

function whiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export interface SoundHandle {
  stop: () => void;
  setVolume: (v: number) => void;
}

/**
 * Start a soundscape. Returns a handle, or null when the id is "none" or the
 * browser has no Web Audio. Fades in and out so nothing ever clicks.
 */
export function playSoundscape(id: SoundscapeId, volume = 0.35): SoundHandle | null {
  if (id === "none") return null;

  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  let ctx: AudioContext;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2.5);
  master.connect(ctx.destination);

  const nodes: { start?: () => void; stop?: (t: number) => void }[] = [];

  if (id === "wind" || id === "rain") {
    const src = ctx.createBufferSource();
    src.buffer = id === "wind" ? brownNoiseBuffer(ctx) : whiteNoiseBuffer(ctx);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    if (id === "wind") {
      filter.type = "lowpass";
      filter.frequency.value = 420;
      filter.Q.value = 0.6;
    } else {
      filter.type = "bandpass";
      filter.frequency.value = 1400;
      filter.Q.value = 0.4;
    }

    // A slow sweep across the filter keeps it from sounding like a flat hiss.
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = id === "wind" ? 0.06 : 0.14;
    lfoGain.gain.value = id === "wind" ? 180 : 320;
    lfo.connect(lfoGain).connect(filter.frequency);

    src.connect(filter).connect(master);
    src.start();
    lfo.start();
    nodes.push(src, lfo);
  }

  if (id === "drone" || id === "wind") {
    // A quiet stack of fifths under everything, slightly detuned so it breathes.
    const freqs = id === "drone" ? [55, 82.5, 110] : [41.2];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      osc.detune.value = i * 4 - 4;

      const g = ctx.createGain();
      g.gain.value = id === "drone" ? 0.09 / (i + 1) : 0.05;

      const trem = ctx.createOscillator();
      const tremGain = ctx.createGain();
      trem.frequency.value = 0.08 + i * 0.03;
      tremGain.gain.value = 0.03;
      trem.connect(tremGain).connect(g.gain);

      osc.connect(g).connect(master);
      osc.start();
      trem.start();
      nodes.push(osc, trem);
    });
  }

  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      const end = ctx.currentTime + 1.2;
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, end);
        nodes.forEach((n) => n.stop?.(end + 0.05));
        window.setTimeout(() => ctx.close().catch(() => {}), 1500);
      } catch {
        ctx.close().catch(() => {});
      }
    },
    setVolume(v: number) {
      try {
        master.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.2);
      } catch {
        /* context already closed */
      }
    },
  };
}
