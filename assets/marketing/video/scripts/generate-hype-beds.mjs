import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, "..", "public", "audio");

const sampleRate = 44100;
const durationSeconds = 36;
const totalSamples = sampleRate * durationSeconds;
const bytesPerSample = 2;
const channels = 1;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const notes = {
  E2: 82.41,
  G2: 98.0,
  A2: 110.0,
  B2: 123.47,
  D3: 146.83,
  E3: 164.81,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  D4: 293.66,
  E4: 329.63,
  Fs4: 369.99,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
};

const variants = [
  {
    slug: "arcade-drive",
    bpm: 164,
    leadPattern: [notes.E4, notes.G4, notes.A4, notes.B4, notes.A4, notes.G4, notes.E4, notes.D4],
    bassPattern: [notes.E2, notes.E2, notes.G2, notes.A2, notes.E2, notes.D3, notes.G2, notes.B2],
    leadMix: 0.34,
    bassMix: 0.22,
    kickMix: 0.32,
    snareMix: 0.1,
    hatMix: 0.065,
    arpMix: 0.16,
    pulseMix: 0.08,
    sawMix: 0.28,
  },
  {
    slug: "stadium-rush",
    bpm: 152,
    leadPattern: [notes.E4, notes.Fs4, notes.A4, notes.B4, notes.A4, notes.Fs4, notes.E4, notes.D4],
    bassPattern: [notes.E2, notes.E2, notes.B2, notes.A2, notes.E2, notes.D3, notes.B2, notes.A2],
    leadMix: 0.24,
    bassMix: 0.26,
    kickMix: 0.36,
    snareMix: 0.13,
    hatMix: 0.055,
    arpMix: 0.08,
    pulseMix: 0.16,
    sawMix: 0.22,
  },
  {
    slug: "night-sprint",
    bpm: 176,
    leadPattern: [notes.E4, notes.G4, notes.B4, notes.A4, notes.G4, notes.E4, notes.D4, notes.G4],
    bassPattern: [notes.E2, notes.G2, notes.A2, notes.B2, notes.E2, notes.G2, notes.D3, notes.A2],
    leadMix: 0.29,
    bassMix: 0.24,
    kickMix: 0.34,
    snareMix: 0.11,
    hatMix: 0.075,
    arpMix: 0.19,
    pulseMix: 0.09,
    sawMix: 0.25,
  },
  {
    slug: "broadcast-blitz",
    bpm: 148,
    leadPattern: [notes.E4, notes.G4, notes.A4, notes.G4, notes.E4, notes.D4, notes.E4, notes.G4],
    bassPattern: [notes.E2, notes.E2, notes.A2, notes.A2, notes.E2, notes.D3, notes.A2, notes.B2],
    leadMix: 0.13,
    bassMix: 0.28,
    kickMix: 0.42,
    snareMix: 0.15,
    hatMix: 0.03,
    arpMix: 0.03,
    pulseMix: 0.06,
    sawMix: 0.05,
    clapMix: 0.18,
    tomMix: 0.12,
    gritMix: 0.08,
  },
  {
    slug: "halftime-charge",
    bpm: 144,
    leadPattern: [notes.E4, notes.Fs4, notes.A4, notes.Fs4, notes.E4, notes.D4, notes.E4, notes.B3],
    bassPattern: [notes.E2, notes.B2, notes.A2, notes.A2, notes.E2, notes.B2, notes.D3, notes.A2],
    leadMix: 0.11,
    bassMix: 0.3,
    kickMix: 0.4,
    snareMix: 0.14,
    hatMix: 0.025,
    arpMix: 0.02,
    pulseMix: 0.05,
    sawMix: 0.04,
    clapMix: 0.2,
    tomMix: 0.15,
    gritMix: 0.1,
  },
  {
    slug: "pregame-push",
    bpm: 154,
    leadPattern: [notes.E4, notes.G4, notes.B4, notes.A4, notes.G4, notes.E4, notes.D4, notes.E4],
    bassPattern: [notes.E2, notes.G2, notes.A2, notes.B2, notes.E2, notes.G2, notes.D3, notes.A2],
    leadMix: 0.12,
    bassMix: 0.27,
    kickMix: 0.39,
    snareMix: 0.13,
    hatMix: 0.03,
    arpMix: 0.025,
    pulseMix: 0.05,
    sawMix: 0.05,
    clapMix: 0.16,
    tomMix: 0.13,
    gritMix: 0.12,
  },
  {
    slug: "pregame-swagger-safe",
    bpm: 150,
    leadPattern: [notes.E4, notes.G4, notes.A4, notes.G4, notes.E4, notes.D4, notes.E4, notes.G4],
    bassPattern: [notes.E2, notes.G2, notes.A2, notes.A2, notes.E2, notes.G2, notes.D3, notes.A2],
    leadMix: 0.09,
    bassMix: 0.29,
    kickMix: 0.41,
    snareMix: 0.13,
    hatMix: 0.022,
    arpMix: 0.01,
    pulseMix: 0.03,
    sawMix: 0.02,
    clapMix: 0.18,
    tomMix: 0.11,
    gritMix: 0.06,
  },
  {
    slug: "pregame-swagger-core",
    bpm: 154,
    leadPattern: [notes.E4, notes.G4, notes.B4, notes.A4, notes.G4, notes.E4, notes.D4, notes.E4],
    bassPattern: [notes.E2, notes.G2, notes.A2, notes.B2, notes.E2, notes.G2, notes.D3, notes.A2],
    leadMix: 0.11,
    bassMix: 0.28,
    kickMix: 0.4,
    snareMix: 0.13,
    hatMix: 0.024,
    arpMix: 0.015,
    pulseMix: 0.035,
    sawMix: 0.03,
    clapMix: 0.19,
    tomMix: 0.12,
    gritMix: 0.095,
  },
  {
    slug: "pregame-swagger-bite",
    bpm: 156,
    leadPattern: [notes.E4, notes.G4, notes.B4, notes.A4, notes.G4, notes.E4, notes.D4, notes.G4],
    bassPattern: [notes.E2, notes.G2, notes.A2, notes.B2, notes.E2, notes.G2, notes.D3, notes.B2],
    leadMix: 0.13,
    bassMix: 0.27,
    kickMix: 0.39,
    snareMix: 0.14,
    hatMix: 0.026,
    arpMix: 0.01,
    pulseMix: 0.03,
    sawMix: 0.035,
    clapMix: 0.2,
    tomMix: 0.13,
    gritMix: 0.14,
  },
  {
    slug: "broadcast-drums",
    mode: "broadcast-drums",
    bpm: 146,
    leadPattern: [notes.E4, notes.G4, notes.A4, notes.G4, notes.E4, notes.D4, notes.E4, notes.G4],
    bassPattern: [notes.E2, notes.E2, notes.A2, notes.A2, notes.E2, notes.D3, notes.A2, notes.B2],
    leadMix: 0.04,
    bassMix: 0.22,
    kickMix: 0.46,
    snareMix: 0.11,
    hatMix: 0.018,
    arpMix: 0,
    pulseMix: 0.02,
    sawMix: 0,
    clapMix: 0.24,
    tomMix: 0.2,
    gritMix: 0.04,
  },
  {
    slug: "arena-rock-lite",
    mode: "arena-rock-lite",
    bpm: 152,
    leadPattern: [notes.E4, notes.G4, notes.B4, notes.A4, notes.G4, notes.E4, notes.D4, notes.E4],
    bassPattern: [notes.E2, notes.G2, notes.A2, notes.B2, notes.E2, notes.G2, notes.D3, notes.A2],
    leadMix: 0.16,
    bassMix: 0.25,
    kickMix: 0.38,
    snareMix: 0.12,
    hatMix: 0.024,
    arpMix: 0,
    pulseMix: 0.015,
    sawMix: 0.04,
    clapMix: 0.14,
    tomMix: 0.1,
    gritMix: 0.1,
  },
  {
    slug: "trailer-sport",
    mode: "trailer-sport",
    bpm: 138,
    leadPattern: [notes.E4, notes.D4, notes.G4, notes.A4, notes.E4, notes.D4, notes.B3, notes.D4],
    bassPattern: [notes.E2, notes.E2, notes.D3, notes.A2, notes.E2, notes.E2, notes.D3, notes.B2],
    leadMix: 0.1,
    bassMix: 0.28,
    kickMix: 0.4,
    snareMix: 0.08,
    hatMix: 0.012,
    arpMix: 0,
    pulseMix: 0.035,
    sawMix: 0.02,
    clapMix: 0.1,
    tomMix: 0.18,
    gritMix: 0.06,
  },
];

