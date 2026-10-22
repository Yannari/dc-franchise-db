// SCRATCH (delete by exact name): which twists and modes the stepped viewer still shows on a classic screen,
// and which stage sets play with no Reality Resort plate (the Blender room fallback).
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

const classic = {}, noPlate = {}, threw = [];
function look(label, ep) {
  let legacy = [], stepped = [];
  try { legacy = buildVPScreens(ep) || []; } catch (e) { threw.push(`${label}: classic ${e.message}`); }
  stepped = legacy; // buildVPScreens already applies the stepped viewer
  for (const s of stepped) {
    const html = String(s.html || '');
    // classic on purpose: the title videos, the House Status boards, and the competitions (the user, 2026-10-14:
    // "hoh stay classic, and veto, and blockbuster")
    if (html.includes('class="bbx"') || /^bb-(titles|closing|overview|overview-after|hoh|veto|safety)(-\d+)?$/.test(s.id || '')) continue;
    const key = `${s.id || '?'} — ${s.label || ''}`.replace(/-\d+\b/g, '-N');
    (classic[key] ||= new Set()).add(label);
  }
  let steps = [];
  try { steps = bbWeekSteps(ep); } catch (e) { threw.push(`${label}: steps ${e.message}`); }
  for (const S of steps) {
    let id = null;
    try { id = plateFor(S); } catch { id = null; }
    if (id) continue;
    const key = `${S.set}${S.arena ? ' (arena)' : ''}${S.built ? ' (built)' : ''} · ${S.kind}`;
    (noPlate[key] ||= new Set()).add(label);
  }
}

function play(label, cfg, weeks, seed = 11) {
  reset(cfg);
  for (let w = 0; w < weeks; w++) {
    let ep = null;
    try { ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode()); } catch (e) { threw.push(`${label} week ${w + 1}: ${e.message}`); break; }
    if (!ep) break;
    look(label, JSON.parse(JSON.stringify(ep)));
  }
}

it('measures', () => {
  // a whole plain season, to the finale
  play('plain season', {}, 14);
  for (const theme of ['summer-of-temptation', 'machine-summer', 'summer-of-mystery', 'high-rollers', 'summer-camp', 'summer-school']) play(`theme ${theme}`, { theme }, 4);
  play('mode block-buster', { bbSafetyMode: 'block-buster' }, 4);
  play('mode have-nots every week', { bbHaveNots: 'every-week' }, 3);
  play('mode departures often', { bbDepartures: 'often' }, 5);
  play('season twins', { bbTwins: 'random' }, 4);
  play('season rivals', { bbRivals: 'auto' }, 4);
  play('season saboteur', { bbSaboteur: 'random' }, 4);
  for (const twist of [...BB_TWIST_IDS]) play(`twist ${twist}`, { twistSchedule: Array.from({ length: 4 }, (_, i) => ({ episode: i + 1, type: twist })) }, 4);
  const fmt = o => Object.entries(o).sort((a, b) => b[1].size - a[1].size).map(([k, v]) => `${k}  [${v.size}] ${[...v].slice(0, 6).join(', ')}${v.size > 6 ? ' …' : ''}`).join('\n');
  writeFileSync(process.env.OUT || 'coverage.txt', `TWISTS: ${BB_TWIST_IDS.size}\n\n== CLASSIC SCREENS INSIDE THE STEPPED VIEWER ==\n${fmt(classic)}\n\n== STAGES WITH NO PLATE ==\n${fmt(noPlate)}\n\n== THREW ==\n${threw.slice(0, 40).join('\n')}\n`);
});
