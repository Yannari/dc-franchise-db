// SCRATCH (delete by exact name): plays a Big Brother season and writes every aired scene to a text
// file for reading, with the season's verbatim repeats counted at the top.
import { it } from 'vitest';
import { writeFileSync } from 'fs';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Beth', 'Owen'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'perceptive-player', 'challenge-beast'];
const SEED = Number(process.env.SEED || 31);
const OUT = process.env.OUT || 'bb-read.txt';

it('reads a season', () => {
  seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] })), { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, ...(process.env.THEME ? { theme: process.env.THEME } : {}) });
  const out = [];
  const said = new Map();
  for (let w = 0; w < 11; w++) {
    let ep;
    try { ep = JSON.parse(JSON.stringify(withSeededRandom(SEED * 100 + w, () => simulateBBEpisode()))); } catch (e) { out.push(`!! week ${w + 1}: ${e.message}`); break; }
    if (!ep) break;
    out.push(`\n################ WEEK ${ep.num} ################`);
    const wk = (gs.bb?.weeks || []).at(-1) || {};
    out.push('  ' + Object.entries(wk).filter(([k, v]) => /^(hoh|initialNominees|finalNominees|veto\w*|evicted|replacement\w*)$/.test(k) && (typeof v !== 'object' || Array.isArray(v)))
      .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join('/') : v}`).join(' | '));
    out.push('  hohComp: ' + (wk.hohCompetition ? `${wk.hohCompetition.name}: ${(wk.hohCompetition.placements || []).join(' > ')}` : '-'));
    out.push('  alliances: ' + (gs.namedAlliances || []).filter(a => a.active !== false && !a.dissolved).map(a => `${a.name}[${(a.members || []).join(',')}]${a.formed != null ? '@' + a.formed : ''}`).join(' '));
    for (const act of ep.acts || []) {
      out.push(`\n======== ${act.type} ========`);
      for (const sc of act.scenes || []) {
        out.push(`\n[${sc.step || sc.type || '?'}] ${(sc.cast || []).join(', ')}${sc.room ? ' @' + sc.room : ''}${sc.lineId ? ' #' + sc.lineId : ''}`);
        for (const l of sc.lines || []) {
          const t = String(l.text || '');
          out.push(`  ${l.kind === 'beat' ? '  ~' : (l.by || '?') + (l.kind === 'dr' ? ' (DR)' : '') + ':'} ${t}`);
          if (l.kind !== 'beat' && t.length > 25) said.set(t, (said.get(t) || 0) + 1);
        }
      }
    }
    if (gs.activePlayers?.length <= 3) break;
  }
  const reps = [...said].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
  const head = [`seed ${SEED}; lines ${said.size}; repeated verbatim ${reps.length}`, ...reps.slice(0, 40).map(([t, n]) => `  x${n} ${t}`)];
  writeFileSync(OUT, [...head, ...out].join('\n'));
}, 600000);