const writeWavHeader = (buffer, dataSize) => {
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);
};

const makeKick = (t, beat, mix) => {
  const env = Math.exp(-18 * (beat % 1));
  return mix * env * Math.sin(2 * Math.PI * (48 + 22 * env) * t);
};

const makeSnare = (t, beat, mix) => {
  const backbeatDistance = Math.abs((beat % 2) - 1);
  const env = Math.exp(-60 * backbeatDistance * backbeatDistance);
  const noise =
    0.45 * Math.sin(2 * Math.PI * 1700 * t) +
    0.35 * Math.sin(2 * Math.PI * 2400 * t) +
    0.2 * Math.sin(2 * Math.PI * 3100 * t);
  return mix * env * noise;
};

const makeHat = (t, beat, mix) => {
  const sixteenth = (beat * 4) % 1;
  const env = Math.exp(-70 * sixteenth);
  const noise =
    0.4 * Math.sin(2 * Math.PI * 4800 * t) +
    0.35 * Math.sin(2 * Math.PI * 6200 * t) +
    0.25 * Math.sin(2 * Math.PI * 7600 * t);
  return mix * env * noise;
};

const makeClap = (t, beat, mix) => {
  const backbeatDistance = Math.abs((beat % 2) - 1);
  const env = Math.exp(-95 * backbeatDistance * backbeatDistance);
  const body =
    0.45 * Math.sin(2 * Math.PI * 900 * t) +
    0.35 * Math.sin(2 * Math.PI * 1350 * t) +
    0.2 * Math.sin(2 * Math.PI * 1900 * t);
  const tail = 0.55 + 0.45 * Math.sin(2 * Math.PI * 18 * t);
  return mix * env * body * tail;
};

