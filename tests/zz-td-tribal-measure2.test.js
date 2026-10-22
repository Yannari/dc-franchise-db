// @vitest-environment jsdom
// SCRATCH (story step 4): what Tribal asks and repeats, over six played seasons.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { tdTribalScreen, tdDoubleTribalScreen } from '../js/vp-td-ep/steps.js';

it('measures Tribal', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const names = ['Gwen','Leshawna','Heather','Duncan','Courtney','Owen','Lindsay','Trent','Julia','Millie','Aubrey','Lake','Gabby','Bowie','Yul','Bruno'];
  const cast = names.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
  const topics = {}, exitRep = [], qaRep = [], clockBack = [], revoteRep = [];
  let nights = 0;
  for (const [setting, seed] of [['hosted-camp', 1729], ['hosted-camp', 2026], ['survival-island', 1729], ['world-tour', 2026], ['film-lot', 81], ['carnival', 99]]) {
    seededRun(() => runOneSeason({ romance: 'enabled', setting, twistSchedule: [] }, 16, cast), seed);
    const exits = {}, qas = {};
    for (const ep of core.gs.episodeHistory) {
      const ts = ep.tribalStory;
      if (!ts) continue;
      nights++;
      for (const q of ts.qa || []) { topics[q.topic] = (topics[q.topic] || 0) + 1; for (const l of q.lines || []) if (l.by !== 'Chris' && l.text.length > 30) { qas[l.text] = (qas[l.text] || 0) + 1; } }
      for (const l of ts.exit || []) if (l.text?.length > 30) exits[l.text] = (exits[l.text] || 0) + 1;
      const scr = tdDoubleTribalScreen(ep, { host: 'Chris', setting }) || tdTribalScreen(ep, { host: 'Chris', setting });
      if (!scr) continue;
      let last = -1;
      for (const s of scr.steps) {
        const m = s.k === 'scene' && /^(\d{1,2}):(\d{2}) ([AP]M)$/.exec(s.time || '');
        if (!m) continue;
        const t = ((+m[1] % 12) + (m[3] === 'PM' ? 12 : 0)) * 60 + +m[2];
        if (t < last) clockBack.push(`${setting} ep${ep.num} ${s.time} after ${last}`);
        last = t;
      }
      const rv = scr.steps.filter(s => s.k === 'say' && s.revote !== undefined).map(s => s.text);
      const said = scr.steps.filter((s, i) => s.k === 'say' && scr.steps[i + 1]?.k === 'ballot' && scr.steps[i + 1]?.revote).map(s => s.text.replace(/\b[A-Z][a-z]+\b/g, 'X'));
      if (new Set(said).size < said.length) revoteRep.push(`${setting} ep${ep.num}`);
    }
    for (const [t, n] of Object.entries(exits)) if (n > 1) exitRep.push(`${setting}: ${n}x ${t.slice(0, 60)}`);
    for (const [t, n] of Object.entries(qas)) if (n > 1) qaRep.push(`${setting}: ${n}x ${t.slice(0, 60)}`);
  }
  const out = [`nights ${nights}`, `topics ${JSON.stringify(Object.entries(topics).sort((a, b) => b[1] - a[1]))}`,
    `exit lines repeated in a season: ${exitRep.length}`, ...exitRep.slice(0, 8), `qa lines repeated in a season: ${qaRep.length}`, ...qaRep.slice(0, 8),
    `clock backwards: ${clockBack.length}`, ...clockBack.slice(0, 5), `revote nights with a repeated line: ${revoteRep.length}`];
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/2d1e6251-1cdc-40bd-802d-421780223329/scratchpad/tribal-measure.txt', out.join('\n'));
}, 900000);
