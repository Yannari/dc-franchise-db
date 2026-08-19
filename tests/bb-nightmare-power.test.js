// The Nightmare Power (BB21 Whacktivity).
//
// The first thing in this engine that can UNDO a ceremony which has already
// happened. Everything else changes what is about to happen; this reaches
// backwards, which is why it needs its own guard.
//
// It was never used on the broadcast — Ovi won it and was evicted still
// holding it — so every rule below the wiki's two sentences is a decision this
// repo made, and these are the assertions that pin those decisions down.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { runNightmarePower, nightmarePull } from '../js/bb/nightmare-power.js';
import { BB_POWER_DEFINITIONS } from '../js/bb/powers.js';
import { BB_THEMES } from '../js/bb/themes.js';
import { rpBuildBBNightmare } from '../js/vp-bb-nightmare.js';
import { grantPower } from '../js/bb/powers.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { NIGHTMARE_EVENTS } from '../js/bb-events/nightmare.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { withSeededRandom } from './helpers/rng.js';
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
}

const lcg = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

describe('the Nightmare Power', () => {
  beforeEach(house);

  it('is on the shelf, with a window and a rule', () => {
    const def = BB_POWER_DEFINITIONS['nightmare-power'];
    expect(def, 'the power is not on the shelf').toBeTruthy();
    expect(def.useTiming).toBe('post-noms');
    // Canon: the first six nomination ceremonies.
    expect(def.windowWeeks).toBe(6);
    expect(def.rules.voidNominations).toBe(true);
  });

  it('names two different people, and the originals cannot go back up', () => {
    // The one phrase in the rule that constrains the second ceremony is "two
    // NEW nominees". A redo that could reseat the same pair would be a no-op
    // in exactly the case somebody would spend it.
    for (let seed = 1; seed <= 20; seed++) {
      house();
      const room = [...gs.activePlayers];
      const hoh = room[0];
      const nominees = [room[1], room[2]];
      const redo = runNightmarePower({
        week: { num: 2 }, house: room, hoh, holder: room[3], nominees,
        rng: lcg(seed * 7919 + 5),
      });
      expect(redo, 'a full house produced no redo').toBeTruthy();
      expect(redo.nominees).toHaveLength(2);
      expect(new Set(redo.nominees).size).toBe(2);
      for (const n of nominees) {
        expect(redo.nominees, `${n} went straight back up`).not.toContain(n);
      }
      // And the Head of Household still cannot sit in their own chair.
      expect(redo.nominees).not.toContain(hoh);
    }
  });

  it('does not make the holder safe', () => {
    // They bought a redo, not immunity. The holder is barred from this night
    // only by being one of the original two, never by holding the power.
    let seatedTheHolder = false;
    for (let seed = 1; seed <= 40; seed++) {
      house();
      const room = [...gs.activePlayers];
      const hoh = room[0];
      const holder = room[5];
      const redo = runNightmarePower({
        week: { num: 2 }, house: room, hoh, holder, nominees: [room[1], room[2]],
        rng: lcg(seed * 3571 + 17),
      });
      if (redo && redo.nominees.includes(holder)) { seatedTheHolder = true; break; }
    }
    expect(seatedTheHolder,
      'the holder was never once seated, so the power quietly protects them').toBe(true);
  });

  it('keeps the ceremony when the house cannot field two fresh names', () => {
    house();
    const room = [...gs.activePlayers].slice(0, 4);
    const redo = runNightmarePower({
      week: { num: 2 }, house: room, hoh: room[0], holder: room[3],
      nominees: [room[1], room[2]], rng: lcg(99),
    });
    // hoh + two nominees out of four leaves one. Not two, so the block stands.
    expect(redo, 'it seated somebody out of a pool of one').toBeNull();
  });

  it('lands the blame on the Head of Household, who did not choose it', () => {
    house();
    const room = [...gs.activePlayers];
    const hoh = room[0];
    const redo = runNightmarePower({
      week: { num: 2 }, house: room, hoh, holder: room[4],
      nominees: [room[1], room[2]], rng: lcg(1234),
    });
    for (const n of redo.nominees) {
      expect(getBond(n, hoh), `${n} did not mind being named at 3am`).toBeLessThan(0);
    }
  });

  it('never names the holder on any surface', () => {
    house();
    const room = [...gs.activePlayers];
    const holder = room[6];
    const redo = runNightmarePower({
      week: { num: 2 }, house: room, hoh: room[0], holder,
      nominees: [room[1], room[2]], rng: lcg(555),
    });
    expect(redo.act.secret).toBe(true);
    // The act stores the holder so the engine can spend the power; no beat may
    // say the name. This is the Coin of Destiny's rule and the same trap.
    const said = (redo.act.beats || []).map(b => b.text).join(' ');
    expect(said, 'a beat named the holder').not.toContain(holder);

    const deps = { tvState: { bb_nm_2: { idx: 99 } }, reveal: () => '',
      esc: s => String(s), avatar: () => '' };
    const html = rpBuildBBNightmare({ num: 2 }, redo.act, deps);
    expect(html, 'no screen at all').toBeTruthy();
    expect(html, 'the viewing party named the holder').not.toContain(`>${holder}<`);
    expect(html).toContain('AND AGAIN');
  });

  it('is spent on a block the holder is sitting on', () => {
    const room = [...gs.activePlayers];
    const holder = room[4];
    const onBlock = nightmarePull(holder, { nominees: [holder, room[2]], weeksLeft: 3 });
    const clear = nightmarePull(holder, { nominees: [room[1], room[2]], weeksLeft: 3 });
    expect(onBlock, 'a holder on the block sat on it').toBeGreaterThan(0.7);
    expect(clear, 'a holder nowhere near the block burned it anyway')
      .toBeLessThan(onBlock);
    // And a power about to expire gets spent rather than carried into the dark.
    const dying = nightmarePull(holder, { nominees: [room[1], room[2]], weeksLeft: 0 });
    expect(dying).toBeGreaterThan(clear);
  });

  it('is what Summer Camp actually puts behind its doors', () => {
    const camp = BB_THEMES['summer-camp'];
    const whack = camp.arc.filter(a => a.book === 'bb-whacktivity');
    expect(whack.length, 'the theme stopped booking Whacktivity').toBeGreaterThan(0);
    for (const entry of whack) {
      expect(entry.options?.doors, 'a Whacktivity booking with no doors named')
        .toContain('nightmare-power');
    }
    // And the primer says what it does, per the guard the other themes carry.
    expect(camp.primer.rules.join('\n')).toMatch(/voids a nomination/i);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE NIGHT PLAYS IN ORDER, AND THE WEEK REMEMBERS IT
// ══════════════════════════════════════════════════════════════════════
describe('the Nightmare Power, played', () => {
  beforeEach(house);

  /** Play seeded episodes with the power pre-granted until it fires. */
  function fired(maxSeeds = 25) {
    for (let seed = 1; seed <= maxSeeds; seed++) {
      house();
      grantPower('nightmare-power', gs.activePlayers[4], { week: 1, visibility: 'secret', source: 'test' });
      for (let e = 0; e < 5; e++) {
        let ep;
        try { ep = withSeededRandom(seed * 61 + e * 13 + 7, () => simulateBBEpisode()); }
        catch { break; }
        if (!ep) break;
        if ((ep.acts || []).some(a => a.type === 'nightmare-power')) {
          return { ep, week: gs.bb.weeks[gs.bb.weeks.length - 1] };
        }
      }
    }
    return null;
  }

  it('shows the ceremony first and the switch second', () => {
    // Reported off a real season: the 3am screen was appearing BEFORE the
    // nomination ceremony it voids, and the ceremony screen showed the
    // already-switched pair — so the original block was never seen at all.
    const played = fired();
    expect(played, 'the power never fired across 25 seeded runs').toBeTruthy();
    const { ep, week } = played;
    const nomIdx = (ep.acts || []).findIndex(a => a.type === 'nominations');
    const nmIdx = (ep.acts || []).findIndex(a => a.type === 'nightmare-power');
    expect(nomIdx, 'no nomination act at all').toBeGreaterThanOrEqual(0);
    expect(nmIdx, 'no nightmare act at all').toBeGreaterThanOrEqual(0);
    expect(nmIdx, 'the 3am wake-up played before the ceremony it voids')
      .toBeGreaterThan(nomIdx);
    // The ceremony act carries the ORIGINAL pair — the block the house went
    // to bed on — and the nightmare act carries the switch.
    const nomAct = ep.acts[nomIdx];
    const nmAct = ep.acts[nmIdx];
    for (const n of nmAct.voided) {
      expect(nomAct.nominees, `${n} was voided but never shown nominated`).toContain(n);
    }
    // And the week ends on the corrected block, not the voided one.
    expect(week.initialNominees.slice().sort()).toEqual([...nmAct.nominees].sort());
  });

  it('leaves a week the house actually reacts to', () => {
    // The act is the night; the family is the morning after. Every event is
    // registered, and at least one fires in the week the power went off —
    // with a real consequence, because a purely cosmetic reaction is the
    // thing this codebase bans.
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of NIGHTMARE_EVENTS) {
      expect(ids.has(e.id), `${e.id} is not registered`).toBe(true);
    }
    const played = fired();
    expect(played, 'the power never fired across 25 seeded runs').toBeTruthy();
    const beats = (played.ep.acts || []).flatMap(a => a.socialBeats || [])
      .filter(b => String(b.eventId || '').startsWith('nightmare-'));
    expect(beats.length, 'the house never once reacted to a voided ceremony')
      .toBeGreaterThan(0);
  });
});