const makeTom = (t, beat, mix) => {
  const subdivision = beat % 1;
  const accents = [0, 0.5, 0.75];
  let env = 0;
  for (const accent of accents) {
    const distance = Math.abs(subdivision - accent);
    env += Math.exp(-130 * distance * distance);
  }

  const tone =
    0.7 * Math.sin(2 * Math.PI * 128 * t) +
    0.3 * Math.sin(2 * Math.PI * 196 * t);
  return mix * env * tone;
};

const makeBoom = (t, beat, mix) => {
  const subdivisions = [0, 0.5];
  let env = 0;
  for (const subdivision of subdivisions) {
    const distance = Math.abs((beat % 1) - subdivision);
    env += Math.exp(-180 * distance * distance);
  }

  const tone =
    0.8 * Math.sin(2 * Math.PI * 72 * t) +
    0.2 * Math.sin(2 * Math.PI * 110 * t);
  return mix * env * tone;
};

const makeImpact = (t, beat, mix) => {
  const measureBeat = beat % 4;
  const distance = Math.min(Math.abs(measureBeat), Math.abs(measureBeat - 2));
  const env = Math.exp(-50 * distance * distance);
  const hit =
    0.45 * Math.sin(2 * Math.PI * 240 * t) +
    0.35 * Math.sin(2 * Math.PI * 520 * t) +
    0.2 * Math.sin(2 * Math.PI * 910 * t);
  return mix * env * hit;
};

const makeLead = (t, beat, config) => {
  const step = Math.floor(beat * 2) % config.leadPattern.length;
  const freq = config.leadPattern[step];
  const gate = 0.28 + 0.72 * Math.max(0, Math.sin(Math.PI * ((beat * 2) % 1)));
  const saw =
    Math.sin(2 * Math.PI * freq * t) +
    0.55 * Math.sin(2 * Math.PI * freq * 2 * t) +
    0.25 * Math.sin(2 * Math.PI * freq * 3 * t);
  return config.leadMix * gate * (0.55 * saw + config.sawMix * Math.sign(Math.sin(2 * Math.PI * freq * t)));
};

const makeBroadcastLead = (t, beat, config) => {
  const step = Math.floor(beat * 2) % config.leadPattern.length;
  const freq = config.leadPattern[step];
  const gate = 0.22 + 0.78 * Math.max(0, Math.sin(Math.PI * ((beat * 2) % 1)));
  const tone =
    0.7 * Math.sin(2 * Math.PI * freq * t) +
    0.2 * Math.sin(2 * Math.PI * freq * 2 * t) +
    0.1 * Math.sin(2 * Math.PI * freq * 3 * t);
  const grit = config.gritMix * Math.sign(Math.sin(2 * Math.PI * freq * t));
  return config.leadMix * gate * tone + grit * gate * 0.4;
};

