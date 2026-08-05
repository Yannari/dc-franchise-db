// The BB Time Capsule (BB28).
//
// The audience vote stops handing anything over. It sends the favourite into a
// room to attempt a challenge alone: beat it and they come out holding a power
// from a past season, fail it and they come out wearing a punishment from one.
//
// The punishments are the half worth simulating. A houseguest in the Egg
// Detective suit cannot have a serious conversation, so `socialDrag` is
// subtracted from their persuasion at BOTH sites in the vote operation —
// recruiting for a bloc and campaigning off the block. A costume that only
// generated jokes would be scenery.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { BB_PUNISHMENTS, applyPunishment, socialDrag, punishmentFor,
  punishedHaveNots } from '../js/bb/punishments.js';
import { BB_POWER_DEFINITIONS } from '../js/bb/powers.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(weeks = 1) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  // No cpStyle: the Time Capsule is what this twist does by default.
  seasonConfig.twistSchedule = Array.from({ length: weeks },
    (_, i) => ({ episode: i + 1, type: 'bb-care-package' }));
}

const actOf = ep => (ep.acts || []).find(a => a.type === 'time-capsule') || null;

/** Play until a capsule week matching `want` turns up. */
function play(want = () => true, weeks = 4) {
  for (let seed = 1; seed <= 30; seed++) {
    house(weeks);
    for (let w = 0; w < weeks; w++) {
      const ep = withSeededRandom(seed * 31 + w * 9 + 2, () => simulateBBEpisode());
      if (!ep) break;
      const act = actOf(ep);
      if (act && want(act)) return { ep, act };
    }
  }
  return null;
}

describe('the BB Time Capsule', () => {
  beforeEach(() => house());

  it('is what the audience vote does by default', () => {
    const played = play();
    expect(played, 'the capsule never ran').toBeTruthy();
    expect(played.act.favourite).toBeTruthy();
    expect(typeof played.act.won).toBe('boolean');
  });

  it('pays out a power from a past season when they beat it', () => {
    const played = play(a => a.won);
    expect(played, 'nobody ever beat the capsule').toBeTruthy();
    const { act } = played;
    expect(BB_POWER_DEFINITIONS[act.powerId], 'not a real power').toBeTruthy();
    expect(act.punishmentId).toBeNull();
    // Granted for real, and held secretly — the house is told the capsule was
    // beaten and never what came out of it.
    const held = (gs.bb.powers || []).filter(p => p.holder === act.favourite
      && p.source === 'bb-time-capsule');
    expect(held.length, 'the power was never actually granted').toBeGreaterThan(0);
    expect(held[0].visibility).toBe('holder-secret');
  });

  it('puts them in a costume from a past season when they do not', () => {
    const played = play(a => !a.won);
    expect(played, 'nobody ever failed the capsule').toBeTruthy();
    const { act } = played;
    const def = BB_PUNISHMENTS[act.punishmentId];
    expect(def, 'not a real punishment').toBeTruthy();
    expect(act.powerId).toBeNull();
    expect(punishmentFor(act.favourite, act.week), 'never actually applied').toBeTruthy();
    // Adam and Eve drags somebody else into it who never asked for any of this.
    if (def.tether) expect(act.tetheredTo).toBeTruthy();
    // A slop punishment is real slop.
    if (def.slop) {
      expect(punishedHaveNots(act.week)).toContain(act.favourite);
    }
  });

  it('makes the costume cost them votes, not just dignity', () => {
    house();
    // Every costume drags, and the tethered partner carries most of it too.
    for (const id of Object.keys(BB_PUNISHMENTS)) {
      seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      const def = BB_PUNISHMENTS[id];
      applyPunishment('Bowie', id, { week: 3, partner: 'Chase' });
      expect(socialDrag('Bowie', 3), `${id} costs nothing`).toBeGreaterThan(0);
      expect(socialDrag('Bowie', 3)).toBeCloseTo(def.drag, 5);
      // Not before it starts, and not after it ends.
      expect(socialDrag('Bowie', 2)).toBe(0);
      expect(socialDrag('Bowie', 3 + (def.weeks || 1))).toBe(0);
      // Somebody with no punishment is never dragged.
      expect(socialDrag('Ripper', 3)).toBe(0);
      if (def.tether) {
        expect(socialDrag('Chase', 3), 'the tether costs the partner nothing')
          .toBeGreaterThan(0);
      }
    }
  });

  it('reaches both transcripts', () => {
    const played = play();
    expect(played, 'no capsule week').toBeTruthy();
    const { ep, act } = played;
    for (const [label, text] of [
      ['summariseWeek', summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1])],
      ['generateSummaryText', generateSummaryText(ep)],
    ]) {
      expect(text, `${label}: untranscribed`).toMatch(/BB TIME CAPSULE/);
      expect(text, `${label}: did not name the favourite`).toContain(act.favourite);
      // A win is announced as a win and never as WHAT was won: the house is
      // told the capsule was beaten and nothing else.
      if (act.won) {
        expect(text, `${label}: leaked the power`).not.toContain(act.power);
      } else {
        expect(text, `${label}: hid the costume`).toContain(act.punishment);
      }
    }
  });

  it('sends nobody in twice, however long the season runs', () => {
    house(10);
    const been = [];
    for (let w = 0; w < 10; w++) {
      const ep = withSeededRandom(31 + w * 9 + 2, () => simulateBBEpisode());
      if (!ep) break;
      const act = actOf(ep);
      if (act) been.push(act.favourite);
    }
    expect(been.length, 'the capsule never ran').toBeGreaterThan(2);
    expect(new Set(been).size, 'somebody went in twice').toBe(been.length);
  });

  it('is winnable and losable — neither outcome is the default', () => {
    let won = 0;
    let lost = 0;
    for (let seed = 1; seed <= 24; seed++) {
      house();
      const ep = withSeededRandom(seed * 31 + 2, () => simulateBBEpisode());
      const act = ep && actOf(ep);
      if (!act) continue;
      if (act.won) won++; else lost++;
    }
    expect(won + lost, 'no capsules ran at all').toBeGreaterThan(8);
    expect(won, 'nobody ever wins').toBeGreaterThan(0);
    expect(lost, 'nobody ever loses').toBeGreaterThan(0);
  });
});
