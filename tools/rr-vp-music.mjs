// Writes assets/audio/rr/README.md, the Ridonculous Race's music list, from js/vp-rr-ep/music.js:
// every place, every moment, the exact file, what to look for, what to search, and whether it is filled.
//   node tools/rr-vp-music.mjs
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { MOMENTS, RACE_SOUNDS, PLACE_MUSIC, AMBIENCE, placeFile, raceFile } from '../js/vp-rr-ep/music.js';

mkdirSync('assets/audio/rr', { recursive: true });
const credits = existsSync('assets/audio/rr/credits.json') ? JSON.parse(readFileSync('assets/audio/rr/credits.json', 'utf8')) : {};
const kb = f => Math.round(statSync(f).size / 1024);
const mark = f => {
  if (!existsSync(f)) return '[ ] empty';
  const c = credits[f.replace('assets/audio/rr/', '')];
  return `[x] ${c ? `"${c.title}" (${c.author})` : 'filled'}, ${kb(f)} KB`;
};
const all = [];
let out = `# The Ridonculous Race: the music list

Written by \`node tools/rr-vp-music.mjs\` from \`js/vp-rr-ep/music.js\` (edit that file, then run this again).
Every place has its own sound and every moment of a leg its own track there (the user, 2026-10-19:
"different music for each place and in each place for each specific moment"). The viewer
(\`js/vp-rr-ep/sound.js\`) plays a file from the step being painted. A file that is missing plays
the race-wide bed for that moment (\`race/<moment>.mp3\`) if there is one, then an ambience already
in the repo where it really fits the place, and otherwise silence. A Total Drama bed never plays.

**The rules for a file**
- Royalty-free only: CC0 or public domain, the Pixabay Content License, or CC-BY with the credit in
  \`CREDITS.md\`. Never the real show's soundtrack, never a commercial track.
- A bed is a loop: 30-90 s, cut on a bar so the end runs back into the start, mono or stereo mp3 at
  64-128 kbps, levelled to about -17 dB (beds) or -14 dB (stings). \`tools/rr-vp-audio.py\` does the cut,
  the crossfade at the loop point, the level and the encode.
- No real country or city on screen. The words here describe a style of music, nothing more.
- Mix: music > voices > ambience. A bed sits under the lines; the stings are short.

**Search sites**: incompetech.com (Kevin MacLeod, CC-BY 4.0), pixabay.com/music (Pixabay License),
freemusicarchive.org (filter by CC-BY or CC0), opengameart.org (filter by CC0).

`;
out += `## The moments\n\n| Moment | When it plays | Length | What it should do |\n|---|---|---|---|\n`;
for (const [id, m] of Object.entries(MOMENTS)) out += `| \`${id}\` | ${m.when} | ${m.len} | ${m.shape} |\n`;
out += `\n## The race's own sounds (\`assets/audio/rr/race/\`)\n\n| File | Kind | When | Look for | Search | Filled |\n|---|---|---|---|---|---|\n`;
for (const [id, s] of Object.entries(RACE_SOUNDS)) {
  const f = raceFile(id); all.push(f);
  out += `| \`race/${id}.mp3\` | ${s.kind} | ${s.when} | ${s.want} | ${s.search} | ${mark(f)} |\n`;
}
out += `\nA race-wide bed for a moment (\`race/opener.mp3\`, \`race/struggle.mp3\`...) is the fallback for any place without its own.\n`;
for (const [pid, p] of Object.entries(PLACE_MUSIC)) {
  out += `\n## ${p.name} (\`${pid}/\`)\n\n**Sound of the place**: ${p.feel}.  \n**Search**: ${p.search}.`;
  if (AMBIENCE[pid]) out += `  \n**Fallback ambience** (only while a file is missing): \`${AMBIENCE[pid]}\`.`;
  out += `\n\n| File | Moment | Look for | Length | Search | Filled |\n|---|---|---|---|---|---|\n`;
  for (const [mid, want] of Object.entries(p.moments)) {
    const f = placeFile(pid, mid); all.push(f);
    const words = `${p.search.split(',').slice(0, 2).join(',')}, ${MOMENTS[mid].shape.split(',')[0]}`;
    out += `| \`${pid}/${mid}.mp3\` | ${mid} | ${want}; ${MOMENTS[mid].shape} | ${MOMENTS[mid].len} | ${words} | ${mark(f)} |\n`;
  }
}
const filled = all.filter(f => existsSync(f)).length;
out = out.replace('**The rules for a file**', `**Filled: ${filled} of ${all.length} slots.**\n\n**The rules for a file**`);
writeFileSync('assets/audio/rr/README.md', out);
// the files that exist, for the viewer (a missing file is never fetched: it falls back or is silent)
writeFileSync('js/vp-rr-ep/music-have.js', `// Written by tools/rr-vp-music.mjs: the Ridonculous Race music files on disk (js/vp-rr-ep/music.js lists every slot).
export const HAVE = new Set(${JSON.stringify(all.filter(f => existsSync(f)).concat(Object.values(AMBIENCE).filter(f => existsSync(f))), null, 1)});
// dB a file could not be raised by without clipping (tools/rr-vp-audio.py), given back on playback
export const LIFT = ${JSON.stringify(Object.fromEntries(Object.entries(credits).filter(([, c]) => c.lift > 0.5).map(([f, c]) => ['assets/audio/rr/' + f, c.lift])), null, 1)};
// where a bed loops, in seconds (tools/rr-vp-audio.py cuts it where the music repeats, with music either side)
export const LOOP = ${JSON.stringify(Object.fromEntries(Object.entries(credits).filter(([, c]) => Array.isArray(c.loop)).map(([f, c]) => ['assets/audio/rr/' + f, c.loop])))};
`);
console.log(`README: ${filled}/${all.length} filled`);
