import { it } from 'vitest';
import { appendFileSync, writeFileSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { challengeCast } from './helpers/ch-cast.js';
it('who keeps going in', () => {
  const out = 'transcripts/ch-votedin.txt'; writeFileSync(out, '');
  for (const seed of [1, 2, 3, 4]) {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed });
    const cnt = {};
    for (const e of r.episodes) for (const v of e.votedIn) cnt[v] = (cnt[v] || 0) + 1;
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    if (!top) continue;
    const [n] = top;
    appendFileSync(out, `seed ${seed}: ${n} in ${top[1]}x, arena ${r.state.rec[n].arenaW}-${r.state.rec[n].arenaL}, volunteered ${r.state.rec[n].volunteered}\n`);
    for (const e of r.episodes) for (const v of e.votes) if (v.votedIn === n) {
      const why = {}; for (const b of v.ballots.filter(b => b.target === n)) why[b.why] = (why[b.why] || 0) + 1;
      appendFileSync(out, `  ep ${e.ep}: ${v.tally[n]}/${v.ballots.length} ${JSON.stringify(why)} meetings ${JSON.stringify(e.delib.targets)}\n`);
    }
  }
});
