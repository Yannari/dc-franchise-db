// ══════════════════════════════════════════════════════════════════════
// tests/tr-armoury.test.js — the room, and the one thing it must never leak
// ══════════════════════════════════════════════════════════════════════
//
// The Armoury exists for a knowledge asymmetry and nothing else:
//
//   WHO WENT IN   is public. The castle watched them earn it.
//   WHO CAME OUT  is secret. Nobody is told, so the Traitors have to hesitate
//                 over the whole group or risk wasting a night.
//
// Every arm below is about that sentence. If a future edit hands a Faithful the
// holder's name the room stops being worth entering, and if the pact stops
// hesitating the room stops being worth building — so both directions are
// asserted, and the hesitation is measured against CHANCE rather than against
// zero, because "they avoided the group" is only a claim if you say what the
// group's share of the murders would have been anyway.
//
// Deliberately NOT in vitest.slow.js: it plays short seasons and one 20-season
// sweep, which is seconds rather than minutes. See that file for the rule.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setPlayers, seasonConfig } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { rpBuildHouseStatus } from '../js/vp-tr/house-status.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

/** One season under a named Shield regime. */
function season(seed, cfg = {}) {
  setPlayers(ROSTER.map(p => ({ ...p })));
  Object.assign(seasonConfig, {
    trShieldSource: 'armoury', trArmourySize: 4, trShieldCount: 1, ...cfg,
  });
  playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
  return gs;
}

beforeEach(() => {
  seasonConfig.trShieldSource = 'armoury';
  seasonConfig.trArmourySize = 4;
  seasonConfig.trShieldCount = 1;
});

describe('the Armoury only exists when the author asked for it', () => {
  it('runs under "armoury", never under "mission" or "off"', () => {
    const armoury = season(5).tr;
    expect(armoury.armouries?.length, 'armoury mode ran no Armoury at all')
      .toBeGreaterThan(0);

    // SEVERAL SEASONS FOR THE MISSION ARM, because that route awards about one
    // Shield a season (the Reliquary has to be drawn AND the searcher has to
    // find it), so a single seed legitimately produces none and a one-season
    // assertion would be measuring the draw rather than the wiring.
    let missionShields = 0;
    for (const seed of [1, 3, 5, 8, 11]) {
      const tr = season(seed, { trShieldSource: 'mission' }).tr;
      expect(tr.armouries || [], 'an Armoury ran while Shields came from missions')
        .toHaveLength(0);
      missionShields += (tr.shields || []).length;
    }
    expect(missionShields, 'mission mode stopped awarding Shields altogether')
      .toBeGreaterThan(0);

    const off = season(5, { trShieldSource: 'off' }).tr;
    expect(off.armouries || [], 'an Armoury ran with Shields switched off').toHaveLength(0);
    expect(off.shields || [], 'a Shield was awarded with Shields switched off').toHaveLength(0);
  });

  it('only opens after an afternoon the castle actually won', () => {
    // The wiki's own condition: some days nobody meets it. Anything below
    // `solid` must leave the room shut — it is also the balance, since opening
    // every afternoon put a Shield in the castle every single night.
    let checked = 0;
    for (const seed of [3, 5, 9, 14]) {
      const tr = season(seed).tr;
      for (const a of tr.armouries || []) {
        const m = (tr.missions || []).find(x => x.ep === a.ep);
        expect(['triumph', 'solid'], `ep ${a.ep} opened the Armoury on a ${m?.tier} mission`)
          .toContain(m?.tier);
        checked++;
      }
    }
    expect(checked, 'no Armoury was examined, so this arm asserted nothing')
      .toBeGreaterThan(3);
  });
});

