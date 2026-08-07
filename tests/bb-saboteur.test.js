// The Saboteur — the first season-long twist.
//
// Every other twist is scheduled onto a week and asserted week by week. This
// one is installed on night one and asserted across a season, because the only
// things worth checking about it are longitudinal: does it pay out, can it be
// caught, and — the reason it was built — does the house convict the wrong
// person often enough to be worth watching, without being so blind that the
// saboteur is never at risk at all.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { installBBSaboteur, offerSaboteurMission, resolveSaboteurMission, checkSaboteurBank,
  saboteurEvicted, saboteurState, isSaboteur, audiencePayout,
  runSaboteurAccusation } from '../js/bb/saboteur.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const ARCH = ['mastermind', 'social-butterfly', 'challenge-beast', 'schemer', 'hero', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'perceptive-player'];
const CAST = NAMES.map((name, i) => ({ name, archetype: ARCH[i], gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1) }));

function house(config = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'disabled', ...config });
  seasonConfig.twistSchedule = [];
  gs.bb = { weeks: [], stats: {} };
}

/** Brief and debrief in one call, the way a week runs them. */
function playWeek(over = {}, rng = Math.random) {
  const week = aWeek(over);
  const brief = offerSaboteurMission(week, { rng });
  const debrief = resolveSaboteurMission(week, { rng });
  return { week, brief, debrief };
}

const aWeek = (over = {}) => ({
  num: 2, houseAtStart: [...NAMES], hoh: 'A', finalNominees: ['B', 'C'],
  vetoWinner: 'E', vetoPlayers: ['A', 'B', 'C', 'D', 'E', 'F'], ...over,
});

beforeEach(() => house());

