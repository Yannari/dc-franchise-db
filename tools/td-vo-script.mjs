// tools/td-vo-script.mjs — the voice-acting test's script (the user, 2026-10-11: testing Qwen3-TTS by
// hand in its online demo before building anything).
//
// Simulates a Total Drama season in Chromium, plays one episode through the stepped viewer and collects
// every line as it is shown (sound.js speak → window.__tdLine), then writes, into assets/audio/td/vo-test/:
//   script.json        every chosen line with its id: the viewer plays <id>.wav for a line that has one
//   SCRIPT.md          the same for a person: each character's voice description, then their lines
//   season-vo-test.json the season itself, to load with Season > Import, so the lines play where they aired
//
// Needs the dev server on 127.0.0.1:8791.  node tools/td-vo-script.mjs [episode=2] [perCharacter=7]
//
// --from <file>: the lines as the USER's browser spoke them (tdVoiceExport() in its console, sound.js)
// instead of a simulated season. Use this one. The TD writer reads each character's franchise career, so
// a clean browser and the user's own say different lines for the same save, and a script written in a
// clean browser matched nothing on the user's screen (2026-10-11).
//   node tools/td-vo-script.mjs --from ~/Downloads/td-voice-lines-ep2.json [perCharacter=7]
import { chromium } from 'playwright';
import fs from 'fs';

const argv = process.argv.slice(2), fi = argv.indexOf('--from'), FROM = fi >= 0 ? argv.splice(fi, 2)[1] : null;
// --all: every line of every character with a voice (a whole episode), not a sample of each
const ai = argv.indexOf('--all'), ALL = ai >= 0 && !!argv.splice(ai, 1);
const EP = FROM ? null : (+argv[0] || 2), PER = ALL ? Infinity : +(FROM ? argv[0] : argv[1]) || 7;
const OUT = 'assets/audio/td/vo-test';
// three voices as far apart as a test can ask: two young women of opposite energy (can the model keep
// two of the same gender apart?) and a loud, warm man. Written from each roster profile's "voice".
const CAST = {
  Heather: 'Young woman, about 18. Sharp, fast and condescending: a queen-bee villain. Clipped consonants, a sweet sing-song when she wants something, then cold and cutting. Confident, never hesitant.',
  Owen: 'Young man, about 18, big and cheerful. Loud, warm, breathless and excitable, laughs mid-sentence, voice cracks up high when he is excited or scared. Friendly goofball, never mean.',
  Gwen: 'Young woman, about 18. Low, dry and deadpan: a sarcastic goth who is tired of everyone. Flat, unhurried delivery, little pitch movement, a quiet edge of warmth only with friends.',
};
// everyone with a precise voice in voices/profiles.json speaks in it (the demo cast, 2026-10-11); the short
// descriptions above stay the fallback for anyone without one
try {
  const prof = JSON.parse(fs.readFileSync(`${OUT}/voices/profiles.json`, 'utf8'));
  for (const [k, v] of Object.entries(prof)) if (!k.startsWith('_')) CAST[k] = v;
} catch { /* no profiles yet */ }
// and every voice written in the Studio (Speaking voice → speakingVoice on the roster), under the test file's
try {
  for (const p of JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players || [])
    if (String(p.speakingVoice || '').trim() && !CAST[p.name]) CAST[p.name] = p.speakingVoice.trim();
} catch { /* no roster */ }
const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro'];

fs.mkdirSync(OUT, { recursive: true });
const errs = [];
let save = null, lines;
if (FROM) {
  const got = JSON.parse(fs.readFileSync(FROM, 'utf8'));
  lines = got.lines.map(l => ({ by: l.by, text: l.text, id: l.id, screen: l.screen, ep: l.ep, meta: { k: l.k, stage: l.stage, loud: l.loud, shock: l.shock, badge: l.badge } }));
} else {
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500);
save = await page.evaluate(async ({ N, EP }) => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js'), cast = await import('./js/cast-ui.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Voice Test', setting: 'hosted-camp', teams: 2, mergeAt: 10, romance: 'enabled', popularityEnabled: true });
  ss.initGameState();
  for (let i = 0; i < EP; i++) { window.gs = core.gs; epm.simulateEpisode(); }
  window.__lines = [];
  window.__tdLine = (by, text, id, meta) => window.__lines.push({ by, text, id, meta, screen: window.__screen });
  return cast._buildSeasonSaveData();
}, { N, EP });
await page.evaluate(n => window.openVisualPlayer(n), EP); await page.waitForTimeout(1500);
const screens = await page.evaluate(() => (window.vpScreens || []).map(s => s.id));
for (let si = 0; si < screens.length; si++) {
  await page.evaluate(i => { window.vpCurrentScreen = i; window.renderVPScreen(); }, si); await page.waitForTimeout(500);
  await page.evaluate(sid => { window.__screen = sid; }, screens[si]);
  const uid = await page.evaluate(() => document.querySelector('.tdx')?.dataset.uid || null);
  if (!uid) continue;
  const isMap = await page.evaluate(() => !!document.querySelector('.tdm-root'));
  for (let n = 0; n < (isMap ? 60 : 400); n++) {
    const before = await page.evaluate(u => document.querySelector(`.tdx[data-uid="${u}"]`)?.dataset.idx || '', uid);
    await page.evaluate(u => window.tdxNext(u), uid); await page.waitForTimeout(isMap ? 90 : 40);
    const after = await page.evaluate(u => document.querySelector(`.tdx[data-uid="${u}"]`)?.dataset.idx || '', uid);
    if (!isMap && before === after && n > 3) break;
  }
}
lines = await page.evaluate(() => window.__lines);
await b.close();
}

