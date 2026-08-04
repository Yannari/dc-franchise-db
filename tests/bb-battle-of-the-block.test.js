// The Battle of the Block.
//
// Two Heads of Household, four nominees, and one of the two thrones is gone by
// the end of the night: the four play as pairs, the winning pair comes off the
// block, and the Head of Household who nominated them is dethroned.
//
// The twist is built as a PREFIX to an ordinary week. Once the battle has
// resolved there is one HOH and two nominees again, so every downstream act —
// veto, ceremony, campaign, vote — runs unchanged. These tests are mostly
// about that collapse being clean, because a week that half-collapses would
// leave two people holding power into the eviction.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { BB_TWIST_CONTRACTS, BASE_WEEK_RULES, resolveWeekTwistState } from '../js/bb/twist-contract.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Wayne', 'Priya'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'perceptive-player', 'challenge-beast'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7 });
  seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-battle-of-the-block' }];
  seasonConfig.bbHaveNots = 'off';
}

/** Play week one with the twist scheduled and hand back the episode. */
const playWeek = (seed = 4242) => withSeededRandom(seed, () => simulateBBEpisode());
const actOf = (ep, type) => (ep.acts || []).find(a => a.type === type);

describe('Battle of the Block', () => {
  beforeEach(house);

  it('is registered as a contract that seats two Heads of Household', () => {
    const contract = BB_TWIST_CONTRACTS['bb-battle-of-the-block'];
    expect(contract, 'the twist has no contract').toBeTruthy();
    expect(BASE_WEEK_RULES.hohCount, 'a neutral week should seat one HOH').toBe(1);
    const resolved = resolveWeekTwistState(['bb-battle-of-the-block']);
    expect(resolved.rules.hohCount).toBe(2);
    expect(resolved.rules.nomineeCount).toBe(4);
    // Public acquisition, so the house is told the rule before it bites.
    expect(contract.announcement, 'no announcement').toBeTruthy();
  });

  it('crowns two, nominates four, and dethrones one', () => {
    const ep = playWeek();
    const battle = actOf(ep, 'battle-of-the-block');
    expect(battle, 'the battle never happened').toBeTruthy();

    const [a, b] = battle.hohs;
    expect(a).not.toBe(b);
    const four = [...battle.pairs[a], ...battle.pairs[b]];
    expect(new Set(four).size, 'somebody sat on both blocks').toBe(4);
    expect(four).not.toContain(a);
    expect(four).not.toContain(b);

    // Exactly one throne survives, and the saved pair is the dethroned one's.
    expect([a, b]).toContain(battle.dethroned);
    expect([a, b]).toContain(battle.reigning);
    expect(battle.dethroned).not.toBe(battle.reigning);
    expect([...battle.saved].sort()).toEqual([...battle.pairs[battle.dethroned]].sort());
    expect([...battle.stuck].sort()).toEqual([...battle.pairs[battle.reigning]].sort());
  });

  it('collapses back to an ordinary week: one HOH, two nominees', () => {
    const ep = playWeek();
    const battle = actOf(ep, 'battle-of-the-block');

    expect(ep.hoh).toBe(battle.reigning);
    expect([...ep.initialNominees].sort()).toEqual([...battle.stuck].sort());
    // The saved pair really is off the block at the vote.
    for (const saved of battle.saved) {
      expect(ep.finalNominees, `${saved} was saved and still faced the vote`).not.toContain(saved);
      expect(ep.eliminated, `${saved} was saved and still went home`).not.toBe(saved);
    }
    // And the week still evicted somebody through the normal machinery.
    expect(actOf(ep, 'veto'), 'the veto never ran').toBeTruthy();
    expect(ep.eliminated, 'nobody was evicted').toBeTruthy();
  });

  it('a dethroned Head of Household loses the protection of the room', () => {
    const ep = playWeek();
    const battle = actOf(ep, 'battle-of-the-block');
    // They are not the HOH any more, so nothing about them is safe: they vote,
    // and they can be seated in the empty chair like anybody else.
    expect(ep.hoh).not.toBe(battle.dethroned);
    const voters = (ep.votingLog || []).map(v => v.voter);
    if (voters.length) {
      expect(voters, 'the dethroned HOH did not get their vote back').toContain(battle.dethroned);
    }
    // The reigning HOH does not vote; that is the ordinary rule reasserting.
    expect(voters).not.toContain(battle.reigning);
  });

  it('a dethroned reign does not count as a reign', () => {
    const ep = playWeek();
    const battle = actOf(ep, 'battle-of-the-block');
    // The wiki is explicit: dethroned weeks are not in the record. The
    // surviving reign is, and only that one.
    expect(gs.bb.stats[battle.reigning].hohWins).toBeGreaterThanOrEqual(1);
    expect(gs.bb.stats[battle.dethroned].hohWins).toBe(0);
  });

  it('the battle has consequences the house carries', () => {
    const ep = playWeek();
    const battle = actOf(ep, 'battle-of-the-block');
    // The bond penalty is recorded rather than asserted as an absolute value:
    // -1.2 against a pre-existing friendship of +5.7 is still a friendship, so
    // checking the sign of the bond tested nothing about the battle.
    expect(battle.fallout, 'the battle recorded no fallout').toBeTruthy();
    expect(battle.fallout.savedToDethroned).toBeLessThan(0);
    expect(battle.fallout.stuckToReigning).toBeLessThan(0);
    // Popularity is a running total, and the dethroned houseguest won the HOH
    // competition earlier the same night — so their total is comfortably
    // positive and asserting its sign tests nothing either. The delta is the
    // claim being made.
    expect(battle.fallout.dethronedPopularity, 'being dethroned cost nothing').toBeLessThan(0);
    expect(battle.fallout.savedPopularity, 'winning the battle gained nothing').toBeGreaterThan(0);
    const memories = gs.bb.competitionMemories || {};
    expect((memories[battle.dethroned] || []).some(m => m.type === 'botb-dethroned')).toBe(true);
    expect(battle.saved.every(n => (memories[n] || []).some(m => m.type === 'botb-saved'))).toBe(true);
  });

  it('stands down when the house is too small to seat two blocks', () => {
    house();
    // Two HOHs plus four nominees needs eight; below that the week must run
    // as an ordinary one rather than half-seating a second block.
    gs.activePlayers = NAMES.slice(0, 7);
    gs.eliminated = NAMES.slice(7);
    const ep = playWeek(99);
    expect(actOf(ep, 'battle-of-the-block'), 'seated a battle it could not fill').toBeFalsy();
    expect(ep.hoh, 'the week produced no HOH at all').toBeTruthy();
  });
});

