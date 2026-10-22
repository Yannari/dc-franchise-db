// SCRATCH (delete by exact name): one example of every BB act type, for porting screens.
import { it } from 'vitest';
import { writeFileSync } from 'fs';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, BB_TWIST_IDS } from '../js/bb-run.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { bbStepScreens } from '../js/vp-bb-ep/screens.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { plateFor } from '../js/vp-bb-ep/plates.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'perceptive-player', 'chaos-agent'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i], stats: spread(i + 1) }));

function reset(cfg) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'enabled', theme: 'none', twistSchedule: [],
    bbTwins: 'off', bbRivals: 'off', bbSaboteur: 'off', bbDuos: 'off', bbDepartures: 'off' }, cfg);
}


const seen = {};
function look(label, ep) {
  for (const a of ep.acts || []) {
    if (!a || !a.type) continue;
    if (seen[a.type]) continue;
    const c = JSON.parse(JSON.stringify(a));
    delete c.state; delete c.socialBeats; delete c.bondsAt;
    seen[a.type] = { label, act: c };
  }
  if (process.env.ORDER && label === process.env.ORDER) (globalThis.__ord ||= []).push((ep.acts || []).map(a => `${a.type}${a.segment != null ? ' seg' + a.segment : ''}${a.side ? ' side=' + a.side : ''}${a.nominees ? '[' + a.nominees.join(',') + ']' : ''}${a.blockHack ? ' HACK ' + JSON.stringify(a.blockHack) : ''}${a.voter ? ' voter=' + a.voter : ''}${a.nominee ? ' nominee=' + a.nominee : ''}${a.ballots ? ' ballots=' + a.ballots.map(b => b.voter + '>' + b.evict).join(',') : ''}`).join('\n   '));
}
function play(label, cfg, weeks, seed = 11) {
  reset(cfg);
  for (let w = 0; w < weeks; w++) {
    let ep = null;
    try { ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode()); } catch (e) { break; }
    if (!ep) break;
    look(label, JSON.parse(JSON.stringify(ep)));
  }
}
it('dumps', () => {
  if (process.env.ONLYTW) {
    for (const twist of process.env.ONLYTW.split(',')) play(`twist ${twist}`, { twistSchedule: Array.from({ length: 4 }, (_, i) => ({ episode: i + 1, type: twist })) }, 3);
    writeFileSync(process.env.OUT || 'acts.json', JSON.stringify(seen, null, 1));
    if (process.env.ORDER) writeFileSync(process.env.OUT + '.order.txt', (globalThis.__ord || []).join('\n=====\n'));
    return;
  }
  for (const theme of ['summer-of-temptation', 'machine-summer', 'summer-of-mystery', 'high-rollers', 'summer-camp', 'summer-school']) play(`theme ${theme}`, { theme }, 4);
  play('mode have-nots every week', { bbHaveNots: 'every-week' }, 3);
  play('mode departures often', { bbDepartures: 'often' }, 5);
  play('season rivals', { bbRivals: 'auto' }, 4);
  play('season saboteur', { bbSaboteur: 'random' }, 4);
  for (const twist of [...BB_TWIST_IDS]) play(`twist ${twist}`, { twistSchedule: Array.from({ length: 4 }, (_, i) => ({ episode: i + 1, type: twist })) }, 4);
  writeFileSync(process.env.OUT || 'acts.json', JSON.stringify(seen, null, 1));
  if (process.env.ORDER) writeFileSync(process.env.OUT + '.order.txt', (globalThis.__ord || []).join('\n=====\n'));
  if (process.env.ONLY) return;
});
