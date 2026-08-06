// The field, not the medallion.
//
// Every other veto twist in this project fires at the ceremony, on an object
// somebody has already won. These two fire between the draw and the
// competition, and what they edit is who is standing there — which is why they
// get their own module and their own suite rather than another branch in
// veto-rules.
//
// The rule that matters most is the one nothing is allowed to break: the Head
// of Household and the nominees play by RIGHT. No twist in the format's history
// has taken that away, the Hacker already honours it, and a redraw that can
// drop a nominee out of their own veto competition is a different (and much
// worse) twist than the one on the card.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek, BB_TWIST_IDS } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { applyVetoDrawTwist, resolveVetoDrawRules } from '../js/bb/veto-draw.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(twist, weeks = 3) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = Array.from({ length: weeks },
    (_, i) => ({ episode: i + 1, type: twist }));
}

const actOf = (ep, type) => (ep.acts || []).find(a => a.type === type) || null;

function play(twist, weeks = 3, seed = 7) {
  house(twist, weeks);
  const eps = [];
  for (let w = 0; w < weeks; w++) {
    const ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode());
    if (!ep) break;
    eps.push(ep);
  }
  return eps;
}

const WEEK = rules => ({ num: 3, twistState: { rules } });
const FIELD = { house: NAMES, hoh: 'Bowie', nominees: ['Chase', 'Ripper'],
  players: ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel'] };

describe('the veto draw twists', () => {
  beforeEach(() => house('bb-veto-redraw'));

  it('reads the field twist off the same two sources every other twist uses', () => {
    expect(resolveVetoDrawRules(WEEK({}))).toMatchObject({ redraw: false, replace: 0 });
    expect(resolveVetoDrawRules(WEEK({ vetoRedraw: true })).redraw).toBe(true);
    expect(resolveVetoDrawRules(WEEK({ vetoReplace: 1 })).replace).toBe(1);
  });

  it('never touches a seat somebody holds by right', () => {
    // The whole contract. Run both shapes many times over and the Head of
    // Household and both nominees must be standing there every single time.
    for (const rules of [{ vetoRedraw: true }, { vetoReplace: 1 }]) {
      for (let i = 0; i < 40; i++) {
        const rng = (() => { let s = i * 2654435761 + 7; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
        const out = applyVetoDrawTwist({ week: WEEK(rules), ...FIELD, rng });
        expect(out, 'the twist declined a field it could legally change').toBeTruthy();
        for (const byRight of ['Bowie', 'Chase', 'Ripper']) {
          expect(out.players, `${byRight} lost a seat they play by right`).toContain(byRight);
        }
        // And the field never grows or shrinks — it is a redraw, not an
        // invitation. Six seats in, six seats out.
        expect(out.players).toHaveLength(FIELD.players.length);
        expect(new Set(out.players).size, 'somebody is standing there twice')
          .toBe(out.players.length);
      }
    }
  });

  it('swaps exactly one seat when it is a replacement', () => {
    const rng = (() => { let s = 99; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
    const out = applyVetoDrawTwist({ week: WEEK({ vetoReplace: 1 }), ...FIELD, rng });
    expect(out.act.kind).toBe('replace');
    expect(out.act.lost).toHaveLength(1);
    expect(out.act.gained).toHaveLength(1);
    // Out of the field, and in from the bench.
    expect(FIELD.players).toContain(out.act.lost[0]);
    expect(FIELD.players).not.toContain(out.act.gained[0]);
    expect(out.players).not.toContain(out.act.lost[0]);
    expect(out.players).toContain(out.act.gained[0]);
  });

  it('declines a field it could not legally change', () => {
    // Nobody on the bench: every houseguest is already standing in the
    // competition, so there is no redraw to perform and no replacement to
    // make. A ceremony that changes nothing must not be put on screen.
    const full = { house: ['Bowie', 'Chase', 'Ripper', 'Scary'], hoh: 'Bowie',
      nominees: ['Chase', 'Ripper'], players: ['Bowie', 'Chase', 'Ripper', 'Scary'] };
    expect(applyVetoDrawTwist({ week: WEEK({ vetoRedraw: true }), ...full })).toBeNull();
    expect(applyVetoDrawTwist({ week: WEEK({ vetoReplace: 1 }), ...full })).toBeNull();
    // And an ordinary week is left completely alone.
    expect(applyVetoDrawTwist({ week: WEEK({}), ...FIELD })).toBeNull();
  });

  it('puts a real field on the board in a real season', () => {
    let found = null;
    for (const twist of ['bb-veto-redraw', 'bb-veto-replacement']) {
      for (const seed of [7, 19, 31, 44]) {
        for (const ep of play(twist, 3, seed)) {
          const act = actOf(ep, 'veto-draw-twist');
          if (act) { found = { twist, ep, act }; break; }
        }
        if (found) break;
      }
      expect(found, `${twist} never reached the board`).toBeTruthy();
      const { ep, act } = found;
      // Whoever is on the board is who actually played for the veto.
      const week = (gs.bb.weeks || []).find(w => w.num === ep.num);
      const played = week.vetoCompetition?.placements || [];
      for (const name of act.after) {
        expect(played, `${name} was put in the field and did not play`).toContain(name);
      }
      for (const name of act.lost) {
        expect(played, `${name} lost their seat and played anyway`).not.toContain(name);
      }
      found = null;
    }
  });

  it('is in the catalogue and reaches both transcripts', () => {
    for (const id of ['bb-veto-redraw', 'bb-veto-replacement']) {
      expect(TWIST_CATALOG.some(t => t.id === id), `${id} is not in the catalogue`).toBe(true);
      expect(BB_TWIST_CONTRACTS[id], `${id} has no contract`).toBeTruthy();
      expect(BB_TWIST_IDS.has(id), `${id} cannot be scheduled`).toBe(true);
    }
    let ep = null;
    for (const seed of [7, 19, 31, 44]) {
      ep = play('bb-veto-redraw', 3, seed).find(e => actOf(e, 'veto-draw-twist'));
      if (ep) break;
    }
    expect(ep, 'no redraw in four seeds').toBeTruthy();
    const week = (gs.bb.weeks || []).find(w => w.num === ep.num);
    expect(summariseWeek(week)).toMatch(/THE VETO PLAYER REDRAW/);
    expect(generateSummaryText(ep)).toMatch(/THE VETO PLAYER REDRAW/);
  });
});
