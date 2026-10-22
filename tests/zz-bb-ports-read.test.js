// SCRATCH (delete by exact name): prints the ported stepped screens.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps, REPLACED } from '../js/vp-bb-ep/steps.js';
import { stageHtml } from '../js/vp-bb-ep/stage.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'perceptive-player', 'chaos-agent'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i], stats: spread(i + 1) }));

function play(cfg, weeks, seed = 11) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'enabled', theme: 'none', twistSchedule: [],
    bbTwins: 'off', bbRivals: 'off', bbSaboteur: 'off', bbDuos: 'off', bbDepartures: 'off' }, cfg);
  const out = [];
  for (let w = 0; w < weeks; w++) {
    const ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode());
    if (!ep) break;
    out.push(JSON.parse(JSON.stringify(ep)));
  }
  return out;
}
const twist = (type, eps) => ({ twistSchedule: eps.map(e => ({ episode: e, type })) });


import { writeFileSync } from 'fs';
const KINDS = new Set((process.env.KINDS || 'voice,primer,turn,havenots,departure,instant,double,avote,evict').split(','));
it('prints', () => {
  const cases = JSON.parse(process.env.CASES);
  const out = [];
  for (const c of cases) {
    for (const ep of play(c.cfg, c.weeks)) {
      for (const S of bbWeekSteps(ep)) {
        if (!KINDS.has(S.kind)) continue;
        if (S.kind === 'evict' && !S.sanctum && !process.env.ALLEVICT) continue;
        out.push(`##### ${c.name} w${ep.num} · ${S.kind} · ${S.title} [${S.set}] ${S.rules ? 'RULES=' + JSON.stringify(S.rules) : ''}`);
        for (const st of S.steps) out.push(`  ${st.k}${st.by ? ' ' + st.by : ''}: ${st.t}${st.big ? '  BIG=' + JSON.stringify(st.big) : ''}${st.board ? '  BOARD=' + JSON.stringify(st.board.rows.map(r => r.n + ':' + (r.text||''))) : ''}${st.toast ? ' TOAST=' + st.toast[0] : ''}${st.why ? ' WHY=' + JSON.stringify(st.why) : ''}`);
      }
    }
  }
  writeFileSync(process.env.OUT, out.join(String.fromCharCode(10)));
});