describe('the record itself', () => {
  it('hides the holder inside a group that really contains them', () => {
    let checked = 0;
    for (const seed of [1, 5, 11, 20]) {
      const tr = season(seed).tr;
      for (const a of tr.armouries || []) {
        // A group of two and one Shield is a coin toss, not a hiding place.
        expect(a.entrants.length, 'the group is too small to hide anybody in')
          .toBeGreaterThanOrEqual(3);
        expect(a.holders.length).toBe(a.count);
        for (const h of a.holders) {
          expect(a.entrants, 'a Shield went to somebody who never went in').toContain(h);
        }
        // THE SHIELD LEDGER ENTRY, and the one field that makes it different
        // from a Shield won in the open: nobody saw it.
        const s = (tr.shields || []).find(x => x.ep === a.ep && x.holder === a.holders[0]);
        expect(s, 'the Armoury awarded no Shield onto the ledger').toBeTruthy();
        expect(s.via).toBe('armoury');
        expect(s.witnesses, 'an Armoury Shield recorded a witness — it is meant to be unseen')
          .toEqual([]);
        checked++;
      }
    }
    expect(checked, 'no Armoury was examined').toBeGreaterThan(3);
  });

  it('honours the double-shield twist', () => {
    const tr = season(5, { trShieldCount: 2, trArmourySize: 5 }).tr;
    const a = (tr.armouries || [])[0];
    expect(a, 'no Armoury ran').toBeTruthy();
    expect(a.count).toBe(2);
    expect(new Set(a.holders).size, 'the same player opened both loaded boxes').toBe(2);
  });
});

describe('what each pair of eyes is allowed to know', () => {
  it('shows a Faithful the group and never the holder', () => {
    let checked = 0;
    for (const seed of [5, 11]) {
      const g = season(seed);
      const row = (g.episodeHistory || []).find(e => e.tr?.armoury);
      if (!row) continue;
      const a = row.tr.armoury;
      const outsider = (row.tr.living || []).find(n => !a.entrants.includes(n));
      const asOutsider = rpBuildHouseStatus(row, 'player:' + outsider);

      // The public half: the names that walked in.
      expect(asOutsider, 'the castle was not told who went into the Armoury')
        .toMatch(/is carrying it/);
      for (const n of a.entrants) expect(asOutsider).toContain(n);

      // The secret half. Checked on the DATA ATTRIBUTE rather than by grepping
      // the page for the name — a holder who is still standing is on the roll
      // for perfectly public reasons, which is the trap this file's neighbour
      // (tr-vp) documents.
      for (const h of a.holders) {
        expect(asOutsider, 'a Faithful was handed the Armoury holder')
          .not.toContain('data-holder="' + h + '"');
      }
      // And the holder knows their own.
      const asHolder = rpBuildHouseStatus(row, 'player:' + a.holders[0]);
      expect(asHolder, 'the holder was not told they are holding it')
        .toContain('data-holder="' + a.holders[0] + '"');
      checked++;
    }
    expect(checked, 'no season produced an Armoury to read').toBeGreaterThan(0);
  });
});

describe('the hesitation it buys', () => {
  it('makes the Traitors avoid the whole group, measured against chance', () => {
    // The claim is comparative, so the control is explicit: on a night an
    // Armoury ran, how often did the murder land on an entrant, against the
    // entrants' share of the living room. Avoiding the group means the first
    // number is meaningfully below the second.
    let hits = 0, nights = 0, expected = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const tr = season(seed).tr;
      for (const a of tr.armouries || []) {
        const r = (tr.rounds || []).find(x => x.ep === a.ep);
        if (!r || !r.murdered) continue;
        // The room the pact was choosing from, as it stood that night.
        const living = (tr.rounds || []).find(x => x.ep === a.ep)?.ballots?.length
          ? new Set((r.ballots || []).map(b => b.voter)) : null;
        const roomSize = living ? living.size : 0;
        if (roomSize < 5) continue;
        nights++;
        if (a.entrants.includes(r.murdered)) hits++;
        expected += a.entrants.length / roomSize;
      }
    }
    expect(nights, 'no armoury night had a murder to measure').toBeGreaterThan(20);
    const rate = hits / nights;
    const chance = expected / nights;
    expect(rate, `the pact showed no hesitation: hit ${(rate * 100).toFixed(0)}% of `
      + `entrants against ${(chance * 100).toFixed(0)}% by chance`)
      .toBeLessThan(chance - 0.05);
  });
});
