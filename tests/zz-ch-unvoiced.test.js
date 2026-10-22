// scratch: the turns that air without the speaker's voice, weighted by air time, with their text.
import { it } from 'vitest';
import fs from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { POOLS } from '../js/ch/script/lines/index.js';
import { voiceOf } from '../js/td/story/voice.js';
import { challengeCast } from './helpers/ch-cast.js';

const SEEDS = (process.env.SEEDS || '11,12,13,14,15,16,17,18,19,20').split(',').map(Number);
it('lists unvoiced aired turns', () => {
  const byId = {};
  for (const [key, list] of Object.entries(POOLS)) for (const e of list) byId[e.id] = { e, key };
  const miss = {};
  let missing = 0, spoken = 0;
  for (const seed of SEEDS) {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed });
    airSeason(r.state);
    for (const e of [...r.episodes, r.state.finalEp]) for (const a of e.aired || []) {
      const lines = [...(a.script?.lines || []), ...(a.ceremony || []).flatMap(c => c.script?.lines || [])];
      for (const l of lines) {
        if (l.kind === 'beat' || !l.by || l.by === 'TJ') continue;
        spoken++;
        if (l.voice) continue;
        missing++;
        const m = (miss[l.turn] ||= { n: 0, tags: {} });
        m.n++;
        const t = voiceOf(l.by)[0] || 'none';
        m.tags[t] = (m.tags[t] || 0) + 1;
      }
    }
  }
  const out = [`${missing} of ${spoken} unvoiced`];
  let cum = 0;
  for (const [turn, m] of Object.entries(miss).sort((a, b) => b[1].n - a[1].n)) {
    cum += m.n;
    const [id, i] = turn.split(':');
    const { e, key } = byId[id] || {};
    const t = e?.turns[Number(i)] || {};
    out.push(`${turn.padEnd(10)} ${String(m.n).padStart(3)} ${(100 * cum / missing).toFixed(0).padStart(3)}% [${key}] ${t.conf ? 'CONF ' : ''}keys=${Object.keys(t.v || {}).join(',') || '-'} :: ${t.say || t.conf}`);
  }
  fs.writeFileSync('transcripts/ch-unvoiced.txt', out.join('\n'));
});
