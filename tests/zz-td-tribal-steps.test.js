// @vitest-environment jsdom
// SCRATCH (story step 4): the stepped Tribal of a played season, as text, for reading.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { tdTribalScreen, tdDoubleTribalScreen, tdStepTranscript } from '../js/vp-td-ep/steps.js';

const OUT = 'C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/2d1e6251-1cdc-40bd-802d-421780223329/scratchpad/read';
it('dumps the stepped Tribals of a season', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const names = ['Gwen','Leshawna','Heather','Duncan','Courtney','Owen','Lindsay','Trent','Julia','Millie','Aubrey','Lake','Gabby','Bowie','Yul','Bruno'];
  const cast = names.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
  seededRun(() => runOneSeason({ romance: 'enabled', setting: 'hosted-camp', twistSchedule: [] }, 16, cast), 1729);
  const out = [];
  for (const ep of core.gs.episodeHistory) {
    const scr = tdDoubleTribalScreen(ep, { host: 'Chris', setting: 'hosted-camp' }) || tdTribalScreen(ep, { host: 'Chris', setting: 'hosted-camp' });
    if (!scr) continue;
    out.push(`\n\n########## EPISODE ${ep.num}  boot ${ep.eliminated}  votes ${JSON.stringify(ep.votes || {})}  steps ${scr.steps.length}`);
    out.push(...tdStepTranscript(scr).map(l => (typeof l === 'string' ? l : JSON.stringify(l))));
    out.push('-- step kinds: ' + JSON.stringify(scr.steps.reduce((o, s) => (o[s.k] = (o[s.k] || 0) + 1, o), {})));
  }
  fs.writeFileSync(`${OUT}/tribal-steps.txt`, out.join('\n'));
}, 600000);
