// Rivals — three people who already knew somebody in there.
//
// From the wiki, BB8: "After entering the house, the original eleven
// houseguests were informed that they would be joined by three people, all of
// whom had a tense connection with another player in the game. During the end
// of the first HOH competition, the Rivals were asked to determine the winner
// ... The Rivals could not compete nor could they be nominated during the first
// week."
//
//   Dick Donato — Daniele Briones      (estranged father and daughter)
//   Dustin Erikstrup — Joe Barber      (ex-boyfriends)
//   Jessica Hughbanks — Carol Journey  (ex-best friends)
//
// The load-bearing rule, and the one worth asserting hardest: THE RIVALS DO NOT
// WIN THE FIRST COMPETITION, THEY DECIDE IT. The comp runs without them, comes
// down to two, and three people who have been in the building for an hour hand
// the crown to one of them. It is the only time power in this house is given
// rather than won.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setRelationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { installRivals, rivalsState, isRival, rivalPartner, openRivals, announceRivals,
  rivalsSittingOut, rivalsImmune, rivalsChooseHoh, rivalWeekEvents,
  rivalEvicted, rivalsLedger } from '../js/bb/rivals.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = n => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((n * 7 + i * 3) % 10)]));
const NAMES = ['Julia', 'Bowie', 'Wayne', 'Raj', 'Eli', 'Fern',
  'Gus', 'Hicks', 'Iris', 'Jae', 'Kit', 'Lex'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater', gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1) }));

// Exactly the BB8 shape: an estrangement, an ex, and a friendship that ended.
const DECLARED = [
  { id: 'r1', a: 'Julia', b: 'Bowie', type: 'nemesis', bond: -6, kin: 'estranged' },
  { id: 'r2', a: 'Wayne', b: 'Raj', type: 'nemesis', bond: -5, kin: 'exes' },
  { id: 'r3', a: 'Eli', b: 'Fern', type: 'rival', bond: -4, kin: 'ex-friends' },
];

function house(config = {}, declared = DECLARED) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'disabled', ...config });
  seasonConfig.twistSchedule = [];
  gs.bb = { weeks: [], stats: {} };
  setRelationships(declared.map(r => ({ ...r })));
  globalThis.relationships = relationships;
  gs.activePlayers = [...NAMES];
}

const aWeek = (over = {}) => ({ num: 1, houseAtStart: [...NAMES], acts: [], ...over });

beforeEach(() => house());

describe('who walks in', () => {
  it('casts from the fallings-out the season declared', () => {
    const st = installRivals(NAMES, { rng: Math.random, count: 3 });
    expect(st).toBeTruthy();
    expect(st.pairs.length).toBe(3);
    for (const p of st.pairs) {
      expect(p.declared, `${p.rival}/${p.partner} was not a declared pair`).toBe(true);
      expect(['estranged', 'exes', 'ex-friends']).toContain(p.kin);
      // The two halves are not the same job: one walked in late.
      expect(p.rival).not.toBe(p.partner);
      expect(isRival(p.rival)).toBe(true);
      expect(isRival(p.partner)).toBe(false);
      expect(rivalPartner(p.rival)).toBe(p.partner);
      expect(rivalPartner(p.partner)).toBe(p.rival);
      // And the relationship is stated in words the house would use.
      expect(p.grudge.length).toBeGreaterThan(20);
      expect(p.grudge).toContain(p.rival);
    }
    // Nobody is in two pairs.
    const all = st.pairs.flatMap(p => [p.rival, p.partner]);
    expect(new Set(all).size).toBe(all.length);
  });

  it('makes the grudge real from the first hour', () => {
    const before = getBond('Julia', 'Bowie');
    installRivals(NAMES, { rng: Math.random });
    expect(getBond('Julia', 'Bowie')).toBeLessThan(before);
  });

  it('honours how many pairs the season asked for', () => {
    const st = installRivals(NAMES, { rng: Math.random, count: 1 });
    expect(st.pairs.length).toBe(1);
  });

  it('will guess when told to, and says that it guessed', () => {
    house({}, []);
    const st = installRivals(NAMES, { rng: Math.random, count: 2, allowGuess: true });
    expect(st).toBeTruthy();
    expect(st.pairs.length).toBe(2);
    expect(st.pairs.every(p => !p.declared)).toBe(true);
  });

  it('will not invent a cast when told not to', () => {
    house({}, []);
    expect(installRivals(NAMES, { rng: Math.random, count: 3, allowGuess: false })).toBeNull();
  });
});

