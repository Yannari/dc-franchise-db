// Original voices for a folder of character files (dc-character/1 JSON + "Voice Casting/_casting sheet.txt"),
// designed on Inworld from each character's written speaking voice. No real actor is cloned: the only input
// is the description and the character's own audition lines.
//
//   node tools/voice-design-cast.mjs design  <Characters dir> [--only slug,slug] [--redo]
//       three takes per character -> "Voice Casting/<slug> - take N.mp3"; ids kept in "Voice Casting/_voices.json"
//   node tools/voice-design-cast.mjs publish <Characters dir> <slug>=<take> ... [--no-lines]
//       publishes the picked take under the character's name, then voices the three audition lines in it
//       -> "Voice Casting/<slug> - line N.mp3"
//   node tools/voice-design-cast.mjs status  <Characters dir>
//
// A voice that is not a character file (a host: The Challenge's TJ) goes in "Voice Casting/_extra voices.json", a
// list of { slug, name, nationality, speakingVoice, lines: [3 lines] }, so it gets takes without becoming a
// character the Studio would import.
//
// The key: INWORLD_API_KEY, or the file %USERPROFILE%\.inworld-key (the Base64 key from the Inworld portal).
// A character already designed or published is skipped, so a run that stops halfway can be started again
// without paying twice.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const API = 'https://api.inworld.ai';
const [cmd, dirArg, ...rest] = process.argv.slice(2);
if (!['design', 'publish', 'status'].includes(cmd) || !dirArg) {
  console.log('usage: node tools/voice-design-cast.mjs design|publish|status <Characters dir> [...]');
  process.exit(1);
}
const dir = path.resolve(dirArg);
const castDir = path.join(dir, 'Voice Casting');
const ledgerPath = path.join(castDir, '_voices.json');
const flag = name => rest.includes(name);
const option = name => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : null; };

function apiKey() {
  if (process.env.INWORLD_API_KEY) return process.env.INWORLD_API_KEY.trim();
  const file = path.join(os.homedir(), '.inworld-key');
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
  console.error('No Inworld key: set INWORLD_API_KEY or save it to ' + file);
  process.exit(1);
}

// the character files, by slug
function characters() {
  const out = {};
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (c.$format === 'dc-character/1' && c.slug) out[c.slug] = c;
  }
  for (const c of extras()) out[c.slug] = c;
  return out;
}

