// A showmance with somebody waiting at home (bb-events/cheating.js, bb/script/lines/cheat.js).
//
// The user, 2026-10-23: "add the remorse and cheating events in bb". A houseguest spoken for at home who starts
// a showmance gets remorse (guilt or a shrug, as loyal as they are), the house talking about it, the other half
// confronting them (walks or stays), and sometimes ends it for home. Every one changes bonds, popularity or the
// showmance itself, and every one airs.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { POOLS } from '../js/bb/script/lines/index.js';
import CHEAT from '../js/bb/script/lines/cheat.js';
import { homeWords } from '../js/bb-events/cheating.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];

function season(seed, weeks) {
  seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] })), { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'enabled' });
  const set = (n, at, loyalty) => { const p = players.find(x => x.name === n); p.partnerAtHome = at; p.stats.loyalty = loyalty; };
  set('Scary', { slug: null, name: "Scary's husband", stage: 'married', outside: true, named: false, word: 'husband' }, 3);
  set('Chase', { slug: null, name: 'Dana', stage: 'married', outside: true, named: true, word: 'wife' }, 6);
  set('Axel', { slug: null, name: "Axel's girlfriend", stage: 'dating', outside: true, named: false, word: 'girlfriend' }, 2);
  const eps = [];
  for (let w = 0; w < weeks; w++) eps.push(JSON.parse(JSON.stringify(withSeededRandom(seed * 100 + w, () => simulateBBEpisode()))));
  const scenes = new Map();
  const walk = o => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(walk);
    if (typeof o.step === 'string' && o.step.startsWith('cheat-') && Array.isArray(o.lines) && o.id) scenes.set(o.id, o);
    Object.values(o).forEach(walk);
  };
  walk(eps);
  return { scenes: [...scenes.values()], shows: JSON.parse(JSON.stringify(gs.showmances || [])) };
}

describe('the words', () => {
  it('has a full pool for every scene, with ids of its own', () => {
    for (const k of ['cheat.remorse.guilt', 'cheat.remorse.cold', 'cheat.gossip.scene', 'cheat.confront.done', 'cheat.confront.stays', 'cheat.endit.scene']) {
      expect(POOLS[k]?.length, k).toBeGreaterThanOrEqual(6);
    }
    const ids = Object.values(CHEAT).flat().map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('says who is at home the way each speaker would', () => {
    expect(homeWords('Scary', { name: "Scary's husband", stage: 'married', outside: true, named: false, word: 'husband' }))
      .toMatchObject({ home: `${pronouns('Scary').posAdj} husband`, myhome: 'my husband', yourhome: 'your husband', Myhome: 'My husband', status: 'married' });
    expect(homeWords('Chase', { name: 'Dana', stage: 'married', outside: true, named: true, word: 'wife' }))
      .toMatchObject({ home: 'Dana', myhome: 'Dana', Yourhome: 'Dana' });
    expect(homeWords('Axel', { name: "Axel's girlfriend", stage: 'dating', outside: true, named: false, word: 'girlfriend' }).status).toBe('with someone');
  });

  it('never opens a sentence on a lower-case "my husband"', () => {
    const text = Object.values(CHEAT).flat().flatMap(e => e.turns.map(t => t.say || t.dr || t.beat || ''));
    expect(text.filter(t => /(^|[.!?]\s+)\{(home|myhome|yourhome)\}/.test(t))).toEqual([]);
  });
});

describe('in a season', () => {
  const A = season(4, 8);
  const B = season(5, 8);
  const all = [...A.scenes, ...B.scenes];

  it('airs the remorse, the gossip and the confrontation, every placeholder filled', () => {
    const steps = new Set(all.map(s => s.step));
    for (const s of ['cheat-remorse', 'cheat-gossip', 'cheat-confront']) expect(steps.has(s), s).toBe(true);
    const lines = all.flatMap(s => s.lines.map(l => l.text));
    expect(lines.filter(t => /\{|\}/.test(t))).toEqual([]);
  });

  it('can end the showmance: walked out on over home, or called off for it', () => {
    const types = [...A.shows, ...B.shows].map(s => s.breakupType);
    expect(types).toContain('cheating');
    expect(types).toContain('remorse');
  });
});

describe('the wiring', () => {
  it('always airs, and the homecoming counts a showmance that ended as straying', () => {
    expect(readFileSync('js/bb/story/director.js', 'utf8')).toMatch(/\|island-\|cheat-\)\/;/);
    expect(readFileSync('js/bb-aftermath.js', 'utf8')).toMatch(/sh\.phase !== 'broken-up' \|\| sh\.breakupType === 'cheating'/);
  });
});
