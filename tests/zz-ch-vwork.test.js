import { it } from 'vitest';
import { createRequire } from 'module';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { POOLS, LONGER } from '../js/ch/script/lines/index.js';
import { voiceOf } from '../js/td/story/voice.js';
import { FAMILY } from '../js/td/story/voice-family-map.js';
import { challengeCast } from './helpers/ch-cast.js';
const require = createRequire(import.meta.url);
it('work list', () => {
  const byId = {}; for (const [k, l] of Object.entries(POOLS)) for (const e of l) byId[e.id] = { e, k };
  const miss = {};
  for (const seed of [11, 22, 33, 44, 55, 66, 77, 88]) {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed });
    airSeason(r.state);
    for (const e of r.episodes) for (const a of e.aired || []) for (const l of a.script?.lines || []) {
      if (!l.turn || l.voice || l.kind === 'beat' || l.by === 'TJ') continue;
      const fam = FAMILY[voiceOf(l.by)[0]] || 'none';
      const m = (miss[l.turn] ||= { n: 0, fam: {} }); m.n++; m.fam[fam] = (m.fam[fam] || 0) + 1;
    }
  }
  const rows = Object.entries(miss).sort((a, b) => b[1].n - a[1].n).slice(0, 600).map(([turn, m]) => {
    const [id, i] = [turn.slice(0, turn.lastIndexOf(':')), Number(turn.slice(turn.lastIndexOf(':') + 1))];
    const { e, k } = byId[id] || {};
    const t = e?.turns[i];
    return { turn, key: k, n: m.n, fam: m.fam, by: t?.by, kind: t?.conf ? 'conf' : 'say', text: t?.say || t?.conf, has: Object.keys(t?.v || {}),
      ctx: (e?.turns || []).slice(Math.max(0, i - 2), i).map(x => `${x.by || '-'}: ${x.say || x.conf || x.beat}`).join(' / ') };
  });
  require('fs').writeFileSync(process.env.TEMP + '/zzch/vwork.json', JSON.stringify(rows));
}, 900000);