const makeBass = (t, beat, config) => {
  const step = Math.floor(beat) % config.bassPattern.length;
  const freq = config.bassPattern[step];
  const pulse = 0.68 + 0.32 * Math.exp(-8 * (beat % 1));
  return config.bassMix * pulse * Math.sign(Math.sin(2 * Math.PI * freq * t));
};

const makeArp = (t, beat, config) => {
  const step = Math.floor(beat * 4) % config.leadPattern.length;
  const freq = config.leadPattern[step] * 2;
  const gate = Math.max(0, Math.sin(Math.PI * ((beat * 4) % 1)));
  return config.arpMix * gate * Math.sin(2 * Math.PI * freq * t);
};

const makePulse = (t, beat, mix) => {
  const freq = 0.5 + 0.08 * Math.sin(2 * Math.PI * 0.1 * t);
  return mix * (0.5 + 0.5 * Math.sin(2 * Math.PI * freq * t + beat * 0.2));
};

const makeRockLead = (t, beat, config) => {
  const step = Math.floor(beat * 2) % config.leadPattern.length;
  const freq = config.leadPattern[step];
  const gate = 0.38 + 0.62 * Math.max(0, Math.sin(Math.PI * ((beat * 2) % 1)));
  const fundamental = Math.sin(2 * Math.PI * freq * t);
  const octave = 0.55 * Math.sin(2 * Math.PI * freq * 2 * t);
  const grit = 0.45 * Math.sign(Math.sin(2 * Math.PI * freq * t));
  return config.leadMix * gate * (0.45 * fundamental + 0.25 * octave + 0.3 * grit);
};

const makeTrailerLead = (t, beat, config) => {
  const step = Math.floor(beat) % config.leadPattern.length;
  const freq = config.leadPattern[step];
  const distance = Math.min(Math.abs(beat % 2), Math.abs((beat % 2) - 1));
  const env = Math.exp(-18 * distance);
  const tone =
    0.6 * Math.sin(2 * Math.PI * freq * t) +
    0.25 * Math.sin(2 * Math.PI * freq * 0.5 * t) +
    0.15 * Math.sin(2 * Math.PI * freq * 2 * t);
  return config.leadMix * env * tone;
};

fs.mkdirSync(outputDir, { recursive: true });

for (const variant of variants) {
  const dataSize = totalSamples * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  writeWavHeader(buffer, dataSize);

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const beat = t * variant.bpm / 60;

    const fadeIn = clamp(t / 0.7, 0, 1);
    const fadeOut = clamp((durationSeconds - t) / 1.3, 0, 1);
    const master = 0.8 * fadeIn * fadeOut;

    const lead =
      variant.mode === "broadcast-drums"
        ? makeBroadcastLead(t, beat, variant)
        : variant.mode === "arena-rock-lite"
          ? makeRockLead(t, beat, variant)
          : variant.mode === "trailer-sport"
            ? makeTrailerLead(t, beat, variant)
            : typeof variant.clapMix === "number"
              ? makeBroadcastLead(t, beat, variant)
              : makeLead(t, beat, variant);
    const bass = makeBass(t, beat, variant);
    const arp = makeArp(t, beat, variant);
    const kick = makeKick(t, beat, variant.kickMix);
    const snare = makeSnare(t, beat, variant.snareMix);
    const hat = makeHat(t, beat, variant.hatMix);
    const pulse = makePulse(t, beat, variant.pulseMix);
    const clap = typeof variant.clapMix === "number" ? makeClap(t, beat, variant.clapMix) : 0;
    const tom = typeof variant.tomMix === "number" ? makeTom(t, beat, variant.tomMix) : 0;
    const boom = variant.mode === "trailer-sport" ? makeBoom(t, beat, 0.22) : 0;
    const impact = variant.mode === "trailer-sport" ? makeImpact(t, beat, 0.14) : 0;

    const sample = clamp(
      (lead + bass + arp + kick + snare + hat + pulse + clap + tom + boom + impact) * master,
      -1,
      1,
    );
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * bytesPerSample);
  }

  const outputPath = path.join(outputDir, `pickrank-hype-bed-${variant.slug}.wav`);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Wrote ${outputPath}`);
}