describe('the twist itself', () => {
  it('is declared as a season twist, because there is no week to schedule it on', () => {
    const contract = BB_TWIST_CONTRACTS['bb-saboteur'];
    expect(contract).toBeTruthy();
    expect(contract.layer).toBe('season');
    // Everything else in the registry is per-week. If this ever becomes
    // 'scheduled' the engine will try to fire it on one episode and the second
    // game stops being a season long.
    expect(contract.duration.weeks).toBeNull();
    // The house is told the twist EXISTS and never who holds it.
    expect(contract.acquisition.secrecy).toBe('holder-secret');
  });

  it('tells the house on night one that it exists, and never who', () => {
    // From the wiki's press release: "Upon moving into the house on premiere
    // night, Houseguests will discover that one of them is not really there to
    // win the game." The house knowing the twist EXISTS is what gives the
    // paranoia somewhere to go — without it a sabotaged house just thinks it is
    // having bad luck, and nobody is ever suspected of anything.
    //
    // The announcement was written into the contract when this shipped and
    // nothing read it: `resolveWeekTwistState` builds its list from the WEEK's
    // twists, and a season twist is never one of those.
    house({ bbSaboteur: 'random', bbSaboteurBankWeek: 6 });
    const ep = withSeededRandom(140, () => simulateBBEpisode());
    const ann = (ep.acts || []).find(a => a.type === 'twist-announcement');
    expect(ann, 'the house was never told a saboteur exists').toBeTruthy();
    expect((ann.announced || []).map(a => a.name)).toContain('The Saboteur');
    // And it is announced once, not every week.
    const two = withSeededRandom(151, () => simulateBBEpisode());
    expect((two.acts || []).some(a => a.type === 'twist-announcement'
      && (a.announced || []).some(x => x.name === 'The Saboteur'))).toBe(false);
    // The name is never in it.
    expect(JSON.stringify(ann)).not.toContain(saboteurState().player + ' is the');

    // It states BOTH halves of the rule. The house was being told a saboteur
    // existed and never that it was allowed to catch one — and then somebody
    // would stand up weeks later and formally name a suspect under a rule
    // nobody in that room had ever been given.
    const said = (ann.announced || []).find(a => a.name === 'The Saboteur');
    expect(said.rule).toMatch(/name them out loud/i);
    expect(said.rule).toMatch(/leave with nothing/i);

    // And the room reacts to what it was told. The default reactions are
    // written for a POWER — "good, I hope I win it" — which is nonsense about a
    // twist nobody can win.
    const spoken = (ann.socialBeats || []).map(b => b.text).join(' ');
    expect(spoken).not.toMatch(/I hope I win it/);
    expect(spoken).toMatch(/one of you|one of them lying|it isn't you/i);
  });

  it('casts somebody, and not always the same somebody', () => {
    const picked = new Set();
    for (let i = 0; i < 30; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      picked.add(saboteurState().player);
    }
    expect(picked.size, 'the same houseguest every season is not casting').toBeGreaterThan(3);
  });

  it('lets a user cast it by hand', () => {
    house();
    const state = installBBSaboteur(NAMES, { rng: Math.random, pick: 'K' });
    expect(state.player).toBe('K');
    // A name that is not in the house is ignored rather than seated.
    house();
    const other = installBBSaboteur(NAMES, { rng: Math.random, pick: 'Nobody' });
    expect(NAMES).toContain(other.player);
  });

  it('refuses to run in a house too small to hide anybody in', () => {
    expect(installBBSaboteur(['A', 'B', 'C'], { rng: Math.random })).toBeNull();
  });
});

describe('a mission', () => {
  it('is offered, taken or refused, and pays only when taken', () => {
    // Refusing is now rare on purpose — about one week in twelve, and only when
    // the house is already watching — so this drives the exposure up by hand
    // instead of waiting for it. Both branches still have to be reachable, or
    // one of them is dead code.
    let paid = 0, refused = 0;
    for (let i = 0; i < 60; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      // Week two, not week one: the first job of a season is always taken (a
      // saboteur who is handed the card on night one and passes is a twist that
      // has not started), so week one can never exercise the refusal branch.
      playWeek({ num: 2 });
      // Half of these seasons have a house that is already onto them, which is
      // the only condition under which anybody sits a week out.
      if (i % 2) {
        const st = saboteurState();
        const watchers = NAMES.filter(n => n !== st.player).slice(0, 5);
        st.suspicion[st.player] = Object.fromEntries(watchers.map(n => [n, 1.4]));
      }
      const { brief, debrief } = playWeek({ num: 3 });
      if (!brief) continue;
      expect(brief.mission.name.length).toBeGreaterThan(3);
      expect(brief.beats.length).toBeGreaterThan(0);
      // The broadcast is a weekly fixture, taken or not.
      expect(brief.taunt.length).toBeGreaterThan(20);
      for (const b of [...brief.beats, ...(debrief?.beats || [])]) {
        expect(b.text).not.toMatch(/undefined|NaN|\[object/);
        expect(b.badgeText).toBeTruthy();
      }
      if (brief.accepted) {
        paid++;
        expect(debrief, 'a job was taken and never resolved').toBeTruthy();
        // Paid only when it actually came off.
        expect(debrief.paid).toBe(debrief.worked ? debrief.mission.pay : 0);
      } else {
        refused++;
        // A turned-down week still reports a result, or the week reads as a
        // missing screen rather than as a decision.
        expect(debrief.declined).toBe(true);
        expect(debrief.paid).toBe(0);
      }
    }
    // Both branches have to be reachable, or one of them is dead code.
    expect(paid).toBeGreaterThan(3);
    expect(refused).toBeGreaterThan(3);
  });

  it('always takes the first job of the season', () => {
    for (let i = 0; i < 20; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      expect(playWeek({ num: 1 }).brief.accepted).toBe(true);
    }
  });

  it('never runs the same job two weeks in a row', () => {
    house();
    installBBSaboteur(NAMES, { rng: Math.random });
    const seen = [];
    for (let w = 2; w < 8; w++) {
      const { brief } = playWeek({ num: w });
      if (brief) seen.push(brief.mission.id);
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
  });

  it('is caught sometimes and misattributed more often — which is the whole point', () => {
    let right = 0, wrong = 0, total = 0;
    for (let i = 0; i < 150; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      const { debrief } = playWeek();
      for (const n of debrief?.notices || []) {
        total++;
        n.correct ? right++ : wrong++;
      }
    }
    expect(total, 'nothing ever reached anybody, so the twist cannot be caught').toBeGreaterThan(30);
    // The saboteur must be identifiable at all — a house that can never put the
    // right name to it is not playing.
    expect(right, 'nobody ever read it correctly').toBeGreaterThan(2);
    // And it must still reach for the wrong name far more often, or this is a
    // detection minigame rather than a season of paranoia. Measured at roughly
    // one right read in six when this was tuned.
    expect(wrong).toBeGreaterThan(right * 1.5);
  });
});

describe('what the audience is paying for', () => {
  it('pays in popularity, not just in money nobody in the house can spend', () => {
    // The bank is a number on a card the game never reads. Applause is the
    // currency that exists inside the season, so a job that lands has to move
    // it — otherwise the whole twist is invisible to everything else.
    let moved = 0;
    for (let i = 0; i < 40; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      const sab = saboteurState().player;
      gs.popularity = {};
      const { debrief } = playWeek();
      if (debrief?.worked && (gs.popularity[sab] || 0) > 0) moved++;
    }
    expect(moved, 'a season of sabotage never once reached the audience').toBeGreaterThan(3);
  });

  it('pays nothing to somebody who spent the season laying low', () => {
    // Declining is a real option with a real price: it costs an audience, and
    // it does not count towards the quota of jobs they were paid to attempt.
    // Without the quota, laying low every week was free.
    house();
    installBBSaboteur(NAMES, { bankWeek: 5, rng: Math.random });
    const state = saboteurState();
    expect(state.quota).toBeGreaterThan(1);
    // One job done brilliantly, the rest of the season sat out.
    state.missions = [{ accepted: true, worked: true }];
    state.attempted = 1;
    state.applause = 4;
    expect(audiencePayout(state)).toBe(0);
    // Meeting it unlocks the verdict again.
    state.attempted = state.quota;
    expect(audiencePayout(state)).toBe(state.prize);
  });

  it('costs popularity to sit a week out, and costs nothing to try and miss', () => {
    // Run ten hunted saboteurs rather than one: the appetite floor is 3%, so a
    // single trial goes the other way about one run in thirty and a guard that
    // fails at random teaches people to re-run it rather than read it.
    let refusals = 0, dropped = 0;
    for (let i = 0; i < 10; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      const sab = saboteurState().player;
      gs.popularity = {};
      playWeek({ num: 2 });
      // The whole house is openly onto them, which is the only condition under
      // which anybody turns work down.
      saboteurState().suspicion[sab] = Object.fromEntries(
        NAMES.filter(n => n !== sab).slice(0, 8).map(n => [n, 2.5]));
      const before = gs.popularity[sab] || 0;
      const { brief } = playWeek({ num: 3 });
      if (!brief.accepted) {
        refusals++;
        // Sitting out costs an audience.
        if ((gs.popularity[sab] || 0) < before) dropped++;
      }
    }
    expect(refusals, 'a hunted saboteur took every single job').toBeGreaterThan(6);
    expect(dropped).toBe(refusals);
  });

  it('can decide the whole thing was worth nothing', () => {
    house();
    installBBSaboteur(NAMES, { rng: Math.random });
    const state = saboteurState();
    // Jobs done, quota met, nobody entertained.
    state.missions = [{ accepted: true, worked: true }, { accepted: true, worked: true }];
    state.attempted = state.quota;
    state.applause = 0.2;
    expect(audiencePayout(state)).toBe(0);
    // A season people enjoyed pays the lot.
    state.applause = 4;
    expect(audiencePayout(state)).toBe(state.prize);
    // And nothing at all pays nothing, whatever the applause.
    state.missions = [];
    expect(audiencePayout(state)).toBe(0);
  });
});

describe("rigging somebody else's competition", () => {
  it('is offered against a rival, and never against a Block Buster', () => {
    // The user's rule, and the right one: a houseguest playing the Block Buster
    // is playing to get off the block. Asking them to lose it on purpose is
    // asking them to hand over their season for eight thousand dollars — so the
    // mission that touches a competition somebody else is in is `rig`, and the
    // one that touches their own is `throw`, gated on having nothing at stake.
    //
    // Asserted on OFFERS rather than completions. Rigging lands about six times
    // in a hundred weeks once acceptance and difficulty are applied, which is a
    // sound rate for a hard job and far too noisy a signal for a test.
    let offered = 0, completed = 0;
    for (let i = 0; i < 150; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      const sab = saboteurState().player;
      const { brief, debrief } = playWeek({
        vetoPlayers: [...NAMES].slice(0, 6),
        nominees: [], finalNominees: ['B', 'C'],
      });
      if (brief?.mission.id !== 'rig') continue;
      offered++;
      if (!debrief?.worked) continue;
      completed++;
      // Always somebody else, and somebody who was actually in that yard.
      expect(debrief.result.target).not.toBe(sab);
      expect(NAMES.slice(0, 6)).toContain(debrief.result.target);
    }
    expect(offered, 'the competition was never a target').toBeGreaterThan(10);
    expect(completed, 'rigging a competition never once worked').toBeGreaterThan(0);
  });

  it('will not let somebody on the block throw the comp that saves them', () => {
    // Asserted on what they DO, not on what they are offered. The briefing
    // happens at the top of the week, before anybody is nominated, so the job
    // can legitimately be handed over and then turn out to be impossible — what
    // must never happen is a nominee actually throwing the competition that
    // would have taken them off the block.
    for (let i = 0; i < 40; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      const sab = saboteurState().player;
      const { debrief } = playWeek({ nominees: [sab, 'B'], finalNominees: [sab, 'B'],
        vetoPlayers: [sab, 'B', 'C', 'D', 'E', 'F'] });
      if (debrief?.mission.id !== 'throw') continue;
      // Offered, and correctly refused by the week itself.
      expect(debrief.worked).toBe(false);
      expect(debrief.impossible).toBe(true);
    }
  });
});

describe('the house naming somebody', () => {
  // BB12 had no call-out button — Annie was suspected and simply evicted. BB27
  // added the formal version, and got it wrong 11-5. This is BB27's rule: one
  // accusation, said out loud, and it ends the second game whichever way it goes.
  const convince = (name, byWho) => {
    const state = saboteurState();
    state.suspicion[name] = byWho;
  };
  // Nobody stands up over one incident, so every fixture below is a house that
  // has already watched two jobs land — and does it in a later week, because
  // the bar for saying a name out loud comes down as the season goes on.
  const twoJobsIn = () => {
    saboteurState().missions = [
      { week: 2, accepted: true, worked: true }, { week: 3, accepted: true, worked: true },
    ];
  };
  const late = (over = {}) => aWeek({ num: 5, ...over });

  it('says nothing until the house is actually certain, and agrees with itself', () => {
    house();
    installBBSaboteur(NAMES, { rng: Math.random });
    const sab = saboteurState().player;
    const other = NAMES.find(n => n !== sab);
    twoJobsIn();
    // One person with a hunch is a hunch, however loud.
    convince(sab, { [other]: 6 });
    expect(runSaboteurAccusation(late(), { rng: Math.random })).toBeNull();
    // Two voices is still not a house making a decision.
    const second = NAMES.find(n => n !== sab && n !== other);
    convince(sab, { [other]: 3, [second]: 3 });
    expect(runSaboteurAccusation(late(), { rng: Math.random })).toBeNull();
    // And three voices in week one is still too early: one incident is not a
    // pattern, whatever the room thinks it saw.
    const third = NAMES.find(n => n !== sab && n !== other && n !== second);
    convince(sab, { [other]: 3, [second]: 3, [third]: 3 });
    saboteurState().missions = [{ week: 1, accepted: true, worked: true }];
    expect(runSaboteurAccusation(aWeek({ num: 1 }), { rng: Math.random })).toBeNull();
  });

  it('ends the twist with nothing banked when it is right', () => {
    house();
    installBBSaboteur(NAMES, { rng: Math.random });
    const state = saboteurState();
    const sab = state.player;
    state.banked = 12000;
    twoJobsIn();
    const [a, b, c] = NAMES.filter(n => n !== sab);
    convince(sab, { [a]: 1.6, [b]: 1.2, [c]: 1.1 });

    const out = runSaboteurAccusation(late(), { rng: Math.random });
    expect(out).toBeTruthy();
    expect(out.correct).toBe(true);
    expect(out.named).toBe(sab);
    expect(out.lost).toBe(12000);
    expect(saboteurState().banked).toBe(0);
    expect(saboteurState().caught).toBe(true);
    // And no more work, ever.
    expect(offerSaboteurMission(aWeek({ num: 5 }), { rng: Math.random })).toBeNull();
  });

  it('takes the heat off the real one when it is wrong', () => {
    house();
    installBBSaboteur(NAMES, { rng: Math.random });
    const state = saboteurState();
    const sab = state.player;
    const [a, b, innocent] = NAMES.filter(n => n !== sab);
    // The house is loudly certain about somebody who did nothing, and quietly
    // suspicious of the person who did.
    const fourth = NAMES.filter(n => n !== sab)[3];
    twoJobsIn();
    convince(innocent, { [a]: 1.5, [b]: 1.3, [fourth]: 1.2 });
    convince(sab, { [a]: 1.2, [b]: 0.8 });
    const before = getBond(a, innocent);

    const out = runSaboteurAccusation(late(), { rng: Math.random });
    expect(out).toBeTruthy();
    expect(out.correct).toBe(false);
    expect(out.named).toBe(innocent);
    expect(out.reallyIs).toBe(sab);
    // The twist survives...
    expect(saboteurState().caught).toBe(false);
    // ...the innocent wears it...
    expect(getBond(a, innocent)).toBeLessThanOrEqual(before);
    // ...and the house stops looking at the person who actually did it.
    const onSab = saboteurState().suspicion[sab];
    expect(onSab[a]).toBeLessThan(1.2);
    expect(onSab[b]).toBeLessThan(0.8);
  });

  it('only ever names somebody still in the house', () => {
    house();
    installBBSaboteur(NAMES, { rng: Math.random });
    const state = saboteurState();
    const sab = state.player;
    const gone = NAMES.filter(n => n !== sab)[0];
    twoJobsIn();
    const others = NAMES.filter(n => n !== sab && n !== gone);
    convince(gone, { [others[0]]: 2, [others[1]]: 2, [others[2]]: 2 });
    // Everybody is certain about somebody who left in week one. Nobody stands
    // up at eviction night to accuse a photograph on the wall.
    const shrunk = NAMES.filter(n => n !== gone);
    expect(runSaboteurAccusation(late({ houseAtStart: shrunk }), { rng: Math.random })).toBeNull();
  });
});

describe('the two endings', () => {
  it('banks at the bank date, reveals the name, and turns them back into a houseguest', () => {
    house();
    installBBSaboteur(NAMES, { bankWeek: 3, rng: Math.random });
    const sab = saboteurState().player;
    playWeek({ num: 2 });
    expect(checkSaboteurBank(aWeek({ num: 2 }))).toBeNull();   // not yet

    const reveal = checkSaboteurBank(aWeek({ num: 3 }));
    expect(reveal).toBeTruthy();
    expect(reveal.saboteur).toBe(sab);
    expect(saboteurState().survived).toBe(true);
    expect(saboteurState().revealed).toBe(true);
    // And the second game is over: no more missions, ever.
    expect(offerSaboteurMission(aWeek({ num: 4 }), { rng: Math.random })).toBeNull();
    expect(isSaboteur(sab)).toBe(true);   // still the person who did it
  });

  it('loses everything if they are evicted first', () => {
    house();
    installBBSaboteur(NAMES, { bankWeek: 9, rng: Math.random });
    const sab = saboteurState().player;
    let banked = 0;
    for (let w = 2; w < 6; w++) {
      const { debrief } = playWeek({ num: w });
      if (debrief) banked = debrief.banked;
    }
    const out = saboteurEvicted(sab, aWeek({ num: 6 }));
    expect(out).toBeTruthy();
    expect(out.evicted).toBe(true);
    expect(out.lost).toBe(banked);
    expect(saboteurState().banked).toBe(0);
    // Evicting anybody else does nothing.
    house();
    installBBSaboteur(NAMES, { rng: Math.random });
    const other = NAMES.find(n => n !== saboteurState().player);
    expect(saboteurEvicted(other, aWeek())).toBeNull();
  });
});

describe('finding it in the house feed', () => {
  it('puts the event the room saw into House Life, and never the name', () => {
    // The feed is the only place a viewer can go looking for the twist, and it
    // was getting the house's REACTION with the thing it was reacting to left
    // out — "the house spends the morning on who did it" with no it. There is
    // nothing recognisable to scan for in that.
    house({ bbSaboteur: 'random', bbSaboteurBankWeek: 9 });
    let checked = 0;
    for (let w = 0; w < 4 && checked < 3; w++) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      const debrief = (ep.acts || []).find(a => a.type === 'saboteur-debrief' && !a.declined);
      if (!debrief) continue;
      const sab = saboteurState().player;

      const feed = (ep.acts || []).flatMap(a => (a.socialBeats || [])
        .filter(b => /^saboteur-/.test(b.eventId || '')));
      // Counted loosely on purpose: a compressed cycle can finish a week with
      // no house stretch left to attach to, and the property worth guarding is
      // that what DID reach the feed is the right thing, not the arithmetic.
      if (!feed.length) continue;
      checked++;

      const landed = feed.at(-1);
      // The room never learns who. That is the whole split: cause on the
      // audience's screen, consequence in the house's feed.
      expect(landed.text).not.toContain(sab);
      expect(landed.badgeText).toBeTruthy();
      // And the results screen quotes it exactly, so the two can be matched up.
      expect(debrief.feedLine).toBe(landed.text);
    }
    expect(checked, 'no job ran in four weeks').toBeGreaterThan(0);
  });
});

describe('rigging a competition', () => {
  it('actually moves the board, and says what it cost', () => {
    // It used to be a caption: the screen said a marker had been moved four
    // inches and the standings were exactly what they would have been anyway.
    // The handicap is applied in js/bb/comps.js, at the one point every
    // competition passes through, so all sixty hand-written ones feel it
    // without knowing the twist exists.
    let rigs = 0, withNumbers = 0;
    for (let s = 0; s < 20 && rigs < 6; s++) {
      house({ bbSaboteur: 'random', bbSaboteurBankWeek: 9 });
      for (let w = 0; w < 5; w++) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        const d = (ep.acts || []).find(a => a.type === 'saboteur-debrief' && a.mission?.id === 'rig');
        if (d?.worked) {
          rigs++;
          // The line the house gets names the competition and the placing,
          // rather than asserting a loss the board never recorded.
          if (/finishes \d+(st|nd|rd|th)/.test(d.feedLine || '')) withNumbers++;
        }
        if (saboteurState()?.caught || saboteurState()?.survived) break;
      }
    }
    expect(rigs, 'the competition was never rigged').toBeGreaterThan(0);
    expect(withNumbers, 'a rig that landed never reported a placing').toBeGreaterThan(0);
  });

  it('leaves every other competition alone', () => {
    // The handicap is opt-in per competition. A week with no rig in it must
    // produce no `sabotage` block at all, or this quietly re-ranks the season.
    house({ bbSaboteur: 'off' });
    for (let w = 0; w < 3; w++) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      for (const act of ep.acts || []) {
        if (act.competition) expect(act.competition.sabotage ?? null).toBeNull();
      }
    }
  });
});