// How to read the line. The demo has ONE box, "Voice Description", and it takes who is speaking and how
// in one go (its own example: "Speak in an incredulous tone, but with a hint of panic beginning to creep
// into your voice."). So each line gets one paste: the character's voice, then the delivery written the
// same way, from where it is said, the writer's stage direction, a shout or a shock, and the line just
// before it (context for the tone; whether it was said TO them the line itself shows).
const PLACE = id => /^camp-pre|^camp-post|^camp/.test(id) ? 'Speak naturally, in a casual conversation at camp' : /tribal|ceremony/.test(id) ? 'Speak in a low, tense voice at the campfire ceremony, aware that everyone is listening' : /challenge/.test(id) ? 'Speak breathlessly, in the middle of a physical challenge' : 'Speak naturally';
function delivery(l, prev) {
  const m = l.meta || {};
  let d = m.shock ? 'Speak in a shocked, caught-off-guard tone, the words tumbling out'
    : m.loud ? 'Shout it, loud and emphatic'
    : m.k === 'conf' ? 'Speak quietly and candidly, confiding in a camera when nobody else can hear'
    : PLACE(l.screen || '');
  if (m.stage) d += `, ${m.stage.replace(/^\(|\)$/g, '').toLowerCase()}`;
  d += '.';
  if (m.k !== 'conf' && prev && prev.by !== l.by) d += ` Just before this, ${prev.by} said: "${prev.text}"`;
  return d;
}
lines.forEach((l, i) => { l.direction = delivery(l, i ? lines[i - 1] : null); });

// each character's lines, once each, the most varied first: a question, a shout, then the longest
const seen = new Set(), chosen = [];
for (const name of Object.keys(CAST)) {
  const mine = lines.filter(l => l.by === name && !seen.has(l.id) && (seen.add(l.id), true));
  const ask = mine.filter(l => /\?["')]?\s*$/.test(l.text)), shout = mine.filter(l => /!["')]?\s*$/.test(l.text));
  const pick = [...new Set([...ask.slice(0, 2), ...shout.slice(0, 2), ...[...mine].sort((a, b) => b.text.length - a.text.length)])].slice(0, PER);
  chosen.push(...mine.filter(l => pick.includes(l)));
}
const episode = EP ?? [...new Set(lines.map(l => l.ep))].join(', ');
const script = { episode, season: FROM ? 'your own (lines recorded in your browser)' : 'season-vo-test.json', note: 'tools/td-vo-render.py voices each line into <id>.wav here (or voice it by hand in the Qwen3-TTS demo).',
  characters: CAST, lines: chosen.map(l => ({ id: l.id, by: l.by, text: l.text, direction: l.direction, voiceDescription: `${CAST[l.by]} ${l.direction}`, file: `${l.id}.ogg` })) };   // Ogg Opus: a line is ~28 KB, a WAV ~300
fs.writeFileSync(`${OUT}/script.json`, JSON.stringify(script, null, 2));
if (save) fs.writeFileSync(`${OUT}/season-vo-test.json`, JSON.stringify(save));
// a clip whose line is no longer in the script is a stale render: gone, so the folder is the script
const keep = new Set(script.lines.map(l => l.file));
for (const f of fs.readdirSync(OUT)) if (/^L[0-9a-f]{8}\.(wav|mp3|ogg)$/.test(f) && !keep.has(f)) fs.unlinkSync(`${OUT}/${f}`);
const md = [`# Voice test: episode ${episode}`, '',
  ...(FROM ? [`These are the lines your own browser spoke, so they play in the season you recorded them from.`, '']
    : ['**Before you start:** importing replaces the season you have open. Save yours first (Season > Save).', '', '1. In the simulator: **Season > Import**, choose `season-vo-test.json` from this folder.']),
  '- To voice them: `C:/Users/yanna/qwen-tts/.venv/Scripts/python.exe tools/td-vo-render.py` (or by hand in the Qwen3-TTS demo: **Text** into the text box, **Voice Description** into its box, saved here under the file name shown).',
  `- To hear them: reload the simulator (Ctrl+Shift+R), click once anywhere (the browser only allows sound after a click), and watch episode ${episode}. A line with a clip plays it; every other line keeps the blips.`, '',
  'The character part of every description is the same for all of their lines, so the voice should stay the same person; listen for whether it does. That is half of what this test is for.', ''];
let k = 0;
for (const name of Object.keys(CAST)) {
  md.push(`## ${name}`, '');
  for (const l of script.lines.filter(x => x.by === name)) md.push(`### ${++k}. ${name}: save as \`${l.file}\``, '', '**Text**', '```', l.text, '```', '**Voice Description**', '```', l.voiceDescription, '```', '');
}
fs.writeFileSync(`${OUT}/SCRIPT.md`, md.join('\n'));
console.log(`episode ${episode}: ${lines.length} lines shown, ${new Set(lines.map(l => l.by)).size} speakers`);
for (const name of Object.keys(CAST)) console.log(`  ${name}: ${lines.filter(l => l.by === name).length} lines, ${script.lines.filter(l => l.by === name).length} chosen`);
console.log('errors', errs.length ? errs : 'none');
