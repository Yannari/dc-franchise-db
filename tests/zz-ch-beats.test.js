import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { challengeCast } from './helpers/ch-cast.js';
it('beats', () => {
  const out = []; const seen = new Set();
  for (const seed of [3, 5, 9, 11, 13]) {
    const { cast, names, background } = challengeCast(24, seed); setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed });
    for (const e of r.episodes) for (const d of e.arena) { const f = d.beats.map(b => b.kind).join(','); const k = d.game + '|' + f; if (seen.has(d.game)) continue; seen.add(d.game); out.push(d.game + ' ' + JSON.stringify(d.beats).slice(0, 700)); }
    for (const e of r.episodes) if (e.daily.mode !== 'solo' && !seen.has('mode' + e.daily.mode)) { seen.add('mode' + e.daily.mode); out.push('daily ' + e.daily.mode + ' ' + JSON.stringify({ units: e.daily.units, winners: e.daily.winners, last: e.daily.last, throws: e.daily.throws, moments: e.daily.moments, injuries: e.daily.injuries, reward: e.daily.reward, aftermath: e.daily.aftermath }).slice(0, 900)); }
  }
  writeFileSync('transcripts/ch-beats.txt', out.join('\n'));
});