// ── the week as it is watched and read ────────────────────────────────
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';

describe('Battle of the Block, on the surfaces', () => {
  beforeEach(house);

  it('gets its own screen, with no duplicate ceremony', () => {
    const ep = playWeek();
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    const screens = buildVPScreens(ep);
    const ids = screens.map(s => s.id);
    expect(ids, 'no battle screen').toContain('bb-botb');
    // Two ceremonies happened; only one ceremony screen may exist, and ids
    // must be unique or the player cannot navigate.
    expect(new Set(ids).size, `duplicate screen ids: ${ids.join(', ')}`).toBe(ids.length);
    const html = screens.find(s => s.id === 'bb-botb').html;
    const battle = actOf(ep, 'battle-of-the-block');
    for (const name of [...battle.hohs, ...battle.saved, ...battle.stuck]) {
      expect(html, `${name} missing from the battle screen`).toContain(name);
    }
  });

  it('reaches both transcript writers', () => {
    const ep = playWeek();
    const battle = actOf(ep, 'battle-of-the-block');
    for (const [label, text] of [
      ['summariseWeek', summariseWeek(ep)],
      ['generateSummaryText', generateSummaryText(ep)],
    ]) {
      expect(text, `${label}: no battle`).toMatch(/BATTLE OF THE BLOCK/i);
      expect(text, `${label}: never says who was dethroned`).toContain(battle.dethroned);
      expect(text, `${label}: never names the winning pair`).toContain(battle.saved[0]);
      // Every beat of the battle competition survives into the written week.
      const missing = (battle.competition?.beats || [])
        .filter(b => b && b.text && !text.includes(b.text)).length;
      expect(missing, `${label}: dropped ${missing} battle beats`).toBe(0);
    }
  });
});

describe('the battle narrates the pair result, not the arena one', () => {
  beforeEach(house);

  it('drops the arena library beats that announce an individual fate', () => {
    // Those beats belong to the Block Buster, where one nominee comes off the
    // block alone. In a pair format they contradict the outcome outright —
    // "Axel stays nominated" printed on a night Axel's pair won.
    for (const seed of [4242, 77, 1301]) {
      house();
      const ep = playWeek(seed);
      const battle = actOf(ep, 'battle-of-the-block');
      if (!battle) continue;
      const bad = (battle.competition?.beats || [])
        .filter(b => ['STAYS NOMINATED', 'OFF THE BLOCK'].includes(b?.badgeText));
      expect(bad.map(b => b.text), `seed ${seed}: arena verdicts survived`).toEqual([]);
      // And no surviving beat may tell a saved houseguest they are nominated.
      const text = (battle.competition?.beats || []).map(b => b.text).join(' ');
      for (const saved of battle.saved) {
        expect(text, `seed ${seed}: ${saved} was saved but the beats nominate them`)
          .not.toMatch(new RegExp(`${saved}[^.]{0,80}stays nominated`, 'i'));
      }
    }
  });
});

