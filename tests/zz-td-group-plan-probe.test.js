// @vitest-environment jsdom
// SCRATCH: a named alliance that decides tonight's name at the booth ("The Network wanted Julia") — did the
// camp ever show that alliance making the plan? Per episode, per named bloc with a target.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { campFeed } from '../js/td/story/feed.js';

const OUT = 'C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/2d1e6251-1cdc-40bd-802d-421780223329/scratchpad/read';
const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const SEASONS = [
  { file: 'hosted', setting: 'hosted-camp', seed: 1729, names: ['Gwen','Leshawna','Heather','Duncan','Courtney','Owen','Lindsay','Trent','Julia','Millie','Aubrey','Lake','Gabby','Bowie','Yul','Bruno'] },
  { file: 'island', setting: 'survival-island', seed: 4711, names: ['Zee','Nura','Dunia','Ernesto','Evie','Finn','Manu','Oliwia','Ren','Sami','Ara','Natasha','Misha','Stella','Joel','Ireland'] },
  { file: 'carnival', setting: 'carnival', seed: 3131, names: ['Alessio','Amelie','Anastasia','Benji','Diego','Hannah','Isabel','Ivy','Jade','Logan','Lynda','Marissa','Natalia','Richard','Spencer','Tristan'] },
  { file: 'worldtour', setting: 'world-tour', seed: 2026, names: ['Alejandro','Heather','Gwen','Duncan','Courtney','Owen','Izzy','Cody','Sierra','Lindsay','Harold','Leshawna','Noah','Bridgette','Geoff','Trent'] },
];
const line = l => l.kind === 'beat' || !l.by ? `(${l.text})` : `${l.by}${l.kind === 'conf' ? ' [conf]' : ''}: ${l.text}`;
it('group plans on screen', () => {
  const out = [];
  let blocs = 0, shown = 0, named = 0, boothNamed = 0, boothUnseen = 0;
  for (const S of SEASONS) {
    if (process.env.ONLY && process.env.ONLY !== S.file) continue;
    const cast = S.names.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
    seededRun(() => runOneSeason({ romance: 'enabled', setting: S.setting, twistSchedule: [] }, 16, cast), S.seed);
    const gs = core.gs;
    const names = new Set((gs.namedAlliances || []).map(a => a.name));
    for (const ep of gs.episodeHistory) {
      const tribal = ep.tribalPlayers || [];
      const scenes = Object.keys(ep.campStory || {}).flatMap(c => ['pre', 'post'].flatMap(ph => campFeed(ep, c, ph)));
      const text = scenes.map(s => (s.lines || []).map(l => l.text).join(' ')).join('\n');
      const booth = []; const walk = v => { if (!v || typeof v !== 'object') return; if (Array.isArray(v)) return v.forEach(walk); if (typeof v.text === 'string' && v.by) booth.push(v); Object.values(v).forEach(walk); };
      walk(ep.tribalStory);
      for (const al of ep.alliances || []) {
        if (!al.target || !names.has(al.label)) continue;
        const mem = (al.members || []).filter(m => tribal.includes(m) && m !== al.target);
        const wrote = mem.filter(m => (ep.votingLog || []).some(v => v.voter === m && v.voted === al.target));
        if (wrote.length < 2) continue;
        blocs++;
        // a plan scene on that name with two of its members in it
        const sc = scenes.find(s => ['plan', 'other'].includes(s.step) && s.scene?.data?.target === al.target && wrote.filter(m => (s.players || []).includes(m)).length >= 2);
        const saysName = text.includes(al.label);
        if (sc) shown++;
        if (saysName) named++;
        const bl = booth.filter(l => l.text.includes(al.label));
        if (bl.length) { boothNamed++; if (!saysName) boothUnseen++; }
        const plan = scenes.find(s => s.step === 'plan');
        out.push(`${S.file} ep${ep.num} ${al.label} -> ${al.target} (wrote: ${wrote.join(', ')}; boot ${ep.eliminated}) planScene:${sc ? 'yes' : 'NO'} nameSaid:${saysName ? 'yes' : 'NO'} boothSays:${bl.length}`
          + (sc ? '' : `\n   the plan that aired: ${plan ? `${plan.scene?.who?.a} on ${plan.scene?.data?.target} with ${(plan.players || []).join(', ')} group=${plan.scene?.data?.group || '-'}` : 'none'}`)
          + (sc && process.env.SHOW ? '\n' + (sc.lines || []).map(l => '      ' + line(l)).join('\n') : '')
          + (bl.length && !saysName ? `\n   booth: ${bl.map(line).join(' | ')}` : ''));
      }
    }
  }
  out.unshift(`named blocs with 2+ members writing their name: ${blocs}; a plan scene with 2 of them: ${shown}; the alliance's name said in camp: ${named}; booth says the name: ${boothNamed}, of those never said in camp: ${boothUnseen}`);
  fs.writeFileSync(`${OUT}/group-plan.txt`, out.join('\n'));
}, 900000);
