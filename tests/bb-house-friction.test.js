// Most of what a Big Brother house argues about is not strategy. It is dishes,
// noise, somebody eating the last of something, being talked down to, a laugh
// that stopped being funny four weeks ago.
//
// The catalogue had the strategic side well covered and about twenty beats to
// carry everything else, so the ordinary texture repeated long before the game
// did. These are sixteen more: eight ways to fall out over nothing, eight ways
// to spend an afternoon.
//
// Deliberately the SAME weight as everything else in the pool. They exist to
// widen what can happen on a given day, not to take days away from the events
// that move the game.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { FRICTION_EVENTS } from '../js/bb-events/house-friction.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee',
  'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer',
  'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead',
  'wildcard', 'chaos-agent', 'perceptive-player'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

const MINE = new Set(FRICTION_EVENTS.map(e => e.id));
let beats = [];

beforeAll(() => {
  for (const seed of [3, 11, 23, 41]) {
    setGs(null);
    setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(),
      gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
      stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3 + seed) % 10)])) })));
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats,
      pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
      bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1 });
    seasonConfig.twistSchedule = [];
    initGameState();
    globalThis.gs = gs;
    withSeededRandom(seed, () => { for (let i = 0; i < 8; i++) simulateBBEpisode(); });
    for (const w of gs.bb.weeks) {
      for (const act of (w.acts || [])) {
        for (const b of (act.socialBeats || [])) beats.push(b);
      }
    }
  }
}, 900000);

const mineFired = () => beats.filter(b => MINE.has(b.eventId));

describe('the house has more ways to be a house', () => {
  it('registers every one of them, or they are unreachable', () => {
    for (const e of FRICTION_EVENTS) {
      expect(HOUSE_EVENTS.some(h => h.id === e.id), e.id + ' is not registered').toBe(true);
    }
  });

  it('fires all sixteen across a handful of seasons', () => {
    const seen = new Set(mineFired().map(b => b.eventId));
    const never = FRICTION_EVENTS.map(e => e.id).filter(id => !seen.has(id));
    expect(never, 'written but never reachable: ' + never.join(', ')).toHaveLength(0);
  });

  it('spreads across them rather than leaning on two', () => {
    const counts = {};
    for (const b of mineFired()) counts[b.eventId] = (counts[b.eventId] || 0) + 1;
    const total = mineFired().length;
    for (const [id, n] of Object.entries(counts)) {
      expect(n / total, id + ' is eating the pool').toBeLessThan(0.2);
    }
  });
});

describe('they do not take the season over', () => {
  it('stay a slice of the house rather than the house itself', () => {
    // Same weight as everything else in the pool, on purpose: a friction beat
    // that outbid a scheme would make the house louder and the season emptier.
    const share = mineFired().length / beats.length;
    expect(share, 'never fired at all').toBeGreaterThan(0.02);
    expect(share, 'crowding out the events that move the game').toBeLessThan(0.25);
  });

  it('keep out of the way on the nights that decide things', () => {
    // Nobody is arguing about the dishes during the eviction.
    const src = require('node:fs').readFileSync('js/bb-events/house-friction.js', 'utf8');
    expect(src).toMatch(/case 'eviction': return 0\.2;/);
    expect(src).toMatch(/case 'veto-ceremony': return 0\.25;/);
  });
});

describe('nothing here is only decoration', () => {
  it('names who was in it and carries a badge', () => {
    for (const b of mineFired()) {
      expect(b.players?.length, b.eventId + ' named nobody').toBeGreaterThan(0);
      expect(b.badgeText, b.eventId + ' has no badge').toBeTruthy();
    }
  });

  it('changes a bond, a memory or a reputation every time', () => {
    // The house rule: a row about a frying pan does not move a vote, but it
    // moves who somebody sits next to for three days.
    const src = require('node:fs').readFileSync('js/bb-events/house-friction.js', 'utf8');
    for (const e of FRICTION_EVENTS) {
      const start = src.indexOf("id: '" + e.id + "'");
      const body = src.slice(start, src.indexOf('badgeText', start));
      expect(/api\.(addBond|remember|popDelta|suspicion)\(/.test(body),
        e.id + ' changes nothing').toBe(true);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// The writing itself, checked the way the consequences are.
//
// An audit of the first draft found three faults worth guarding against, all
// of which read as carelessness on screen:
//
//   · a card that draws two to four portraits and then says "somebody",
//     which is the reader being shown faces and told nothing about them
//   · a pronoun branch that agrees on one side and not the other —
//     "They go outside and stands there"
//   · variables declared and never used, which is the tell that a line was
//     written and then written differently
// ══════════════════════════════════════════════════════════════════════
describe('the prose holds up on its own', () => {
  const src = require('node:fs').readFileSync('js/bb-events/house-friction.js', 'utf8');

  /** Every text variant, per event. */
  const variantsByEvent = () => {
    const out = [];
    const re = /id: '([\w-]+)'[\s\S]*?_variant\(\[([\s\S]*?)\n    \], ctx/g;
    let m;
    while ((m = re.exec(src))) {
      out.push({ id: m[1], variants: [...m[2].matchAll(/`([^`]+)`/g)].map(v => v[1]) });
    }
    return out;
  };

  it('names somebody in every single line', () => {
    // The card renders a portrait for each name in `players`. A variant that
    // names nobody puts four faces beside a sentence about "somebody".
    for (const { id, variants } of variantsByEvent()) {
      variants.forEach((v, i) => {
        const refs = [...v.matchAll(/\$\{(\w+)(?:\[\d\])?[^}]*\}/g)]
          .map(x => x[1]).filter(n => !['p', 'pb', 'ctx'].includes(n));
        expect(refs.length, `${id} variant ${i + 1} names nobody: "${v.slice(0, 60)}..."`)
          .toBeGreaterThan(0);
      });
    }
  });

  it('gives every event at least four ways to say it', () => {
    for (const { id, variants } of variantsByEvent()) {
      expect(variants.length, `${id} would repeat itself`).toBeGreaterThanOrEqual(4);
    }
  });

  it('agrees with itself on both sides of a pronoun branch', () => {
    // "They go outside afterwards and stands there until it passes."
    const branches = [...src.matchAll(
      /\$\{p\w*\.Sub\} \$\{p\w*\.sub === 'they' \? '(\w+)' : '(\w+)'\}([^`]{0,120})/g)];
    for (const b of branches) {
      const tail = b[3];
      const dangling = tail.match(/\b(?:and|then)\s+(\w+s)\b/);
      expect(dangling, `plural subject with a singular verb: "...${tail.slice(0, 70)}"`).toBeNull();
    }
  });

  it('declares nothing it does not use', () => {
    const dead = [];
    for (const m of src.matchAll(/const (p\w*) = pronouns\((\w+)\);([\s\S]{0,2000}?)(?=\n  \},)/g)) {
      if (!m[3].includes('${' + m[1] + '.')) dead.push(m[2]);
    }
    expect(dead, 'declared and never used: ' + dead.join(', ')).toHaveLength(0);
  });
});
