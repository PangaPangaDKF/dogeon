// DOGEON trailer music: an original chiptune, generated in code (no samples, no license to track).
// 120 BPM, A minor (Am-F-C-G), square lead + 16th arp + triangle bass + noise drums.
// Sections follow the cut list so every cut lands on a beat. Usage:
//   node scripts/trailer/music.mjs <out.wav> <h|v>
import { writeFileSync } from 'node:fs';
const [, , OUT, CUT = 'h'] = process.argv;
const SR = 44100, BEAT = 0.5, S16 = BEAT / 4;
// [start s, section] — h = 16:9 trailer (35 s), v = 9:16 short (30 s). Matches build.sh segment lengths.
const PLAN = {
  h: { len: 35, sec: [[0, 'intro'], [1.5, 'a'], [12, 'b'], [23, 'break'], [24, 'climax'], [31, 'outro']], hits: [1.5, 12, 24, 31] },
  v: { len: 30, sec: [[0, 'a'], [9, 'b'], [18.5, 'break'], [19.5, 'climax'], [26.5, 'outro']], hits: [0, 9, 19.5, 26.5] },
}[CUT];
const N = Math.round(PLAN.len * SR), mix = new Float32Array(N);
const hz = m => 440 * 2 ** ((m - 69) / 12);
const n = s => { const o = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }; return 12 * (+s.at(-1) + 1) + o[s[0]] + (s[1] === '#' ? 1 : 0); };
const CH = [['A2', 'A3', 'C4', 'E4', 'A4'], ['F2', 'F3', 'A3', 'C4', 'F4'], ['C3', 'C4', 'E4', 'G4', 'C5'], ['G2', 'G3', 'B3', 'D4', 'G4']].map(c => c.map(n));
const LEAD_A = ['E5 . . D5 C5 . A4 .', 'C5 . . D5 E5 . F5 .', 'G5 . . E5 C5 . E5 D5', 'D5 . B4 . G4 . B4 D5'];
const LEAD_B = ['A5 . G5 . E5 . . .', 'F5 . E5 . C5 . . .', 'E5 . G5 . C6 . B5 .', 'B5 . . . D6 . . .'];
const secAt = t => { let s = PLAN.sec[0][1]; for (const [st, k] of PLAN.sec) if (t >= st - 1e-6) s = k; return s; };
let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296) * 2 - 1;

function tone(t0, dur, f, vol, wave = 'sq', duty = 0.5, dec = 6) {
  const a = Math.round(t0 * SR), b = Math.min(N, a + Math.round(dur * SR)); let ph = 0;
  for (let i = a; i < b; i++) { const t = (i - a) / SR, env = Math.min(1, t / 0.003) * Math.exp(-dec * t) * Math.min(1, (b - i) / (SR * 0.004));
    ph = (ph + f / SR) % 1; const s = wave === 'tri' ? 4 * Math.abs(ph - 0.5) - 1 : ph < duty ? 1 : -1; mix[i] += s * vol * env; } }
function noise(t0, dur, vol, dec, hp = 0) {
  const a = Math.round(t0 * SR), b = Math.min(N, a + Math.round(dur * SR)); let prev = 0;
  for (let i = a; i < b; i++) { const t = (i - a) / SR, x = rnd(), s = hp ? x - prev : x; prev = x; mix[i] += s * vol * Math.exp(-dec * t); } }
function kick(t0, vol = 0.55) { const a = Math.round(t0 * SR), b = Math.min(N, a + Math.round(0.18 * SR)); let ph = 0;
  for (let i = a; i < b; i++) { const t = (i - a) / SR; ph += (50 + 110 * Math.exp(-30 * t)) / SR; mix[i] += Math.sin(2 * Math.PI * ph) * vol * Math.exp(-14 * t); } }
const snare = (t0, v = 0.28) => { noise(t0, 0.16, v, 22); tone(t0, 0.06, 190, v * 0.5, 'tri', 0.5, 40); };
const hat = (t0, v = 0.07) => noise(t0, 0.04, v, 90, 1);
const crash = (t0, v = 0.22) => noise(t0, 1.2, v, 3.2, 1);

const steps = Math.floor(PLAN.len / S16);
for (let k = 0; k < steps; k++) {
  const t = k * S16, sec = secAt(t), bar = Math.floor(t / 2), chord = CH[bar % 4], s16 = k % 16, s8 = s16 / 2, beat = Math.floor(s16 / 4);
  if (sec === 'outro') continue; // outro is one held chord, written below
  const lv = { intro: 0.6, a: 1, b: 0.85, break: 0.7, climax: 1.15 }[sec];
  // 16th arp on chord tones (thin 12.5% square)
  if (sec !== 'break') tone(t, S16 * 0.9, hz(chord[1 + [0, 1, 2, 3, 2, 1, 2, 3][s16 % 8]] + 12), 0.05 * lv, 'sq', 0.125, 14);
  if (sec === 'intro') { if (s16 === 0) tone(t, 2, hz(chord[0]), 0.22, 'tri', 0.5, 0.8); continue; }
  // triangle bass: root/octave 8ths
  if (s16 % 2 === 0 && sec !== 'break') tone(t, S16 * 1.8, hz(chord[0] + (s8 % 2 ? 12 : 0)), 0.26 * lv, 'tri', 0.5, 3);
  // drums
  if (sec === 'break') { snare(t, 0.08 + 0.22 * (s16 / 16)); if (s16 % 4 === 0) kick(t, 0.35); continue; }
  if (s16 % 4 === 0 && (sec === 'climax' || beat % 2 === 0)) kick(t);
  if (s16 % 4 === 0 && beat % 2 === 1 && sec !== 'b') snare(t);
  if (sec === 'b' && s16 === 12) snare(t, 0.18);
  if (s16 % 2 === 0) hat(t, s16 % 4 ? 0.05 : 0.08);
  // lead (25% square), held notes from '.'
  if (s16 % 2 === 0) { const line = (sec === 'b' ? LEAD_B : LEAD_A)[bar % 4].split(' '), tok = line[s8];
    if (tok !== '.') { let len = 1; while (s8 + len < 8 && line[s8 + len] === '.') len++;
      tone(t, len * 2 * S16 * 0.95, hz(n(tok) + (sec === 'climax' ? 12 : 0)), 0.11 * lv, 'sq', 0.25, sec === 'b' ? 1.5 : 2.5); } }
}
for (const h of PLAN.hits) { crash(h); kick(h, 0.6); }
// outro: Am chord held over the end card, then silence
const o = PLAN.sec.find(s => s[1] === 'outro')[0];
for (const m of CH[0]) tone(o, PLAN.len - o, hz(m + 12), 0.07, 'sq', 0.25, 0.9);
tone(o, PLAN.len - o, hz(CH[0][0]), 0.28, 'tri', 0.5, 0.7);

// master: soft limiter, normalize to -1 dBFS, 30 ms fade in/out, 16-bit PCM mono WAV
let peak = 0; for (let i = 0; i < N; i++) { mix[i] = Math.tanh(mix[i] * 1.2); peak = Math.max(peak, Math.abs(mix[i])); }
const g = 0.89 / peak, pcm = Buffer.alloc(44 + N * 2), F = SR * 0.03;
for (let i = 0; i < N; i++) pcm.writeInt16LE(Math.round(mix[i] * g * Math.min(1, i / F, (N - i) / F) * 32767), 44 + i * 2);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20);
pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34);
pcm.write('data', 36); pcm.writeUInt32LE(N * 2, 40);
writeFileSync(OUT, pcm); console.log(`music ${CUT}: ${PLAN.len}s -> ${OUT}`);
