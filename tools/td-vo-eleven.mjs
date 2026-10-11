// tools/td-vo-eleven.mjs — the voice test on ElevenLabs: Voice Design once per character, then every line on
// Eleven v4 with a delivery tag.
//
// Why (the user, 2026-10-11): on the laptop, Qwen3-TTS took 15-20 minutes an episode, and the two ways to use it
// each failed one way: designing every line acts well but the voice drifts, cloning holds the voice but loses the
// acting ("the cloning is really bad, it's not picking the tone like design does"). ElevenLabs designs a voice
// from a description once and KEEPS it (a voice id), and Eleven v4 takes delivery tags ([sarcastic], [whispers]).
//
// The key never enters the repo: it is read from %USERPROFILE%\.elevenlabs-key (or ELEVENLABS_API_KEY).
//   node tools/td-vo-eleven.mjs [--only Heather Owen] [--redesign Owen] [--model eleven_v4]
// Writes: voices/eleven.json (each character's voice id and the preview it came from), voices/eleven/<Name>-<k>.mp3
// (the design previews, to re-pick from), eleven/<id>.mp3 (the lines).
import fs from 'fs';
import os from 'os';
import path from 'path';

const argv = process.argv.slice(2);
const list = flag => { const i = argv.indexOf(flag); if (i < 0) return []; const out = []; for (let j = i + 1; j < argv.length && !argv[j].startsWith('--'); j++) out.push(argv[j]); return out; };
const opt = (flag, d) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : d; };
const ONLY = list('--only'), REDESIGN = list('--redesign'), MODEL = opt('--model', 'eleven_v4');

// Notepad saves `.elevenlabs-key` as `.elevenlabs-key.txt` unless told otherwise: either is read
const keyFile = ['.elevenlabs-key', '.elevenlabs-key.txt'].map(f => path.join(os.homedir(), f)).find(f => fs.existsSync(f));
const KEY = (process.env.ELEVENLABS_API_KEY || (keyFile ? fs.readFileSync(keyFile, 'utf8') : '')).trim();
if (!KEY) { console.error('No key: put it in %USERPROFILE%\\.elevenlabs-key (or ELEVENLABS_API_KEY).'); process.exit(1); }
const API = 'https://api.elevenlabs.io/v1';
const call = async (url, body, raw = false) => {
  const r = await fetch(API + url, { method: body ? 'POST' : 'GET', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${url}: ${r.status} ${(await r.text()).slice(0, 300)}`);
  return raw ? Buffer.from(await r.arrayBuffer()) : r.json();
};

const DIR = 'assets/audio/td/vo-test';
const read = f => JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8'));
const strip = o => Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('_')));
const script = read('script.json'), profiles = strip(read('voices/profiles.json')), casting = strip(read('voices/casting.json'));
const voicesJson = read('voices/voices.json');
const compared = new Set(voicesJson._compared || []);
// the test: the 18 lines Heather, Owen and Gwen were first compared on, so all versions sit side by side
const lines = script.lines.filter(l => compared.has(l.id) && (!ONLY.length || ONLY.includes(l.by)));
const names = [...new Set(lines.map(l => l.by))];

fs.mkdirSync(`${DIR}/voices/eleven`, { recursive: true });
fs.mkdirSync(`${DIR}/eleven`, { recursive: true });
const epath = `${DIR}/voices/eleven.json`;
const eleven = fs.existsSync(epath) ? JSON.parse(fs.readFileSync(epath, 'utf8')) : {};
const before = await call('/user/subscription');
console.log(`plan ${before.tier}: ${before.character_count} of ${before.character_limit} credits used`);

// ── 1. each voice: one the user designed on the website ("TD <Name>"), else designed here ──
// The Free plan refuses voice creation through the API (403 feature_not_available, 2026-10-11) but allows Voice
// Design on the website and speech through the API with any voice in the account: so a voice saved there as
// "TD Heather" is found by name and used.
const mine = (await call('/voices')).voices || [];
for (const n of names) {
  // saved as "TD Heather" or just "Heather" (the user saved them by first name); a designed voice, not a premade one
  const theirs = mine.find(v => [`td ${n}`, n].map(x => x.toLowerCase()).includes(v.name.trim().toLowerCase()) && v.category !== 'premade');
  if (theirs && !REDESIGN.includes(n)) { eleven[n] = { voice_id: theirs.voice_id, from: 'website' }; fs.writeFileSync(epath, JSON.stringify(eleven, null, 2)); console.log(`${n}: the voice "${theirs.name}" from the website`); continue; }
  if (eleven[n]?.voice_id && !REDESIGN.includes(n)) continue;
  const t = Date.now();
  const d = await call('/text-to-voice/design', { voice_description: profiles[n].slice(0, 1000), text: casting[n], model_id: 'eleven_ttv_v3' });
  d.previews.forEach((p, k) => fs.writeFileSync(`${DIR}/voices/eleven/${n}-${k + 1}.mp3`, Buffer.from(p.audio_base_64, 'base64')));
  const pick = eleven[n]?.pick || 1;
  const made = await call('/text-to-voice', { voice_name: `TD ${n}`, voice_description: profiles[n].slice(0, 1000), generated_voice_id: d.previews[pick - 1].generated_voice_id });
  eleven[n] = { voice_id: made.voice_id, pick, previews: d.previews.map((_, k) => `eleven/${n}-${k + 1}.mp3`) };
  fs.writeFileSync(epath, JSON.stringify(eleven, null, 2));
  console.log(`${n}: designed (${d.previews.length} previews, saved take ${pick}) in ${((Date.now() - t) / 1000).toFixed(1)}s`);
}

// ── 2. every line, with its delivery as a tag ──
// The direction a line was given (tools/td-vo-script.mjs) as one of v4's tags; else how the character usually sounds.
const BASE = { Heather: 'condescending', Gwen: 'deadpan', Owen: 'cheerful' };
const tagOf = l => /shocked/.test(l.direction) ? 'shocked' : /Shout it/.test(l.direction) ? 'shouting'
  : /confiding in a camera/.test(l.direction) ? 'quietly'   // a confessional (td-vo-script.mjs words it so)
  : /ceremony/.test(l.direction) ? 'tense' : BASE[l.by] || null;
let secs = 0;
for (const l of lines) {
  const t = Date.now(), tag = tagOf(l);
  const mp3 = await call(`/text-to-speech/${eleven[l.by].voice_id}?output_format=mp3_44100_64`, { text: tag ? `[${tag}] ${l.text}` : l.text, model_id: MODEL }, true);   // audio, not JSON
  fs.writeFileSync(`${DIR}/eleven/${l.id}.mp3`, mp3);
  const s = (Date.now() - t) / 1000; secs += s;
  console.log(`${l.by.padEnd(8)} ${s.toFixed(1)}s  [${tag || '-'}] ${l.text.slice(0, 60)}`);
}
const after = await call('/user/subscription');
console.log(`${lines.length} lines in ${secs.toFixed(0)}s (${(secs / lines.length).toFixed(1)}s a line); credits used ${after.character_count - before.character_count} (${after.character_count} of ${after.character_limit})`);
