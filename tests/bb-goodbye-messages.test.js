// A goodbye message knows who the two of them were to each other.
//
// The segment had four tones — confession, no apology, from the heart, polite
// — and every line inside them was written to be sayable by anybody. So six
// messages could play without once mentioning that two of these people were in
// an alliance, or a showmance, or had spent a month openly loathing each other.
// The tone is the shape of a goodbye; it is not the content of one.
//
// Each fact the house actually holds now has its own lines, and this proves
// each one is REACHABLE. A random sample is no good for that: playing
// twenty-six seasons left four of the conditions at zero, and only one of them
// turned out to be genuinely broken — the rest were rare, or needed romance
// switched on, or were being measured over the first six weeks of a season
// where the thing does not happen yet. Constructing the state says which.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, addBond, bKey, bondLabel } from '../js/bonds.js';
import { generateBBEvictionInterview } from '../js/bb-aftermath.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Ace', 'Bea', 'Cal', 'Dot', 'Eli', 'Fay', 'Gus', 'Hana'];
const CAST = NAMES.map((n, i) => ({ name: n, gender: i % 2 ? 'm' : 'f',
  sexuality: 'straight', archetype: 'floater' }));
const OUT = 'Ace';                 // the one in the chair
const SPEAKER = 'Bea';             // the one whose message we are checking

/** A week that evicted Ace, with everybody voting the way `against` says. */
function week(against = true) {
  const voters = NAMES.filter(n => n !== OUT);
  return {
    num: 4, hoh: 'Cal', evicted: OUT, nominees: [OUT, 'Dot'],
    // The house comes off the WEEK, and the evictee off the episode. Getting
    // either wrong just returns null and every assertion below passes on an
    // empty segment.
    houseAtStart: [...NAMES],
    ballots: voters.map(v => ({ voter: v, evict: against ? OUT : 'Dot' })),
    voteOperation: { plans: [] },
  };
}

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  Object.assign(seasonConfig, { format: 'big-brother', jurySize: 9, finaleSize: 3 });
  gs.activePlayers = [...NAMES];
  gs.bb = { stats: {}, weeks: [], house: null };
  gs.showmances = [];
  gs.namedAlliances = [];
  gs.episodeHistory = [];
}

/** Every message in the segment, as one blob. */
function segment(w) {
  const ep = { num: 4, format: 'big-brother', eliminated: OUT, houseAtStart: [...NAMES] };
  const iv = generateBBEvictionInterview(ep, w, () => 0.5);
  return (iv?.goodbyes || []).map(g => `${g.text || ''} ${g.react || ''}`).join('\n');
}

/** Try every rng position, so a line that CAN be picked is found. */
function anyOf(w, re) {
  const ep = { num: 4, format: 'big-brother', eliminated: OUT, houseAtStart: [...NAMES] };
  for (let k = 0; k < 40; k++) {
    const iv = generateBBEvictionInterview(ep, w, () => (k + 0.5) / 40);
    const blob = (iv?.goodbyes || []).map(g => `${g.text || ''} ${g.react || ''}`).join('\n');
    if (re.test(blob)) return true;
  }
  return false;
}

describe('goodbye messages read the relationship', () => {
  beforeEach(house);

  it('says it out loud when the two of them were in an alliance', () => {
    gs.namedAlliances = [{ name: 'The Deal', members: [OUT, SPEAKER, 'Cal'], active: true, formed: 1 }];
    addBond(SPEAKER, OUT, 6);          // close AND voted them out -> confession
    expect(anyOf(week(true), /alliance|same side of this house|took it apart from the inside/i),
      'an ally who evicted them never mentions the alliance').toBe(true);
  });

  it('says it out loud when they were a showmance', () => {
    gs.showmances = [{ players: [OUT, SPEAKER], phase: 'together', broken: false }];
    addBond(SPEAKER, OUT, 7);
    expect(anyOf(week(false), /what we were|useless for about a week|none of this was strategy|play for both of us/i),
      'a showmance partner says nothing about the showmance').toBe(true);
  });

  it('says it out loud when they could not stand each other', () => {
    addBond(SPEAKER, OUT, -7);
    expect(anyOf(week(true), /didn't like me, I didn't like you|you'd know I was lying|since about week two/i),
      'two open enemies part with pleasantries').toBe(true);
  });

  it('the villain does not pretend to be sorry', () => {
    players.find(p => p.name === SPEAKER).archetype = 'villain';
    addBond(SPEAKER, OUT, 0);
    expect(anyOf(week(true), /you'd have done it to me|only use it against me on the jury/i),
      'a villain gives the same goodbye as everybody else').toBe(true);
  });

  it('the person who ran the vote owns it', () => {
    const w = week(true);
    w.voteOperation = { plans: [{ organizer: SPEAKER, target: OUT, expected: 5, majority: 4 }] };
    expect(anyOf(w, /helped put this vote together|It was mine\. Not the house/i),
      'the organiser of the eviction never admits to organising it').toBe(true);
  });

  it('nobody says the same thing twice in one segment', () => {
    // Six messages get featured and the pools used to hold four lines, so a
    // segment repeated itself — which is the one thing a farewell must not do.
    NAMES.forEach((n, i) => { if (n !== OUT) addBond(n, OUT, [5, -4, 2, 0, 6, -2, 3][i % 7]); });
    const ep = { num: 4, format: 'big-brother', eliminated: OUT, houseAtStart: [...NAMES] };
    for (let k = 0; k < 25; k++) {
      const iv = generateBBEvictionInterview(ep, week(true), () => (k + 0.5) / 25);
      const said = (iv?.goodbyes || []).filter(g => g.tone !== 'montage');
      expect(said.length, 'the segment produced nothing to check').toBeGreaterThan(3);
      const texts = said.map(g => g.text);
      const reacts = said.map(g => g.react).filter(Boolean);
      expect(new Set(texts).size, `a message repeated: ${texts.find((t, i) => texts.indexOf(t) !== i)}`)
        .toBe(texts.length);
      expect(new Set(reacts).size, 'a reaction repeated inside one segment').toBe(reacts.length);
    }
  });

  it('the person in the chair reacts as themselves', () => {
    // Temperament was the only thing ever read, and only for confessions: a
    // villain, a hero and a goat all watched somebody betray them and produced
    // the same four lines.
    const react = arch => {
      players.find(p => p.name === SPEAKER).archetype = 'floater';
      players.find(p => p.name === OUT).archetype = arch;
      addBond(SPEAKER, OUT, 6);
      const ep = { num: 4, format: 'big-brother', eliminated: OUT, houseAtStart: [...NAMES] };
      const out = new Set();
      for (let k = 0; k < 30; k++) {
        const iv = generateBBEvictionInterview(ep, week(true), () => (k + 0.5) / 30);
        (iv?.goodbyes || []).forEach(g => { if (g.react) out.add(g.react); });
      }
      return out;
    };
    const villain = react('villain');
    const hero = react('hero');
    expect([...villain].some(r => /good|relieved to have been right/i.test(r)),
      'a villain in the chair reacts like everybody else').toBe(true);
    expect([...hero].some(r => /that's alright|taking notes/i.test(r)),
      'a hero in the chair reacts like everybody else').toBe(true);
  });
});
