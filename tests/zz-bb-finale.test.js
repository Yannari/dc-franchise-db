// SCRATCH (delete by exact name): the finale week, as the stepped viewer airs it.
import { it } from 'vitest';
import { writeFileSync } from 'fs';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { plateFor } from '../js/vp-bb-ep/plates.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'perceptive-player', 'chaos-agent'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i], stats: spread(i + 1) }));

it('prints', () => {
  const seed = Number(process.env.SEED || 11);
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'enabled', theme: 'none', twistSchedule: [] });
  const eps = [];
  for (let w = 0; w < 20; w++) {
    const ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode());
    if (!ep) break;
    const c = JSON.parse(JSON.stringify(ep));
    eps.push(c);
    gs.episodeHistory = gs.episodeHistory || [];
    if ((gs.activePlayers || []).length <= 3) break;
  }
  const fin = withSeededRandom(seed * 7, () => runBBFinale());
  if (fin) eps.push(JSON.parse(JSON.stringify(fin)));
  const out = [];
  for (const ep of eps.slice(-Number(process.env.LAST || 2))) {
    out.push(`\n===== WEEK ${ep.num} finale=${!!ep.isFinale} house=${(ep.houseAtStart || []).length}`);
    for (const a of ep.acts || []) out.push(`  act ${a.type}${a.segment ? ' seg' + a.segment : ''} beats=${(a.beats || []).length} social=${(a.socialBeats || []).length} scenes=${(a.scenes || []).length}${a.acts ? ' groups=' + a.acts.map(g => g.title + ':' + (g.beats || []).length).join('|') : ''}`);
    const prior = eps.slice(0, eps.indexOf(ep)).flatMap(e => (e.acts || []).filter(x => x && /evict/.test(x.type || '') && typeof x.evicted === 'string').map(x => x.evicted));
    const steps = bbWeekSteps(ep, { priorEvicted: prior });
    out.push('  -- stepped');
    for (const S of steps) {
      let pl = null; try { pl = plateFor(S); } catch { pl = 'ERR'; }
      out.push(`  [${S.kind}] ${S.id} "${S.title}" set=${S.set} plate=${pl} steps=${S.steps.length}`);
      if (process.env.FULL) for (const st of S.steps) out.push(`      ${st.k}${st.by ? ' ' + st.by : ''}: ${st.t}${st.scene ? ' {' + st.scene.set + '}' : ''}`);
    }
    let vp = [];
    try { vp = buildVPScreens(ep) || []; } catch (e) { out.push('VP ERR ' + e.message); }
    out.push('  -- in the viewer');
    for (const s of vp) out.push(`  ${String(s.html).includes('class="bbx"') ? 'STEP' : 'CLASSIC'} ${s.id} · ${s.label}`);
  }
  if (process.env.DUMPACT) { const f = eps.at(-1); writeFileSync(process.env.DUMPACT, JSON.stringify((f.acts || []).filter(a => /finale-house|final-cut|americas-fav|jury-vote/.test(a.type)), null, 1)); }
  writeFileSync(process.env.OUT, out.join(String.fromCharCode(10)));
});
