// The Den of Temptation — the `temptation` acquisition channel.
//
// BB19's season slogan was "every temptation has a consequence", and the rule
// everybody misremembers (I did, until the wiki said otherwise) is WHO PAYS.
// Not the person who accepted. Paul Abrahamian took the Pendant of Protection
// in week one; Ramses Soto was cursed for it and forced to nominate himself.
// The taker walks away clean, hidden, and unpunished.
//
// So the assertions that matter here are the asymmetry ones: the taker is
// never the cursed, the taker really does receive a real power, and the house
// really is hunting somebody it cannot identify. Everything else is dressing.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { heldPowers, BB_POWER_DEFINITIONS } from '../js/bb/powers.js';
import { BB_TWIST_CONTRACTS, POWER_ACQUISITION_CHANNELS } from '../js/bb/twist-contract.js';
import { runDenOfTemptation, resolveCurse, TEMPTATION_CURSES } from '../js/bb/temptation.js';
import { rpBuildBBTemptation, rpBuildBBNominations, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists.map(type => ({ episode: 1, type }));
}

const den = (seed, offered = 'the-cloud') => withSeededRandom(seed, () =>
  runDenOfTemptation({ week: { num: 1 }, house: [...gs.activePlayers], rng: Math.random, offered }));

describe('the channel', () => {
  beforeEach(() => house());

  it('opens `temptation`, which was declared and unused', () => {
    expect(POWER_ACQUISITION_CHANNELS).toContain('temptation');
    const c = BB_TWIST_CONTRACTS['bb-den-of-temptation'];
    expect(c, 'no contract registered').toBeTruthy();
    expect(c.acquisition.channel).toBe('temptation');
    // Nobody may learn who took it — that is the entire twist.
    expect(c.acquisition.secrecy).toBe('secret');
  });

  // It used to refuse four cards and a mode, because the curse APPENDED a
  // nominee and so the block came out one bigger than whatever else was
  // shaping it. It takes a seat now instead — the Head of Household names one
  // fewer — so the block is the size it always was and there is nothing left
  // to collide with. Played beside each of them across five seeds: no crashes,
  // and the block never came out the wrong size.
  it('is in the catalog and can now run beside everything that shapes the block', () => {
    const entry = TWIST_CATALOG.find(t => t.id === 'bb-den-of-temptation');
    expect(entry, 'no catalog entry').toBeTruthy();
    expect(entry.format).toBe('big-brother');
    for (const other of ['bb-roadkill', 'bb-battle-of-the-block', 'bb-split-house', 'bb-hacker']) {
      expect(entry.incompatible || [], `${other} still refuses it`).not.toContain(other);
      // and symmetric — the resolver checks both directions, so a leftover on
      // the other card would block it just as hard.
      const partner = TWIST_CATALOG.find(t => t.id === other);
      expect(partner.incompatible || [], `${other} still names the Den`)
        .not.toContain('bb-den-of-temptation');
    }
    expect(entry.incompatibleModes || [], 'the Block Buster still refuses it')
      .not.toContain('block-buster');
  });
});

describe('the decision', () => {
  beforeEach(() => house());

  it('goes both ways across a season of offers', () => {
    let took = 0, refused = 0;
    for (let seed = 1; seed <= 50; seed++) {
      house();
      const act = den(seed);
      if (!act) continue;
      if (act.accepted) took++; else refused++;
    }
    expect(took, 'nobody ever accepts — the power is unreachable').toBeGreaterThan(6);
    expect(refused, 'everybody accepts, so it is a gift and not a decision').toBeGreaterThan(6);
  });

  it('refusing costs nobody anything', () => {
    let act = null;
    for (let seed = 1; seed <= 60 && !(act && !act.accepted); seed++) {
      house();
      act = den(seed);
    }
    expect(act.accepted).toBe(false);
    expect(act.cursed, 'a refusal cursed somebody').toBeNull();
    expect(act.curse).toBeNull();
    expect(gs.bb?.powers || [], 'a refusal still handed out a power').toHaveLength(0);
  });
});

