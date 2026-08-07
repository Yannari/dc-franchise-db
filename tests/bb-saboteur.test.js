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
    // Eighty rather than forty: at forty this went red about one run in five
    // purely on the acceptance roll, and a guard that fails at random teaches
    // people to re-run it rather than read it.
    let paid = 0, refused = 0;
    for (let i = 0; i < 80; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      // Week two, not week one: the first job of a season is always taken (a
      // saboteur who is handed the card on night one and passes is a twist that
      // has not started), so week one can never exercise the refusal branch.
      playWeek({ num: 2 });
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
        expect(debrief).toBeNull();
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
    for (let i = 0; i < 80; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      const { debrief } = playWeek();
      for (const n of debrief?.notices || []) {
        total++;
        n.correct ? right++ : wrong++;
      }
    }
    expect(total, 'nothing ever reached anybody, so the twist cannot be caught').toBeGreaterThan(30);
    // The saboteur must be genuinely at risk...
    expect(right / total).toBeGreaterThan(0.15);
    // ...and the house must still convict innocents more often than not, or
    // this is a detection minigame rather than a season of paranoia. Measured
    // at roughly 40/60 when this was tuned.
    expect(wrong).toBeGreaterThan(right * 0.8);
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

  it('can decide the whole thing was worth nothing', () => {
    house();
    installBBSaboteur(NAMES, { rng: Math.random });
    const state = saboteurState();
    // Jobs done, nobody entertained.
    state.missions = [{ accepted: true, worked: true }, { accepted: true, worked: true }];
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

  it('will not ask somebody on the block to throw the comp that saves them', () => {
    // `throw` is the mission that costs the saboteur something real, so it is
    // gated on them having nothing at stake in it.
    for (let i = 0; i < 40; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      const sab = saboteurState().player;
      const { brief } = playWeek({ nominees: [sab, 'B'], finalNominees: [sab, 'B'],
        vetoPlayers: [sab, 'B', 'C', 'D', 'E', 'F'] });
      if (brief) expect(brief.mission.id).not.toBe('throw');
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

  it('says nothing until the house is actually certain, and agrees with itself', () => {
    house();
    installBBSaboteur(NAMES, { rng: Math.random });
    const sab = saboteurState().player;
    const other = NAMES.find(n => n !== sab);
    // One person with a hunch is a hunch.
    convince(sab, { [other]: 2.5 });
    expect(runSaboteurAccusation(aWeek(), { rng: Math.random })).toBeNull();
    // Enough conviction, but only one voice.
    convince(sab, { [other]: 6 });
    expect(runSaboteurAccusation(aWeek(), { rng: Math.random })).toBeNull();
  });

  it('ends the twist with nothing banked when it is right', () => {
    house();
    installBBSaboteur(NAMES, { rng: Math.random });
    const state = saboteurState();
    const sab = state.player;
    state.banked = 12000;
    state.missions = [{ accepted: true, worked: true }, { accepted: true, worked: true }];
    const [a, b] = NAMES.filter(n => n !== sab);
    convince(sab, { [a]: 2.2, [b]: 1.5 });

    const out = runSaboteurAccusation(aWeek(), { rng: Math.random });
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
    convince(innocent, { [a]: 2.4, [b]: 1.8 });
    convince(sab, { [a]: 1.2, [b]: 0.8 });
    const before = getBond(a, innocent);

    const out = runSaboteurAccusation(aWeek(), { rng: Math.random });
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
    convince(gone, { [NAMES.filter(n => n !== sab && n !== gone)[0]]: 4,
      [NAMES.filter(n => n !== sab && n !== gone)[1]]: 3 });
    // Everybody is certain about somebody who left in week one. Nobody stands
    // up at eviction night to accuse a photograph on the wall.
    const shrunk = NAMES.filter(n => n !== gone);
    expect(runSaboteurAccusation(aWeek({ houseAtStart: shrunk }), { rng: Math.random })).toBeNull();
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
