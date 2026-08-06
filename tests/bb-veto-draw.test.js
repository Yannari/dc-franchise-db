// The field, not the medallion.
//
// Every other veto twist fires at the ceremony, on an object somebody has
// already won. These two fire between the draw and the competition, and what
// they edit is who is standing there.
//
// They are POWERS, not schedulable weeks, and that is the design decision
// under test. A redraw production simply announces has no agent in it: nobody
// decides, nobody can be blamed, and the narration is reduced to explaining
// that there is nothing to be angry about. With a holder there is a choice,
// and the sharpest use of the replacement is entirely self-serving — take out
// whoever is most likely to spend the veto against you and sit in their seat.
//
// The rule nothing may break: the Head of Household and the nominees play by
// RIGHT. No twist in the format's history has taken that away.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { simulateBBEpisode, BB_TWIST_IDS } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { withSeededRandom } from './helpers/rng.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { BB_POWER_DEFINITIONS, grantPower } from '../js/bb/powers.js';
import { applyVetoDrawTwist, resolveVetoDrawRules } from '../js/bb/veto-draw.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7 });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null, powers: [] };
}

const WEEK = { num: 3 };
// Zee is on the bench and holds the power. Scary is drawn in AND close to a
// nominee, which makes her the obvious name to take out.
const FIELD = { house: NAMES, hoh: 'Bowie', nominees: ['Chase', 'Ripper'],
  players: ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel'] };
const rngFrom = seed => { let s = seed; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

describe('the veto draw powers', () => {
  beforeEach(house);

  it('is a power, not a week somebody schedules', () => {
    // The whole point of the rework. A field twist with no holder is a coin
    // flip with a name, so neither may be offerable as a week card.
    for (const id of ['bb-veto-redraw', 'bb-veto-replacement']) {
      expect(TWIST_CATALOG.some(t => t.id === id), `${id} is on the week-card shelf`).toBe(false);
      expect(BB_TWIST_CONTRACTS[id], `${id} still has a twist contract`).toBeUndefined();
      expect(BB_TWIST_IDS.has(id), `${id} can still be scheduled`).toBe(false);
    }
    for (const id of ['veto-redraw', 'veto-replacement']) {
      expect(BB_POWER_DEFINITIONS[id], `${id} is not in the power inventory`).toBeTruthy();
      expect(BB_POWER_DEFINITIONS[id].useTiming).toBe('veto-draw');
    }
  });

  it('reads the power off the store, by name', () => {
    expect(resolveVetoDrawRules(WEEK)).toMatchObject({ redraw: false, replace: 0, holder: null });
    grantPower('veto-replacement', 'Zee', { week: 3, source: 'test' });
    const spec = resolveVetoDrawRules(WEEK);
    expect(spec.replace).toBe(1);
    expect(spec.holder).toBe('Zee');
  });

  it('puts the holder into the competition, which is the point of holding it', () => {
    grantPower('veto-replacement', 'Zee', { week: 3, source: 'test' });
    const out = applyVetoDrawTwist({ week: WEEK, ...FIELD, rng: rngFrom(5) });
    expect(out).toBeTruthy();
    expect(out.act.kind).toBe('replace');
    // Zee was on the bench, so Zee takes the seat.
    expect(out.act.gained).toEqual(['Zee']);
    expect(out.act.selfSeat).toBe(true);
    expect(out.players).toContain('Zee');
    expect(out.players).not.toContain(out.act.lost[0]);
    // And the person it was done to knows exactly who did it.
    expect(getBond(out.act.lost[0], 'Zee')).toBeLessThan(0);
  });

  it('takes out whoever was most dangerous to the holder, not a random seat', () => {
    // Nichelle is close to a nominee — she would spend the veto on the block,
    // which is the thing the holder cannot allow.
    addBond('Nichelle', 'Chase', 8);
    addBond('Scary', 'Zee', 6);
    grantPower('veto-replacement', 'Zee', { week: 3, source: 'test' });
    const out = applyVetoDrawTwist({ week: WEEK, ...FIELD, rng: rngFrom(9) });
    expect(out.act.lost, 'the holder removed somebody harmless and left the threat in')
      .toEqual(['Nichelle']);
  });

  it('never touches a seat somebody holds by right', () => {
    for (const power of ['veto-replacement', 'veto-redraw']) {
      for (let i = 0; i < 30; i++) {
        house();
        // A field the holder hates, so the redraw always fires.
        addBond('Scary', 'Chase', 9); addBond('Nichelle', 'Chase', 8); addBond('Axel', 'Ripper', 8);
        grantPower(power, 'Zee', { week: 3, source: 'test' });
        const out = applyVetoDrawTwist({ week: WEEK, ...FIELD, rng: rngFrom(i * 7717 + 3) });
        if (!out) continue;
        for (const byRight of ['Bowie', 'Chase', 'Ripper']) {
          expect(out.players, `${byRight} lost a seat they play by right`).toContain(byRight);
        }
        expect(out.players).toHaveLength(FIELD.players.length);
        expect(new Set(out.players).size, 'somebody is standing there twice')
          .toBe(out.players.length);
      }
    }
  });

  it('leaves a field the holder is happy with alone, and keeps the power', () => {
    // A redraw is a gamble, not a reflex: every drawn player is the holder's
    // friend here, so spending it could only make the week worse.
    for (const n of ['Scary', 'Nichelle', 'Axel']) addBond('Zee', n, 9);
    const inst = grantPower('veto-redraw', 'Zee', { week: 3, source: 'test' });
    expect(applyVetoDrawTwist({ week: WEEK, ...FIELD, rng: rngFrom(11) })).toBeNull();
    expect(inst.used, 'a power was spent on a field its holder liked').toBe(false);
  });

  it('declines a field it could not legally change', () => {
    grantPower('veto-replacement', 'Bowie', { week: 3, source: 'test' });
    // Nobody on the bench: everybody is already standing in the competition.
    const full = { house: ['Bowie', 'Chase', 'Ripper', 'Scary'], hoh: 'Bowie',
      nominees: ['Chase', 'Ripper'], players: ['Bowie', 'Chase', 'Ripper', 'Scary'] };
    expect(applyVetoDrawTwist({ week: WEEK, ...full })).toBeNull();
  });

  // A power nothing hands out is a power nobody meets. Both of these are
  // stocked from BB_POWER_DEFINITIONS, so every distributor that reads the
  // inventory — the App Store, Pandora's Box, the Den, the hidden search —
  // can deal them with no new wiring. This proves one route end to end, and
  // proves the screen lands in the right place once it does.
  it('reaches a real season through a distributor, in the right order', () => {
    let found = null;
    for (const seed of [7, 19, 31, 44, 58, 71]) {
      seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
        ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
      Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
        bbHaveNots: 'off', bbSafetyMode: 'off' });
      seasonConfig.twistSchedule = [1, 2, 3, 4].map(episode =>
        ({ episode, type: 'bb-app-store', shelf: 'veto-replacement' }));
      for (let w = 0; w < 4; w++) {
        const ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode());
        if (!ep) break;
        const veto = (ep.acts || []).find(a => a.type === 'veto' && a.drawTwist);
        if (veto) { found = { ep, veto }; break; }
      }
      if (found) break;
    }
    expect(found, 'no distributor ever dealt a veto-draw power in six seasons').toBeTruthy();
    const { ep, veto } = found;
    // Whoever ended up in the field is who actually played.
    for (const name of veto.drawTwist.after) expect(veto.participants).toContain(name);
    for (const name of veto.drawTwist.lost) expect(veto.participants).not.toContain(name);
    // ── the order ──
    //
    // As its own act this sorted AHEAD of the draw, and every transcript
    // showed a field being rewritten before it had been drawn. The draw, the
    // rewrite and the competition are one act now, in that order.
    const text = generateSummaryText(ep);
    const iDraw = text.indexOf('Played by:');
    const iTwist = text.search(/THE VETO (REDRAW|REPLACEMENT)/);
    const iComp = text.indexOf('wins the Power of Veto');
    expect(iDraw, 'the draw never printed').toBeGreaterThan(-1);
    expect(iTwist, 'the rewrite never reached the transcript').toBeGreaterThan(iDraw);
    expect(iComp, 'the competition resolved before the field was rewritten').toBeGreaterThan(iTwist);
    // Every beat the engine wrote has to be readable, not just the headline.
    for (const b of veto.drawTwist.beats) {
      expect(text, `a beat never reached the transcript: ${b.badgeText}`)
        .toContain(b.text.slice(0, 60));
    }
  });

  it('says what is happening, in words that do not need the code open', () => {
    grantPower('veto-replacement', 'Zee', { week: 3, source: 'test' });
    const out = applyVetoDrawTwist({ week: WEEK, ...FIELD, rng: rngFrom(5) });
    const opening = out.act.beats[0].text;
    // The first sentence has to establish the rule the twist bends. Without
    // it the reader is told "the field as it stood" and has to guess.
    expect(opening).toMatch(/[Ss]ix houseguests play for the Power of Veto/);
    expect(opening).toContain('Bowie');            // named as the HOH
    expect(opening).toMatch(/Chase and Ripper/);   // named as the nominees
    expect(opening).toMatch(/drawn out of a bag/);
    // And no beat may leave a pronoun or a name unresolved.
    for (const b of out.act.beats) {
      expect(b.text).not.toMatch(/undefined|\[object|null/);
      expect(b.players.length, 'a beat with no cast').toBeGreaterThan(0);
      expect(new Set(b.players).size, `${b.badgeText} casts somebody twice`).toBe(b.players.length);
    }
  });
});