describe('who pays', () => {
  beforeEach(() => house());

  it('never lands the curse on the person who accepted', () => {
    // The single most important rule in the slice, and the one I had backwards
    // from memory. The victim is drawn at the ceremony now, so this exercises
    // resolveCurse over a house rather than the Den's own return value.
    let checked = 0;
    for (let seed = 1; seed <= 80; seed++) {
      house();
      const act = den(seed);
      if (!act?.accepted) continue;
      checked++;
      const week = { num: 1, temptation: act };
      const curseAct = withSeededRandom(seed, () =>
        resolveCurse({ week, house: [...gs.activePlayers], rng: Math.random }));
      expect(curseAct.cursed, `seed ${seed}: the taker cursed themselves`).not.toBe(act.entrant);
      expect(curseAct.cursed).toBeTruthy();
    }
    expect(checked, 'no accepted offers to check').toBeGreaterThan(5);
  });

  it('never draws somebody who cannot take the chair', () => {
    // THE BUG. The victim used to be drawn at week opening over the whole
    // house — including the Head of Household and anyone about to be safe —
    // so a curse that landed on one of them was announced to the viewer and
    // then never seated. The houseguest was simply absent from the ceremony.
    for (let seed = 1; seed <= 60; seed++) {
      house();
      const act = den(seed);
      if (!act?.accepted) continue;
      const room = [...gs.activePlayers];
      // Everybody safe except three: the draw has to find one of those three.
      const protectedNames = room.slice(0, room.length - 3).filter(n => n !== act.entrant);
      const week = { num: 1, temptation: act };
      const curseAct = withSeededRandom(seed, () =>
        resolveCurse({ week, house: room, rng: Math.random, protectedNames }));
      if (!curseAct?.cursed) continue;
      expect(protectedNames, `seed ${seed}: cursed a protected houseguest`)
        .not.toContain(curseAct.cursed);
      expect(curseAct.cursed).not.toBe(act.entrant);
    }
  });

  it('says so out loud when the curse can find nobody at all', () => {
    // The house was promised a curse. If every eligible houseguest is safe it
    // has to be told the curse missed — silence is what produced the bug.
    house();
    let act = null;
    for (let seed = 1; seed <= 60 && !act?.accepted; seed++) { house(); act = den(seed); }
    const room = [...gs.activePlayers];
    const week = { num: 1, temptation: act };
    const curseAct = resolveCurse({
      week, house: room, rng: () => 0.5,
      protectedNames: room.filter(n => n !== act.entrant),
    });
    expect(curseAct, 'the curse vanished silently').toBeTruthy();
    expect(curseAct.missed).toBe(true);
    expect(curseAct.cursed).toBeNull();
    expect(curseAct.beats.length).toBeGreaterThan(0);
  });

  it('hands the taker a real power, in secret', () => {
    let act = null;
    for (let seed = 1; seed <= 60 && !act?.accepted; seed++) {
      house();
      act = den(seed, 'the-cloud');
    }
    expect(act.accepted).toBe(true);
    expect(act.offered).toBe('the-cloud');
    const held = heldPowers(act.entrant, 'the-cloud');
    expect(held, 'the taker got nothing for their trouble').toHaveLength(1);
    expect(held[0].visibility, 'the house can see who took it').toBe('secret');
    expect(held[0].source).toBe('bb-den-of-temptation');
  });

  it('can offer anything on the shelf', () => {
    for (const id of Object.keys(BB_POWER_DEFINITIONS)) {
      let act = null;
      for (let seed = 1; seed <= 40 && !act?.accepted; seed++) {
        house();
        act = den(seed, id);
      }
      expect(act?.offered, `${id} could not be offered`).toBe(id);
    }
  });

  it('sets the house hunting somebody it cannot identify, and lets it be wrong', () => {
    let anyWrong = false, anyRight = false;
    for (let seed = 1; seed <= 60; seed++) {
      house();
      const act = den(seed);
      if (!act?.accepted) continue;
      expect(act.guesses.length, 'nobody suspected anything').toBeGreaterThan(0);
      for (const g of act.guesses) {
        expect(g.correct).toBe(g.guess === act.entrant);
        if (g.correct) anyRight = true; else anyWrong = true;
      }
    }
    expect(anyWrong, 'the house is never wrong, so there is no hunt').toBe(true);
    expect(anyRight, 'the house is never right, so intuition means nothing').toBe(true);
  });

  it('damages the bond with the name they PICKED, not the guilty one', () => {
    let act = null;
    for (let seed = 1; seed <= 80; seed++) {
      house();
      const a = den(seed);
      const wrong = a?.guesses?.find(g => !g.correct);
      if (a?.accepted && wrong) { act = a; break; }
    }
    const wrong = act.guesses.find(g => !g.correct);
    expect(getBond(wrong.who, wrong.guess),
      'an innocent houseguest took no heat for the accusation').toBeLessThan(0);
  });

  it('has a curse with real teeth, not flavour', () => {
    // A consequence that changes no gameplay state is decoration. This one
    // puts somebody on the block who was not nominated by anybody.
    expect(TEMPTATION_CURSES['third-chair'].rule).toMatch(/nominate/i);
    expect(BB_TWIST_CONTRACTS['bb-den-of-temptation'].rules.nomineeCount).toBe(3);
  });
});

