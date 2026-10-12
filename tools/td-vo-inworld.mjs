// tools/td-vo-inworld.mjs — the voice test on Inworld TTS: the user's cloned voices, each line steered in words.
//
// After ElevenLabs ("not impressed, and it costs too much: 8 episodes a month is nothing", 2026-10-11): Inworld
// clones a voice free from 5-15 s of audio and charges per character ($25 a million on TTS-2), and TTS-2 takes
// its direction as plain words in brackets ([speak softly], [whisper, scheming]), the way Qwen's VoiceDesign took
// a line's reading direction, which the user found acted best. The user cloned Heather, Owen and Gwen in the
// Inworld playground (workspace jolly-rainbow-3303); this voices the same 18 test lines with them.
//
// Request format read from Inworld's own npm package (@inworld/tts 1.1.1: POST /tts/v1/voice, `Basic <key>`,
// { text, voiceId, modelId, audioConfig, temperature } -> { audioContent: base64 }), their docs being behind a login.
// The key never enters the repo: %USERPROFILE%\.inworld-key (or .inworld-key.txt, or INWORLD_API_KEY).
//   node tools/td-vo-inworld.mjs [--model inworld-tts-2] [--workspace jolly-rainbow-3303] [--only Gwen]
import fs from 'fs';
import os from 'os';
import path from 'path';

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const list = f => { const i = argv.indexOf(f); if (i < 0) return []; const o = []; for (let j = i + 1; j < argv.length && !argv[j].startsWith('--'); j++) o.push(argv[j]); return o; };
const MODEL = opt('--model', 'inworld-tts-2'), WS = opt('--workspace', 'jolly-rainbow-3303'), ONLY = list('--only');
// --all: THE EPISODE. Every line of every character with a voice, into the episode's own clips (<id>.mp3 beside
// script.json, which the viewer plays), and script.json pointed at them. Without it: the 18-line test into inworld/.
const ALL = argv.includes('--all'), FORCE = argv.includes('--force');

const keyFile = ['.inworld-key', '.inworld-key.txt'].map(f => path.join(os.homedir(), f)).find(f => fs.existsSync(f));
const KEY = (process.env.INWORLD_API_KEY || (keyFile ? fs.readFileSync(keyFile, 'utf8') : '')).trim();
if (!KEY) { console.error('No key: put it in %USERPROFILE%\\.inworld-key (or INWORLD_API_KEY).'); process.exit(1); }

const DIR = 'assets/audio/td/vo-test';
const script = JSON.parse(fs.readFileSync(`${DIR}/script.json`, 'utf8'));
const compared = new Set(JSON.parse(fs.readFileSync(`${DIR}/voices/voices.json`, 'utf8'))._compared || []);
// each character's voice: voices/inworld.json (the user's own, by name), else the workspace__name pattern
let VOICE = {};
try { VOICE = JSON.parse(fs.readFileSync(`${DIR}/voices/inworld.json`, 'utf8')); } catch { /* the pattern */ }
const voiceOf = n => VOICE[n] || `${WS}__${n.toLowerCase()}`;
const lines = script.lines.filter(l => (ALL ? (VOICE[l.by] || !Object.keys(VOICE).length) : compared.has(l.id)) && (!ONLY.length || ONLY.includes(l.by)));
const OUT = ALL ? DIR : `${DIR}/inworld`;
const fileOf = l => `${OUT}/${l.id}.mp3`;
fs.mkdirSync(`${DIR}/inworld`, { recursive: true });

// SHORT DIRECTIONS (the user, 2026-10-11: "we would work on shorter, better direction"): two or three words. The
// line's own direction first (tools/td-vo-script.mjs), else how the character usually sounds, the tone each one
// was tested in on the Inworld playground. Words cost: the long ones put ~60% on top of an episode's characters.
const BASE = { Heather: 'speak coldly', Gwen: 'speak flatly', Owen: 'speak excitedly', Duncan: 'speak smugly',
  Courtney: 'speak sharply', Izzy: 'speak manically', Cody: 'speak eagerly', Sierra: 'speak excitedly, fast',
  Lindsay: 'speak sweetly', Harold: 'speak pompously', Leshawna: 'speak confidently', Noah: 'speak dryly',
  Bridgette: 'speak calmly', Geoff: 'speak cheerfully', Trent: 'speak gently', Alejandro: 'speak smoothly',
  Chris: 'speak like a TV host' };
const steer = l => /shocked/.test(l.direction) ? 'speak in shock'
  : /Shout it/.test(l.direction) ? 'shout'
  // not 'softly': the model hears it as intimate (the user: "like they're confessing love in a sensual way")
  : /confiding in a camera/.test(l.direction) ? 'speak candidly, to the camera'
  : /ceremony/.test(l.direction) ? 'speak tense, low'
  : BASE[l.by] || null;

let secs = 0, chars = 0;
const t0 = Date.now();
fs.mkdirSync(OUT, { recursive: true });
const todo = lines.filter(l => FORCE || !ALL || !fs.existsSync(fileOf(l)));
async function voice(l) {
  const s = steer(l), text = s ? `[${s}] ${l.text}` : l.text, t = Date.now();
  const r = await fetch('https://api.inworld.ai/tts/v1/voice', {
    method: 'POST',
    headers: { Authorization: `Basic ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId: voiceOf(l.by), modelId: MODEL,
      audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 48000, bitRate: 96000, speakingRate: 1 }, temperature: 1 }),
  });
  if (!r.ok) throw new Error(`${l.by} ${l.id}: ${r.status} ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  fs.writeFileSync(fileOf(l), Buffer.from(j.audioContent, 'base64'));
  const took = (Date.now() - t) / 1000; secs += took; chars += text.length;
  if (!ALL) console.log(`${l.by.padEnd(8)} ${took.toFixed(1)}s  [${s || '-'}] ${l.text.slice(0, 55)}`);
}
// four at a time; a failed line is tried twice more before the run stops
let next = 0, done = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < todo.length) {
    const l = todo[next++];
    for (let k = 0; ; k++) {
      try { await voice(l); break; } catch (e) { if (k >= 2) throw e; await new Promise(r => setTimeout(r, 2000 * (k + 1))); }
    }
    if (ALL && ++done % 25 === 0) console.log(`${done}/${todo.length}`);
  }
}));
if (ALL) {
  // the episode plays what the script names: point every voiced line at its new clip
  const voiced = new Set(lines.map(l => l.id));
  script.lines.forEach(l => { if (voiced.has(l.id)) l.file = `${l.id}.mp3`; });
  fs.writeFileSync(`${DIR}/script.json`, JSON.stringify(script, null, 2));
  console.log(`episode: ${todo.length} lines voiced in ${((Date.now() - t0) / 1000).toFixed(0)}s of wall time`);
}
console.log(`${lines.length} lines in ${secs.toFixed(0)}s (${(secs / lines.length).toFixed(1)}s a line); ${chars} characters with the steering, about $${(chars / 1e6 * 25).toFixed(3)} at $25 a million`);
