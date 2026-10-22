// @vitest-environment jsdom
// SCRATCH (step 5, the season read): dump everything a played TD season airs, line by line, for reading.
// Camp (campFeed, what the viewer plays), the recap, the twists and the Tribal (booth, questions, reading, exit).
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { campFeed } from '../js/td/story/feed.js';

const OUT = 'C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/2d1e6251-1cdc-40bd-802d-421780223329/scratchpad/read';
const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const line = l => l.kind === 'beat' || !l.by ? `(${l.text})` : `${l.by}${l.kind === 'conf' ? ' [conf]' : ''}: ${l.text}`;
// any array of lines found under a value, with the path it was found at
const linesIn = (v, path, out, depth = 0) => {
  if (!v || depth > 5) return;
  if (Array.isArray(v) && v.length && v.every(x => x && typeof x === 'object' && typeof x.text === 'string')) { out.push([path, v]); return; }
  if (Array.isArray(v)) { v.forEach((x, i) => linesIn(x, `${path}[${i}]`, out, depth + 1)); return; }
  if (typeof v === 'object') for (const [k, x] of Object.entries(v)) linesIn(x, `${path}.${k}`, out, depth + 1);
};
const SEASONS = [
  { file: 'hosted', setting: 'hosted-camp', seed: 1729, names: ['Gwen','Leshawna','Heather','Duncan','Courtney','Owen','Lindsay','Trent','Julia','Millie','Aubrey','Lake','Gabby','Bowie','Yul','Bruno'] },
  { file: 'island', setting: 'survival-island', seed: 4711, names: ['Zee','Nura','Dunia','Ernesto','Evie','Finn','Manu','Oliwia','Ren','Sami','Ara','Natasha','Misha','Stella','Joel','Ireland'] },
  { file: 'filmlot', setting: 'film-lot', seed: 9090, names: ['Scott','Jo','Lightning','Dawn','Cameron','Zoey','Mike','Brick','Anne Maria','Sam','Jasmine','Shawn','Sky','Topher','Ella','Max'] },
  { file: 'carnival', setting: 'carnival', seed: 3131, names: ['Alessio','Amelie','Anastasia','Benji','Diego','Hannah','Isabel','Ivy','Jade','Logan','Lynda','Marissa','Natalia','Richard','Spencer','Tristan'] },
  { file: 'worldtour', setting: 'world-tour', seed: 2026, names: ['Alejandro','Heather','Gwen','Duncan','Courtney','Owen','Izzy','Cody','Sierra','Lindsay','Harold','Leshawna','Noah','Bridgette','Geoff','Trent'] },
  { file: 'twists', setting: 'hosted-camp', seed: 6262, cfg: { twistSchedule: [['three-gifts',2],['journey',3],['tribe-swap',4],['idol-wager',6],['returning-player',9],['the-feast',10],['loved-ones',12]].map(([id, episode]) => ({ id, episode, type: id })) }, names: ['Gwen','Leshawna','Heather','Duncan','Courtney','Owen','Lindsay','Trent','Julia','Millie','Aubrey','Lake','Gabby','Bowie','Yul','Bruno'] },
  { file: 'redemption', setting: 'survival-island', seed: 5151, cfg: { ri: true, riFormat: 'redemption' }, names: ['Zee','Nura','Dunia','Ernesto','Evie','Finn','Manu','Oliwia','Ren','Sami','Ara','Natasha','Misha','Stella','Joel','Ireland'] },
];
it('dumps two TD seasons for reading', () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const S of SEASONS) {
    if (process.env.ONLY && process.env.ONLY !== S.file) continue;
    const cast = S.names.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
    seededRun(() => runOneSeason({ romance: 'enabled', setting: S.setting, twistSchedule: [], ...(S.cfg || {}) }, 16, cast), S.seed);
    const out = [];
    for (const ep of core.gs.episodeHistory) {
      out.push(`\n\n########## EPISODE ${ep.num}${ep.isMerge ? ' (MERGE)' : ''}${ep.isFinale ? ' (FINALE)' : ''}  boot: ${ep.eliminated || '-'}  votes: ${JSON.stringify(ep.votes || {})}${ep.isTie ? ` TIE ${JSON.stringify(ep.tiedPlayers)} revote ${JSON.stringify(ep.revoteVotes || null)} rocks ${!!ep.isRockDraw} tb ${JSON.stringify(ep.tiebreakerResult || null)}` : ''}${(ep.idolPlays || []).length ? ` PLAYS ${JSON.stringify(ep.idolPlays.map(p => [p.player, p.type || 'idol', p.target || p.playedFor || null]))}` : ''}`);
      const prev = []; linesIn(ep.tdPreviously, 'previously', prev);
      for (const [p, ls] of prev) { out.push(`\n=== ${p}`); ls.forEach(l => out.push(line(l))); }
      for (const camp of Object.keys(ep.campStory || {})) for (const phase of ['pre', 'post']) {
        out.push(`\n=== CAMP ${camp} / ${phase === 'pre' ? 'before the challenge' : 'after the challenge'}`);
        campFeed(ep, camp, phase).forEach((s, i) => {
          const sp = s.scene?.spot || {};
          out.push(`\n-- ${i + 1}. ${s.kind || s.scene?.kind || s.type} [${sp.label || sp.id || ''} · ${sp.window || ''}]${s.chained ? ' (runs on)' : ''}`);
          (s.lines || []).forEach(l => out.push(line(l)));
          if (!(s.lines || []).length && s.text) out.push(`  ${s.text}`);
        });
      }
      // the island: its day, as the stepped viewer plays it (e.text), and the duel
      for (const key of ['riLifeEvents', 'rescueIslandEvents']) if ((ep[key] || []).length) {
        out.push(`\n=== ${key}`);
        for (const e of ep[key]) { out.push(`-- ${e.type} [${[e.player, e.player2].filter(Boolean).join(', ')}]`); if (e.text) out.push(e.text);
          const found = []; linesIn(e, 'e', found); for (const [, ls] of found) ls.forEach(l => out.push(line(l))); }
      }
      if (ep.riDuel) { out.push(`\n=== riDuel ${JSON.stringify({ w: ep.riDuel.winner, l: ep.riDuel.loser })}`); const found = []; linesIn(ep.riDuel, 'duel', found); for (const [p2, ls] of found) { out.push(`- ${p2}`); ls.forEach(l => out.push(line(l))); }
        for (const [k, v] of Object.entries(ep.riDuel)) if (typeof v === 'string' && v.length > 40) out.push(`[${k}] ${v}`); }
      for (const key of ['twistStory', 'tdFirstImp', 'tdAuction', 'exileStory', 'tribalStory1', 'tribalStory']) {
        const found = []; linesIn(ep[key], key, found);
        for (const [p, ls] of found) { out.push(`\n=== ${p}`); ls.forEach(l => out.push(line(l))); }
      }
    }
    fs.writeFileSync(`${OUT}/${S.file}.txt`, out.join('\n'));
  }
}, 900000);
