import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { challengeCast } from './helpers/ch-cast.js';
it('kinds', () => {
  const c = {}; let size = 0, n = 0;
  for (const seed of [3, 5, 9, 21]) {
    const { cast, names, background } = challengeCast(24, seed); setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed }); airSeason(r.state);
    for (const row of challengeRows(r)) { size += JSON.stringify(row).length; n++;
      for (const a of row.ch.aired) { const k = a.kind + ' @' + a.spot + ' who' + Math.min(a.who.length, 5) + (a.lines.some(l => l.kind === 'beat') ? ' beat' : ''); c[k] = (c[k] || 0) + 1; } }
  }
  writeFileSync('transcripts/ch-kinds.txt', `avg row ${Math.round(size / n)} chars\n` + Object.entries(c).sort().map(([k, v]) => `${v}\t${k}`).join('\n'));
});