describe('the week they arrive', () => {
  it('tells the house, because the eleven were informed', () => {
    // The difference between this and the Twin Twist: it is public. The drama
    // is not the secret — it is that the room now spends three days working
    // out which of them it is about while three people already know.
    const contract = BB_TWIST_CONTRACTS['bb-rivals'];
    expect(contract.layer).toBe('season');
    expect(contract.acquisition.secrecy).toBe('public');
    expect(contract.announcement).toBeTruthy();
    expect(contract.announcement.rule).toMatch(/cannot play|cannot be nominated|nominate them/i);
    expect(contract.announcement.rule).toMatch(/decide|choose/i);
  });

  it('counts the arrivals instead of asserting three of them', () => {
    // The contract carries the original three-pair wording. A season set to one
    // pair was being read a rule saying three more people were coming through
    // the door, that the three of them would decide the competition, and that
    // three of the room were about to find out — and then one person walked in.
    for (const count of [1, 2, 3]) {
      house();
      installRivals(NAMES, { rng: Math.random, count });
      const week = aWeek({ twistState: { announcements: [] } });
      expect(announceRivals(week)).toBe(true);
      const said = week.twistState.announcements.find(a => a.twist === 'bb-rivals');
      const text = `${said.rule} ${said.sting}`;
      const word = ['', 'One', 'Two', 'Three'][count];
      expect(text, `${count} pair(s) announced wrong`).toContain(`${word} more of you`);
      expect(text).toContain(`${word} of you`);
      // And the house it names is the house that is actually standing there.
      expect(said.rule).toContain(`You are not ${
        ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
          'eleven', 'twelve'][NAMES.length - count]}`);
      // Nothing left over from the three-pair version.
      if (count !== 3) expect(text).not.toMatch(/\bthree\b/i);
      expect(text).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  it('counts the arrivals in the handover too', () => {
    const comp = { placements: ['Gus', 'Hicks', 'Iris'], winner: 'Gus' };
    for (const count of [1, 2, 3]) {
      for (let i = 0; i < 10; i++) {
        house();
        installRivals(NAMES, { rng: Math.random, count });
        const act = rivalsChooseHoh(aWeek(), comp, { rng: Math.random });
        const text = (act.beats || []).map(b => b.text).join(' ');
        expect(text).not.toMatch(/undefined|NaN|\[object/);
        if (count !== 3) {
          expect(text, `${count} rival(s) still described as three`).not.toMatch(/\bthree\b/i);
        }
        if (count === 1) {
          // Nobody disagrees with themselves.
          expect(text).not.toMatch(/the last one|one of them/i);
          expect(act.beats.some(b => b.badgeText === 'THE RIVAL DECIDES')).toBe(true);
        }
      }
    }
  });

  it('keeps them out of the first competition and off the block', () => {
    const st = installRivals(NAMES, { rng: Math.random });
    const out = rivalsSittingOut(aWeek());
    expect(out.sort()).toEqual(st.pairs.map(p => p.rival).sort());
    expect(rivalsImmune(aWeek()).sort()).toEqual(out.sort());
    // Both halves of that rule are only true in the week they arrive.
    expect(rivalsSittingOut(aWeek({ num: 2 }))).toEqual([]);
    expect(rivalsImmune(aWeek({ num: 2 }))).toEqual([]);
  });

  it('walks them in once', () => {
    installRivals(NAMES, { rng: Math.random });
    const open = openRivals(aWeek(), { rng: Math.random });
    expect(open).toBeTruthy();
    expect(open.type).toBe('rivals-open');
    expect(open.pairs.length).toBe(3);
    expect(open.beats.length).toBeGreaterThan(3);
    for (const b of open.beats) expect(b.text).not.toMatch(/undefined|NaN|\[object/);
    expect(openRivals(aWeek({ num: 2 }), { rng: Math.random })).toBeNull();
  });
});

describe('the handover', () => {
  const comp = (placements = ['Gus', 'Hicks', 'Iris', 'Jae']) => ({ placements, winner: placements[0] });

  it('hands the house to one of the last two, and never to a rival', () => {
    const st = installRivals(NAMES, { rng: Math.random });
    const act = rivalsChooseHoh(aWeek(), comp(), { rng: Math.random });
    expect(act).toBeTruthy();
    expect(act.type).toBe('rivals-hoh');
    expect(act.finalists.length).toBe(2);
    expect(act.finalists).toContain(act.winner);
    expect(act.finalists).toContain(act.loser);
    for (const n of act.finalists) expect(isRival(n)).toBe(false);
    // One ballot each, and they are on the record.
    expect(act.ballots.length).toBe(st.pairs.length);
    for (const b of act.ballots) expect(act.finalists).toContain(b.choice);
  });

  it('leaves the rivals out of the two it chooses between', () => {
    const st = installRivals(NAMES, { rng: Math.random });
    const rivals = st.pairs.map(p => p.rival);
    // A competition the rivals somehow topped is still not one they can win.
    const act = rivalsChooseHoh(aWeek(), comp([...rivals, 'Gus', 'Hicks']), { rng: Math.random });
    expect(act.finalists).toEqual(['Gus', 'Hicks']);
  });

  it('will not hand the house to somebody\'s own rival', () => {
    // The one thing a rival is certain about after an hour in the building.
    let refused = 0, chances = 0;
    for (let i = 0; i < 30; i++) {
      house();
      const st = installRivals(NAMES, { rng: Math.random });
      const partner = st.pairs[0].partner;
      const other = NAMES.find(n => !st.pairs.some(p => p.rival === n || p.partner === n));
      const act = rivalsChooseHoh(aWeek(), comp([partner, other]), { rng: Math.random });
      if (!act) continue;
      chances++;
      const theirs = act.ballots.find(b => b.rival === st.pairs[0].rival);
      if (theirs && theirs.choice !== partner) refused++;
    }
    expect(chances).toBeGreaterThan(10);
    expect(refused, 'a rival voted to hand the house to the person they came in hating')
      .toBe(chances);
  });

  it('happens once, in the opening week only', () => {
    installRivals(NAMES, { rng: Math.random });
    expect(rivalsChooseHoh(aWeek(), comp(), { rng: Math.random })).toBeTruthy();
    expect(rivalsChooseHoh(aWeek(), comp(), { rng: Math.random })).toBeNull();
    house();
    installRivals(NAMES, { rng: Math.random });
    expect(rivalsChooseHoh(aWeek({ num: 2 }), comp(), { rng: Math.random })).toBeNull();
  });

  it('leaves a debt on the person who took it', () => {
    const st = installRivals(NAMES, { rng: Math.random });
    const before = st.pairs.map(p => getBond('Gus', p.rival));
    const act = rivalsChooseHoh(aWeek(), comp(['Gus', 'Hicks']), { rng: Math.random });
    if (act.winner !== 'Gus') return;
    st.pairs.forEach((p, i) => expect(getBond('Gus', p.rival)).toBeGreaterThan(before[i]));
  });
});

describe('living with them', () => {
  it('fires between pairs who are both still in it, and never repeats a line', () => {
    installRivals(NAMES, { rng: Math.random });
    // Per pair: how many beats they got, and how many different lines.
    const said = {};
    let weeks = 0;
    for (let w = 2; w < 14; w++) {
      const act = rivalWeekEvents(aWeek({ num: w }), { rng: Math.random });
      if (!act) continue;
      weeks++;
      for (const b of act.beats) {
        expect(b.text).not.toMatch(/undefined|NaN|\[object/);
        // Every line names the people in it, so two pairs arguing in the same
        // week never print the identical sentence twice.
        expect(b.players.filter(n => b.text.includes(n)).length,
          `a beat that names nobody: ${b.text.slice(0, 60)}`).toBeGreaterThan(0);
        const key = b.players.slice(0, 2).sort().join('|');
        (said[key] ||= []).push(b.text);
      }
    }
    expect(weeks, 'the grudges never came up once').toBeGreaterThan(2);
    // The pools cycle rather than repeat: a pair with several beats has to have
    // worked through the variants before reusing any of them. Sticking on one
    // line is the failure this guards.
    for (const [pair, lines] of Object.entries(said)) {
      const distinct = new Set(lines).size;
      expect(distinct, `${pair} kept saying the same thing (${lines.length} beats, ${distinct} lines)`)
        .toBeGreaterThanOrEqual(Math.min(lines.length, 3));
    }
  });

  it('moves a real bond every time', () => {
    installRivals(NAMES, { rng: Math.random });
    let moved = 0;
    for (let w = 2; w < 14; w++) {
      const before = getBond('Julia', 'Bowie');
      const act = rivalWeekEvents(aWeek({ num: w }), { rng: Math.random });
      if (!act?.beats.some(b => b.players.includes('Julia'))) continue;
      if (Math.abs(getBond('Julia', 'Bowie') - before) > 0.01) moved++;
    }
    expect(moved, 'the grudge events were decoration').toBeGreaterThan(0);
  });

  it('goes quiet once one of a pair is gone', () => {
    installRivals(NAMES, { rng: Math.random });
    const shrunk = aWeek({ num: 3, houseAtStart: NAMES.filter(n => n !== 'Bowie') });
    for (let i = 0; i < 12; i++) {
      const act = rivalWeekEvents(shrunk, { rng: Math.random });
      for (const b of act?.beats || []) expect(b.players).not.toContain('Bowie');
    }
  });
});

describe('one of them outlasts the other', () => {
  it('records who was left standing', () => {
    const st = installRivals(NAMES, { rng: Math.random });
    const p = st.pairs[0];
    const act = rivalEvicted(p.partner, aWeek({ num: 4 }));
    expect(act).toBeTruthy();
    expect(act.type).toBe('rivals-out');
    expect(act.gone).toBe(p.partner);
    expect(act.stays).toBe(p.rival);
    expect(act.rivalOutlasted).toBe(true);
    expect(act.remaining).toBe(2);
    // Once each, and nobody outside a pair triggers it.
    expect(rivalEvicted(p.rival, aWeek({ num: 5 }))).toBeNull();
    expect(rivalEvicted('Gus', aWeek({ num: 5 }))).toBeNull();
  });

  it('says nothing when both of them go the same night', () => {
    // A double eviction is not a story about a grudge.
    const st = installRivals(NAMES, { rng: Math.random });
    const p = st.pairs[0];
    const gone = aWeek({ num: 4, houseAtStart: NAMES.filter(n => n !== p.rival) });
    expect(rivalEvicted(p.partner, gone)).toBeNull();
  });

  it('keeps a ledger the finale can read', () => {
    const st = installRivals(NAMES, { rng: Math.random });
    for (const p of st.pairs) rivalEvicted(p.partner, aWeek({ num: 4 }));
    const led = rivalsLedger();
    expect(led.outcomes.length).toBe(3);
    // The wiki's own trivia line, as a measurable.
    expect(led.cleanSweep).toBe(true);
  });
});

describe('a season with one running', () => {
  it('plays, and reaches the screen and the page', () => {
    house({ bbRivals: 'declared', bbRivalsCount: 3 });
    let sawOpen = false, sawHoh = false, sawWeek = false;
    for (let w = 0; w < 6; w++) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      const acts = (ep.acts || []).filter(a => /^rivals-/.test(a.type));
      if (!acts.length) continue;
      const text = generateSummaryText(ep) || '';
      gs.episodeHistory = [ep];
      buildVPScreens(ep);
      Object.keys(_tvState).forEach(k => { if (_tvState[k]) _tvState[k].idx = 99; });
      const screens = (buildVPScreens(ep) || []).filter(s => /bb-rivals/.test(s.id));
      expect(screens.length, 'a rivals act with no screen').toBeGreaterThanOrEqual(acts.length);
      for (const s of screens) {
        expect(s.html.length).toBeGreaterThan(600);
        expect(s.html).not.toMatch(/undefined|NaN|\[object Object\]/);
        // One family down the tab strip, like the other two season twists.
        expect(s.label).toMatch(/^Rivals: /);
      }
      for (const a of acts) {
        if (a.type === 'rivals-open') sawOpen = true;
        if (a.type === 'rivals-hoh') sawHoh = true;
        if (a.type === 'rivals-week') sawWeek = true;
        for (const b of a.beats || []) {
          expect(text, 'a rivals beat the transcript never wrote down')
            .toContain(b.text.replace(/<[^>]*>/g, '').slice(0, 40));
        }
      }
    }
    expect(sawOpen, 'nobody ever arrived').toBe(true);
    expect(sawHoh, 'the rivals never chose a Head of Household').toBe(true);
    expect(sawWeek, 'the grudges never came up').toBe(true);
  }, 90000);

  it('is told about before anybody walks through the door', () => {
    // Three people arriving BEFORE the room is told anybody is coming is the
    // season's first screen out of order.
    house({ bbRivals: 'declared', bbRivalsCount: 3 });
    const ep = simulateBBEpisode();
    const types = (ep.acts || []).map(a => a.type);
    const told = types.indexOf('twist-announcement');
    const arrive = types.indexOf('rivals-open');
    expect(told).toBeGreaterThan(-1);
    expect(arrive).toBeGreaterThan(told);
    // And the handover comes after both, because it happens at the comp.
    expect(types.indexOf('rivals-hoh')).toBeGreaterThan(arrive);
  }, 60000);

  it('actually decides the first Head of Household', () => {
    // Not narration: the person the rivals chose is the person holding the key.
    for (let i = 0; i < 6; i++) {
      house({ bbRivals: 'declared', bbRivalsCount: 3 });
      const ep = simulateBBEpisode();
      const act = (ep.acts || []).find(a => a.type === 'rivals-hoh');
      if (!act) continue;
      const hoh = (ep.acts || []).find(a => a.type === 'hoh');
      expect(hoh.winner).toBe(act.winner);
      // And no rival played for it.
      for (const r of act.rivals) {
        expect((hoh.results || []).map(x => x.name)).not.toContain(r);
      }
    }
  }, 90000);

  it('does nothing at all when the season did not ask for one', () => {
    house({ bbRivals: 'off' });
    const ep = simulateBBEpisode();
    expect(rivalsState()).toBeFalsy();
    expect((ep.acts || []).some(a => /^rivals-/.test(a.type))).toBe(false);
  });
});