describe('the shape of a season', () => {
  // The numbers this twist lives or dies on, measured rather than asserted from
  // taste. The first tuning produced: 49% of jobs landing, the saboteur caught
  // in 35 seasons out of 40 at an average of week 1.6, and 31 of 34 accusations
  // correct. Every one of those is the twist failing — a second game that is
  // mostly a record of things that did not happen, ended in week two, by a
  // house that is never wrong.
  //
  // Sixteen seasons rather than forty: enough to catch a regression to "caught
  // every time" without putting a minute of sweep in the suite.
  it('lands its jobs, survives past week one, and mostly convicts the wrong person', () => {
    let jobs = 0, worked = 0, caught = 0, banked = 0, calls = 0, right = 0;
    for (let s = 0; s < 16; s++) {
      house({ bbSaboteur: 'random', bbSaboteurBankWeek: 5 });
      for (let w = 0; w < 6; w++) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        for (const a of ep.acts || []) {
          if (a.type === 'saboteur-debrief' && !a.declined) { jobs++; if (a.worked) worked++; }
          if (a.type === 'saboteur-accusation') { calls++; if (a.correct) right++; }
        }
        const st = saboteurState();
        if (st?.caught || st?.survived) break;
      }
      const st = saboteurState();
      if (st?.caught) caught++; else if (st?.survived) banked++;
    }

    expect(jobs, 'no jobs ran at all').toBeGreaterThan(15);
    // A cast saboteur is good at this. Half the jobs failing made the second
    // game mostly a record of things that did not happen.
    expect(worked / jobs).toBeGreaterThan(0.45);
    // And the twist has to be able to finish. Caught in every season is the
    // exact failure this replaced.
    expect(banked, 'the saboteur never once reached the bank date').toBeGreaterThan(2);
    expect(caught).toBeLessThan(14);
    // When the house does stand up it is right about half the time, by design:
    // wrong names converge (a house repeats the name it has already heard) and
    // right ones concentrate, and the two roughly cancel. What must not happen
    // is the house being right EVERY time, which is where this started — 31
    // correct calls out of 34.
    //
    // Only judged on a real sample. Sixteen seasons produce a handful of calls,
    // and at a designed 50/50 a run of four correct ones is ordinary luck — a
    // guard that fails one run in five teaches people to re-run it.
    if (calls >= 8) expect(right / calls).toBeLessThan(0.85);
  });

  it('will not spend its guess on the first thing that goes wrong', () => {
    // One incident is not a pattern, and the house was burning its only
    // accusation in week one on the noise from a single job. It has to have
    // lived through two landed jobs before anybody stands up — and the bar for
    // standing up comes down as the weeks go on, because a room full of
    // half-theories talks itself out of it early and a room that has watched
    // five weeks of this does not.
    const weeks = [];
    for (let s = 0; s < 12; s++) {
      house({ bbSaboteur: 'random', bbSaboteurBankWeek: 9 });
      for (let w = 0; w < 6; w++) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        for (const a of ep.acts || []) {
          if (a.type === 'saboteur-accusation') weeks.push(a.week);
        }
        if (saboteurState()?.caught) break;
      }
    }
    // Never in week one, whatever happened in it.
    expect(Math.min(...weeks, 99)).toBeGreaterThan(1);
  });

  it('only ever gets one guess', () => {
    house({ bbSaboteur: 'random', bbSaboteurBankWeek: 9 });
    let calls = 0;
    for (let w = 0; w < 7; w++) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      calls += (ep.acts || []).filter(a => a.type === 'saboteur-accusation').length;
    }
    expect(calls).toBeLessThan(2);
  });
});