describe('in a played week', () => {
  it('seats the cursed houseguest in a chair the HOH would have filled', () => {
    // Play until an offer is accepted and the curse can actually seat.
    let ep = null;
    for (let seed = 1; seed <= 40; seed++) {
      house(['bb-den-of-temptation']);
      const played = withSeededRandom(seed, () => simulateBBEpisode());
      const act = (played.acts || []).find(a => a.type === 'temptation');
      if (act?.accepted && played.acts.some(a => a.type === 'temptation-curse')) { ep = played; break; }
    }
    expect(ep, 'no week in 40 seeds seated the curse').toBeTruthy();
    const act = ep.acts.find(a => a.type === 'temptation');
    const week = gs.bb.weeks[gs.bb.weeks.length - 1];
    expect(week.initialNominees, 'the cursed is not on the block').toContain(act.cursed);
    // THE CURSE TAKES A SEAT, IT DOES NOT ADD ONE. The block is exactly the
    // size the week would have had anyway — two ordinarily, three under the
    // Block Buster — which is what lets the Den run beside every other twist
    // that shapes the block. What it costs is a NOMINATION: the Head of
    // Household names one fewer, and the last chair is somebody nobody chose.
    const expected = week.safetyMode || week.doubleVote ? 3 : 2;
    expect(week.initialNominees.length, 'the curse changed the size of the block').toBe(expected);
    const hohOwn = week.initialNominees.filter(n => n !== act.cursed);
    expect(hohOwn.length, 'the HOH should have named one fewer').toBe(expected - 1);
    // Nobody chose the name, so it cannot be the Head of Household's.
    expect(act.cursed).not.toBe(week.hoh);
  });

  it('does not let the HOH claim a chair they did not fill', () => {
    // The ceremony script says "it is my responsibility to nominate N people"
    // and turns N keys. With the curse seating a third chair that counted
    // three, so the Head of Household was reading out a nomination they never
    // made — and the whole point of the curse is that nobody chose it.
    let ep = null;
    for (let seed = 1; seed <= 40; seed++) {
      house(['bb-den-of-temptation']);
      const played = withSeededRandom(seed, () => simulateBBEpisode());
      if ((played.acts || []).some(a => a.type === 'temptation-curse')) { ep = played; break; }
    }
    expect(ep, 'no week in 40 seeds seated the curse').toBeTruthy();
    const noms = ep.acts.find(a => a.type === 'nominations');
    const cursed = ep.acts.find(a => a.type === 'temptation-curse').cursed;

    expect(noms.nominees, 'the cursed houseguest is not on the block').toContain(cursed);
    expect(noms.curseChair).toBe(cursed);
    expect(noms.hohNominees, 'the HOH is still being credited with the curse chair')
      .not.toContain(cursed);
    expect(noms.hohNominees).toHaveLength(noms.nominees.length - 1);

    const text = summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1]);
    expect(text).toMatch(new RegExp(`${cursed} nominated THEMSELVES`));

    // ...and the ceremony screen must not have the HOH turning that key.
    rpBuildBBNominations(ep, noms);
    const key = Object.keys(_tvState).find(k => k.startsWith('bb_noms_') || k.includes('noms'));
    if (key) _tvState[key].idx = 99;
    const html = rpBuildBBNominations(ep, noms);
    expect(html).toMatch(/A KEY NOBODY OWNS/);
    expect(html, 'the HOH is still claiming the whole block')
      .not.toMatch(new RegExp(`${ep.hoh} turns the third key`));
  });

  it('leaves an ordinary two-nominee ceremony exactly as it was', () => {
    // The fix must be invisible on a normal week: no curse, no third chair,
    // and the HOH still nominates two people and turns two keys.
    house();
    const ep = withSeededRandom(9, () => simulateBBEpisode());
    const noms = ep.acts.find(a => a.type === 'nominations');
    expect(noms.nominees).toHaveLength(2);
    expect(noms.curseChair).toBeNull();
    expect(noms.roadkillChair).toBeNull();
    // Both chairs are the HOH's, so the script counts two and says two.
    expect(noms.hohNominees).toEqual(noms.nominees);
    const text = summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1]);
    expect(text).not.toMatch(/nominated THEMSELVES/);
    expect(text).not.toMatch(/Roadkill winner, not the Head/);
  });

  it('an accepted temptation never silently produces nothing', () => {
    // The user-facing invariant, over played weeks rather than units: if the
    // Den announced a curse, the ceremony either seats somebody or says out
    // loud that it could not. The reported bug was the third possibility —
    // a cursed name announced and then absent from the ceremony entirely.
    let accepted = 0, seated = 0, missed = 0;
    for (let seed = 1; seed <= 30; seed++) {
      house(['bb-den-of-temptation']);
      const ep = withSeededRandom(seed * 7, () => simulateBBEpisode());
      const den = (ep.acts || []).find(a => a.type === 'temptation');
      if (!den?.accepted) continue;
      accepted++;
      const curseAct = (ep.acts || []).find(a => a.type === 'temptation-curse');
      expect(curseAct, `seed ${seed}: a curse was announced and never resolved`).toBeTruthy();
      if (curseAct.missed) { missed++; continue; }
      seated++;
      const noms = (ep.acts || []).find(a => a.type === 'nominations');
      expect(noms.nominees, `seed ${seed}: ${curseAct.cursed} was cursed but is not on the block`)
        .toContain(curseAct.cursed);
      // And never somebody who could not have taken the chair.
      expect(curseAct.cursed, 'the curse seated the Head of Household').not.toBe(ep.hoh);
    }
    expect(accepted, 'no accepted offers across 30 played weeks').toBeGreaterThan(3);
    expect(seated, 'the curse never once seated anybody').toBeGreaterThan(0);
  });

  it('reaches both the transcript and the visual player', () => {
    let ep = null;
    for (let seed = 1; seed <= 40; seed++) {
      house(['bb-den-of-temptation']);
      const played = withSeededRandom(seed, () => simulateBBEpisode());
      if ((played.acts || []).some(a => a.type === 'temptation')) { ep = played; break; }
    }
    expect(ep).toBeTruthy();
    const text = summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1]);
    expect(text).toMatch(/DEN OF TEMPTATION/);

    const act = ep.acts.find(a => a.type === 'temptation');
    rpBuildBBTemptation(ep, act);
    const key = Object.keys(_tvState).find(k => k.startsWith('bb_dt_'));
    expect(key, 'the screen never registered a reveal key').toBeTruthy();
    _tvState[key].idx = 99;
    const html = rpBuildBBTemptation(ep, act);
    expect(html).toMatch(/THE DEN OF TEMPTATION/);
    expect(html).not.toMatch(/is-hidden/);
    for (const b of act.beats) {
      expect(html, `a beat never reached the screen: ${b.badgeText}`).toContain(b.text.slice(0, 40));
    }
  });
});