describe('Battle of the Block and the Block Buster cannot share a week', () => {
  // They are structurally incompatible: the Block Buster owns a third chair
  // and its own way off the block, the Battle owns four chairs across two
  // blocks. The season mode wins, because it is a standing rule rather than
  // one week's card. What matters is that standing down is HONEST — the house
  // must never be told about a rule that then does not arrive.
  const withMode = (mode) => {
    house();
    seasonConfig.bbSafetyMode = mode;
    return playWeek();
  };

  it('the Block Buster keeps the block, and the battle stands down', () => {
    const ep = withMode('block-buster');
    expect(actOf(ep, 'battle-of-the-block'), 'both twists ran in one week').toBeFalsy();
    expect(actOf(ep, 'safety'), 'the Block Buster did not run either').toBeTruthy();
    expect(ep.initialNominees.length, 'the Block Buster needs three chairs').toBe(3);
    expect(ep.botbStoodDown, 'no reason recorded for standing down').toBe('block-buster');
  });

  it('and the house is never promised a battle that will not happen', () => {
    const ep = withMode('block-buster');
    const announcement = actOf(ep, 'twist-announcement');
    const announced = (announcement?.announced || []).map(a => a.twist);
    expect(announced, 'the voice announced two Heads of Household and then seated one')
      .not.toContain('bb-battle-of-the-block');
  });

  it('with the mode off, the battle runs as normal', () => {
    const ep = withMode('off');
    expect(actOf(ep, 'battle-of-the-block'), 'the battle did not run').toBeTruthy();
    expect(ep.initialNominees.length).toBe(2);
    expect(ep.botbStoodDown).toBeFalsy();
  });
});

describe('a week with two Heads of Household says so', () => {
  beforeEach(house);

  it('each ceremony is credited to the person who actually held it', () => {
    // The screen read ep.hoh, which after the battle is whoever SURVIVED it —
    // so on every week where the first HOH was dethroned, their nominations
    // were drawn under the other Head of Household's name.
    const ep = playWeek();
    const battle = actOf(ep, 'battle-of-the-block');
    const ceremonies = (ep.acts || []).filter(a => a.type === 'nominations');
    expect(ceremonies.length, 'a two-HOH week held one ceremony').toBe(2);

    for (const ceremony of ceremonies) {
      expect(ceremony.hoh, 'a ceremony with no owner').toBeTruthy();
      expect(battle.hohs).toContain(ceremony.hoh);
      // The people this HOH put up are the people on their own block.
      expect([...ceremony.nominees].sort())
        .toEqual([...battle.pairs[ceremony.hoh]].sort());
    }
    // And the two ceremonies belong to different people.
    expect(ceremonies[0].hoh).not.toBe(ceremonies[1].hoh);

    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    const screens = buildVPScreens(ep);
    // Both ceremonies are watchable, and the first is not drawn under the
    // surviving HOH's name when it was the dethroned one's ceremony.
    const nomScreens = screens.filter(s => s.id.startsWith('bb-noms'));
    expect(nomScreens.length, 'only one ceremony got a screen').toBe(2);
    const first = nomScreens[0].html;
    const dethronedsNominees = battle.pairs[battle.dethroned];
    if (first.includes(dethronedsNominees[0]) && first.includes(dethronedsNominees[1])) {
      expect(first, "the dethroned HOH's ceremony was credited to the survivor")
        .toContain(battle.dethroned);
    }
  });

  it('the competition board shows both crowns, not one', () => {
    const ep = playWeek();
    const battle = actOf(ep, 'battle-of-the-block');
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    buildVPScreens(ep);
    // Naming both crowns before the board is read would hand over the top two
    // placements, so the panel waits for the reveal to finish.
    Object.keys(_tvState).forEach(k => { _tvState[k].idx = 999; });
    const screens = buildVPScreens(ep);
    const hohScreen = screens.find(s => s.id === 'bb-hoh');
    expect(hohScreen, 'no HOH screen').toBeTruthy();
    for (const name of battle.hohs) {
      expect(hohScreen.html, `${name} was crowned and is not on the board`).toContain(name);
    }
    expect(hohScreen.html).toMatch(/TWO HEADS OF HOUSEHOLD/);
  });

  it('house life is told about both of them', () => {
    // Half the power in the room was invisible to every event that reacts to
    // somebody holding it.
    const ep = playWeek();
    const battle = actOf(ep, 'battle-of-the-block');
    expect(ep.coHoh, 'the episode never recorded a second HOH').toBeTruthy();
    expect(battle.hohs).toContain(ep.coHoh);
  });
});