describe('a season with one running', () => {
  it('reaches the transcript and the viewing party', () => {
    house({ bbSaboteur: 'on', bbSaboteurBankWeek: 4 });
    let sawMission = false;
    let sawReveal = false;
    for (let w = 0; w < 5; w++) {
      const ep = withSeededRandom(90 + w * 7, () => simulateBBEpisode());
      if (!ep) break;
      const acts = (ep.acts || []).filter(a => /^saboteur/.test(a.type));
      if (!acts.length) continue;

      const text = generateSummaryText(ep) || '';
      gs.episodeHistory = [ep];
      buildVPScreens(ep);
      Object.keys(_tvState).forEach(k => { if (_tvState[k]) _tvState[k].idx = 99; });
      const screens = (buildVPScreens(ep) || []).filter(s => /saboteur/.test(s.id));
      expect(screens.length, 'a saboteur act with no screen').toBeGreaterThan(0);

      for (const act of acts) {
        if (act.type === 'saboteur-brief') sawMission = true;
        if (act.type === 'saboteur-reveal') sawReveal = true;
        // The audience is shown all of it — that is the format. The house is
        // told none of it, which is what `secret` is for.
        expect(text).toMatch(/SABOTEUR/);
        for (const b of act.beats || []) {
          expect(text, 'a beat the transcript never wrote down')
            .toContain(b.text.replace(/<[^>]*>/g, '').slice(0, 40));
        }
      }
      for (const s of screens) {
        expect(s.html.length).toBeGreaterThan(600);
        expect(s.html).not.toMatch(/undefined|NaN|\[object Object\]/);
      }
    }
    expect(sawMission, 'no mission ran in five weeks').toBe(true);
    expect(sawReveal, 'the twist never ended').toBe(true);
  });

  it('does nothing at all when the season did not ask for one', () => {
    house({ bbSaboteur: 'off' });
    const ep = withSeededRandom(31, () => simulateBBEpisode());
    expect(saboteurState()).toBeFalsy();
    expect((ep.acts || []).some(a => /^saboteur/.test(a.type))).toBe(false);
  });
});
