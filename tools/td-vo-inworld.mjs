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

const keyFile = ['.inworld-key', '.inworld-key.txt'].map(f => path.join(os.homedir(), f)).find(f => fs.existsSync(f));
const KEY = (process.env.INWORLD_API_KEY || (keyFile ? fs.readFileSync(keyFile, 'utf8') : '')).trim();
if (!KEY) { console.error('No key: put it in %USERPROFILE%\\.inworld-key (or INWORLD_API_KEY).'); process.exit(1); }

const DIR = 'assets/audio/td/vo-test';
const script = JSON.parse(fs.readFileSync(`${DIR}/script.json`, 'utf8'));
const compared = new Set(JSON.parse(fs.readFileSync(`${DIR}/voices/voices.json`, 'utf8'))._compared || []);
const lines = script.lines.filter(l => compared.has(l.id) && (!ONLY.length || ONLY.includes(l.by)));
fs.mkdirSync(`${DIR}/inworld`, { recursive: true });

// The line's reading direction (tools/td-vo-script.mjs) in Inworld's words; else how the character usually sounds.
const BASE = { Heather: 'speak coldly, condescending', Gwen: 'speak flatly, deadpan', Owen: 'speak excitedly' };
const steer = l => /shocked/.test(l.direction) ? 'speak in shock'
  : /Shout it/.test(l.direction) ? 'shout'
  : /confiding in a camera/.test(l.direction) ? 'speak softly, confiding in the camera'
  : /ceremony/.test(l.direction) ? 'speak tense and low, everyone is listening'
  : BASE[l.by] || null;

let secs = 0, chars = 0;
for (const l of lines) {
  const s = steer(l), text = s ? `[${s}] ${l.text}` : l.text, t = Date.now();
  const r = await fetch('https://api.inworld.ai/tts/v1/voice', {
    method: 'POST',
    headers: { Authorization: `Basic ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId: `${WS}__${l.by.toLowerCase()}`, modelId: MODEL,
      audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 48000, bitRate: 96000, speakingRate: 1 }, temperature: 1 }),
  });
  if (!r.ok) { console.error(`${l.by} ${l.id}: ${r.status} ${(await r.text()).slice(0, 300)}`); process.exit(1); }
  const j = await r.json();
  fs.writeFileSync(`${DIR}/inworld/${l.id}.mp3`, Buffer.from(j.audioContent, 'base64'));
  const took = (Date.now() - t) / 1000; secs += took; chars += text.length;
  console.log(`${l.by.padEnd(8)} ${took.toFixed(1)}s  [${s || '-'}] ${l.text.slice(0, 55)}`);
}
console.log(`${lines.length} lines in ${secs.toFixed(0)}s (${(secs / lines.length).toFixed(1)}s a line); ${chars} characters with the steering, about $${(chars / 1e6 * 25).toFixed(3)} at $25 a million`);
