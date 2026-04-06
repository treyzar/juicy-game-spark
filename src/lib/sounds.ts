/**
 * Web Audio API sound engine — zero assets, pure synthesis.
 * All sounds are generated procedurally.
 */

let ctx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

/** Play a tone with optional frequency sweep */
const playTone = (
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  freqEnd?: number,
) => {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, c.currentTime + duration);
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
};

/** White noise burst */
const playNoise = (duration: number, volume = 0.08) => {
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.connect(gain).connect(c.destination);
  src.start();
};

// ── Public Sound Effects ────────────────────────────────

/** Generic UI click */
export const sfxClick = () => playTone(800, 0.08, 'square', 0.06);

/** Eat / collect / correct */
export const sfxCollect = () => {
  playTone(520, 0.1, 'sine', 0.12);
  setTimeout(() => playTone(780, 0.12, 'sine', 0.12), 60);
};

/** Wrong answer / error */
export const sfxWrong = () => {
  playTone(280, 0.15, 'sawtooth', 0.1);
  setTimeout(() => playTone(220, 0.2, 'sawtooth', 0.1), 100);
};

/** Win / success / level up */
export const sfxWin = () => {
  playTone(523, 0.12, 'sine', 0.12);
  setTimeout(() => playTone(659, 0.12, 'sine', 0.12), 100);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.14), 200);
  setTimeout(() => playTone(1047, 0.25, 'sine', 0.14), 300);
};

/** Game over / crash / explosion */
export const sfxCrash = () => {
  playNoise(0.3, 0.15);
  playTone(200, 0.4, 'sawtooth', 0.12, 40);
};

/** Cash out / sell */
export const sfxCashOut = () => {
  playTone(600, 0.08, 'square', 0.08);
  setTimeout(() => playTone(900, 0.12, 'sine', 0.1), 50);
  setTimeout(() => playTone(1200, 0.15, 'sine', 0.08), 120);
};

/** Card flip */
export const sfxFlip = () => playTone(1200, 0.06, 'sine', 0.08, 600);

/** Match found */
export const sfxMatch = () => {
  playTone(660, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(880, 0.15, 'sine', 0.12), 80);
};

/** Reel tick (case opener) */
export const sfxTick = () => playTone(1400, 0.03, 'square', 0.04);

/** Upgrade success */
export const sfxUpgrade = () => {
  playTone(440, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(660, 0.1, 'sine', 0.1), 80);
  setTimeout(() => playTone(880, 0.1, 'sine', 0.12), 160);
  setTimeout(() => playTone(1320, 0.2, 'triangle', 0.12), 240);
};

/** Trade open (buy/sell) */
export const sfxTradeOpen = () => playTone(500, 0.1, 'triangle', 0.08, 800);

/** Trade profit */
export const sfxProfit = () => {
  playTone(700, 0.08, 'sine', 0.1);
  setTimeout(() => playTone(1050, 0.12, 'sine', 0.1), 70);
};

/** Trade loss */
export const sfxLoss = () => playTone(350, 0.2, 'sawtooth', 0.08, 200);

/** Countdown tick */
export const sfxCountdown = () => playTone(1000, 0.05, 'sine', 0.05);

/** Heartbeat (crash game tension) */
export const sfxHeartbeat = () => {
  playTone(60, 0.12, 'sine', 0.15);
  setTimeout(() => playTone(60, 0.1, 'sine', 0.12), 120);
};