describe('where they stand, not just who they are', () => {
  // The read was personality only — boldness, strategic, loyalty, archetype —
  // so a houseguest who could feel the week closing on them and one nobody had
  // thought about all season evaluated that envelope identically. A temptation
  // is worth most to whoever needs it most, and that was nowhere in it.
  const RUNS = 120;

  function acceptRate(prep) {
    let took = 0, total = 0;
    for (let seed = 1; seed <= RUNS; seed++) {
      house();
      gs.intentions = {};
      prep();
      const act = withSeededRandom(seed, () => runDenOfTemptation({
        week: { num: 1, hoh: gs.activePlayers[0] }, house: [...gs.activePlayers],
        rng: Math.random, offered: 'the-cloud',
      }));
      if (!act) continue;
      total++;
      if (act.accepted) took++;
    }
    return total ? took / total : 0;
  }

  it('takes it far more often when there is nobody left to hide behind', () => {
    const comfortable = acceptRate(() => {
      const hs = gs.activePlayers;
      for (const a of hs) for (const b of hs) if (a < b) addBond(a, b, 7);
    });
    const isolated = acceptRate(() => {
      const hs = gs.activePlayers;
      for (const a of hs) for (const b of hs) if (a < b) addBond(a, b, -6);
    });
    expect(isolated, `isolated ${isolated.toFixed(2)} vs comfortable ${comfortable.toFixed(2)}`)
      .toBeGreaterThan(comfortable + 0.15);
  });

  it('takes it more often when the house is aiming at them', () => {
    const quiet = acceptRate(() => {});
    const hunted = acceptRate(() => {
      const hs = gs.activePlayers;
      for (const n of hs) gs.intentions[n] = { targets: [hs[(hs.indexOf(n) + 1) % hs.length]] };
    });
    expect(hunted, `hunted ${hunted.toFixed(2)} vs quiet ${quiet.toFixed(2)}`)
      .toBeGreaterThan(quiet);
  });

  it('is not so reluctant that refusing becomes the norm', () => {
    // The reported symptom: everybody refused. On the show almost every
    // temptation offered was taken — refusing is the exception worth writing a
    // scene about. Tuned against the REAL roster, which averages loyalty 6.07
    // rather than the flat 5 the first version assumed.
    const base = acceptRate(() => {});
    expect(base, `an ordinary week accepts only ${(base * 100).toFixed(0)}% of the time`)
      .toBeGreaterThan(0.33);
  });
});
