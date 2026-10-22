// @vitest-environment jsdom
// SCRATCH: chalMoments per episode. Never commit; delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { chalMoments } from '../js/td/story/chalmoments.js';
it('dbg', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players.filter(r => r.stats && r.archetype);
  const cast = roster.slice(0, 16).map((p, i) => ({ ...p, tribe: i % 2 ? 'Bass' : 'Gophers' }));
  const sched = [['2', 'dodgebrawl'], ['3', 'paintball-hunt'], ['4', 'sucky-outdoors'], ['5', 'basic-straining']].map(([e, t]) => ({ id: 'x' + e, episode: +e, type: t }));
  seededRun(() => runOneSeason({ romance: 'enabled', twistSchedule: sched }, 16, cast), 2);
  const out = [];
  for (const ep of core.gs.episodeHistory.slice(0, 6)) {
    delete ep._chalMoments;
    const m = chalMoments(ep);
    const aired = Object.values(ep.campStory || {}).flatMap(c => [...(c.post || [])]).filter(x => /^chm\./.test(x?.kind || '')).length;
    out.push(`${ep.num} ${(ep.twists || []).map(t => t.type)} moments=${m.length} aired=${aired} kinds=${[...new Set(m.map(x => x.kind))].join(',')}`);
  }
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/chm-dbg.txt', out.join('\n'));
});