function extras() {
  const file = path.join(castDir, '_extra voices.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).filter(c => c.slug && c.name && c.speakingVoice) : [];
}

// the audition lines from the casting sheet: "Name  (slug) — ..." then "AUDITION LINES" then "    1. ..."
function auditionLines() {
  const sheet = path.join(castDir, '_casting sheet.txt');
  const out = {};
  if (!fs.existsSync(sheet)) return out;
  for (const block of fs.readFileSync(sheet, 'utf8').split(/^={20,}\s*$/m)) {
    const slug = block.match(/^\S.*?\(([a-z0-9-]+)\)/m)?.[1];
    const after = block.split(/^AUDITION LINES\s*$/m)[1];
    if (slug && after) out[slug] = [...after.matchAll(/^\s+\d+\.\s+(.+)$/gm)].map(m => m[1].trim());
  }
  for (const c of extras()) if (c.lines?.length) out[c.slug] = c.lines;
  return out;
}

// Inworld's accent is the locale. Every character here speaks English; the description carries the rest.
function locale(c) {
  const v = `${c.nationality} ${c.speakingVoice}`;
  if (/\bIrish\b|Dublin/.test(v)) return 'en-IE';
  if (/\bScottish\b/.test(v)) return 'en-scottish';
  if (/\bBritish\b|\bEnglish accent/.test(v)) return 'en-GB';
  if (/\bAustralian\b/.test(v)) return 'en-AU';
  if (/drawl|South Carolina accent|North Carolina accent|Georgia accent/.test(v)) return 'en-southern';
  return 'en-US';
}

// the words the voice is designed speaking: as many audition lines as fit in 400 characters (the design
// endpoint wants 1-30 seconds of audio), and at least 50
function script(lines) {
  let text = '';
  for (const l of lines) if ((text + ' ' + l).trim().length <= 400) text = (text + ' ' + l).trim();
  return text.length >= 50 ? text : null;
}

const extOf = buf => buf.subarray(0, 4).toString('latin1') === 'RIFF' ? '.wav' : '.mp3';
const ledger = () => fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : {};
const save = l => fs.writeFileSync(ledgerPath, JSON.stringify(l, null, 2) + '\n');

async function call(url, body) {
  for (let tries = 0; ; tries++) {
    const r = await fetch(API + url, {
      method: 'POST',
      headers: { Authorization: `Basic ${apiKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.status === 429 && tries < 5) { await new Promise(res => setTimeout(res, 2000 * (tries + 1))); continue; }
    const text = await r.text();
    if (!r.ok) throw new Error(`inworld ${r.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text);
  }
}

// the display names of the voices already in the workspace (only workspace voices, as /api/voice/voices does)
async function existingVoices() {
  const r = await fetch(API + '/voices/v1/voices', { headers: { Authorization: `Basic ${apiKey()}` } });
  if (!r.ok) throw new Error(`inworld ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return new Set(((await r.json()).voices || []).filter(v => (v.voiceId || '').includes('__')).map(v => (v.displayName || '').trim()));
}

async function design() {
  const cast = characters(), lines = auditionLines(), l = ledger();
  const only = option('--only')?.split(',').map(s => s.trim());
  const voiced = await existingVoices();
  for (const [slug, c] of Object.entries(cast)) {
    if (only && !only.includes(slug)) continue;
    if (l[slug]?.takes?.length && !flag('--redo')) { console.log(`${slug}: already designed`); continue; }
    // a character the user already gave a voice keeps it
    if (voiced.has(displayName(slug, c)) && !flag('--redo')) { console.log(`${slug}: already has an Inworld voice, skipped`); continue; }
    const previewText = script(lines[slug] || []);
    if (!previewText) { console.log(`${slug}: no audition lines in the casting sheet, skipped`); continue; }
    const designPrompt = `${c.speakingVoice.trim()} Perfect broadcast quality audio.`.slice(0, 1000);
    let languageCode = locale(c), res;
    try {
      res = await call('/voices/v1/voices:design', { designPrompt, previewText, languageCode, voiceDesignConfig: { numberOfSamples: 3 } });
    } catch (e) {
      if (languageCode === 'en-US' || !/\b400\b|INVALID_ARGUMENT/.test(e.message)) throw e;
      console.log(`${slug}: ${languageCode} refused, designing in en-US`);
      languageCode = 'en-US';
      res = await call('/voices/v1/voices:design', { designPrompt, previewText, languageCode, voiceDesignConfig: { numberOfSamples: 3 } });
    }
    const takes = [];
    (res.previewVoices || []).forEach((v, i) => {
      const audio = Buffer.from(v.previewAudio || '', 'base64');
      if (audio.length) fs.writeFileSync(path.join(castDir, `${slug} - take ${i + 1}${extOf(audio)}`), audio);
      takes.push(v.voiceId);
    });
    l[slug] = { name: c.name, languageCode, designPrompt, previewText, takes, published: null };
    save(l);
    console.log(`${slug}: ${takes.length} takes (${languageCode})`);
  }
}

// the name the voice is published under, which is how the voicing pipeline finds it (/api/voice/voices maps
// displayName -> voiceId). A slug that is not the plain name (amara-okafor beside the roster's Amara) gets
// its full name, so it does not take over a voice the roster already has.
function displayName(slug, c) {
  const plain = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (slug === plain) return c.name;
  return slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

async function publish() {
  const cast = characters(), lines = auditionLines(), l = ledger();
  const picks = rest.filter(a => /^[a-z0-9-]+=\d$/.test(a)).map(a => a.split('='));
  if (!picks.length) { console.log('name the takes to keep, e.g. beck=2 brie=1'); return; }
  for (const [slug, n] of picks) {
    const c = cast[slug], entry = l[slug];
    if (!c || !entry?.takes?.length) { console.log(`${slug}: not designed yet`); continue; }
    const draft = entry.takes[+n - 1];
    if (!draft) { console.log(`${slug}: there is no take ${n}`); continue; }
    if (!entry.published || entry.published.take !== +n) {
      const name = displayName(slug, c);
      const v = await call(`/voices/v1/voices/${encodeURIComponent(draft)}:publish`, {
        displayName: name, description: c.speakingVoice.slice(0, 500), tags: ['dc-franchise', 'season-x'],
      });
      entry.published = { take: +n, voiceId: v.voiceId || draft, displayName: name };
      save(l);
      console.log(`${slug}: take ${n} published as "${name}"`);
    } else console.log(`${slug}: take ${n} already published`);
    if (flag('--no-lines')) continue;
    for (const [i, text] of (lines[slug] || []).entries()) {
      const file = path.join(castDir, `${slug} - line ${i + 1}.mp3`);
      if (fs.existsSync(file) && entry.published.linesFrom === entry.published.voiceId) continue;
      const r = await call('/tts/v1/voice', {
        text, voiceId: entry.published.voiceId, modelId: 'inworld-tts-2',
        audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 48000, bitRate: 64000, speakingRate: 1 },
      });
      fs.writeFileSync(file, Buffer.from(r.audioContent || '', 'base64'));
    }
    entry.published.linesFrom = entry.published.voiceId;
    save(l);
    console.log(`${slug}: audition lines voiced`);
  }
}

function status() {
  const cast = characters(), l = ledger();
  for (const [slug, c] of Object.entries(cast)) {
    const e = l[slug];
    const state = !e ? 'not designed' : e.published ? `published take ${e.published.take} as "${e.published.displayName}"` : `${e.takes.length} takes, none picked`;
    console.log(`${slug.padEnd(14)} ${c.name.padEnd(10)} ${locale(c).padEnd(12)} ${state}`);
  }
}

fs.mkdirSync(castDir, { recursive: true });
if (cmd === 'status') status();
else await (cmd === 'design' ? design() : publish()).catch(e => { console.error(e.message); process.exit(1); });
