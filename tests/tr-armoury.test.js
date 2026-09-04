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
import { rpBuildArmoury } from '../js/vp-tr/armoury.js';
import { TRAITORS_SCREENS } from '../js/vp-tr/screens.js';
import { generateTraitorsSummaryText } from '../js/text-backlog.js';
import { armouryBlockEvidence } from '../js/tr/armoury.js';
import { recordFact, resetKnowledge } from '../js/knowledge.js';
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

// ── THE SCREEN ────────────────────────────────────────────────────────
//
// The Armoury VP has one job the rest of the screens do not: it must show the
// group and refuse the outcome, to the right eyes, in BOTH the rendered page
// and the transcript. Text is searchable, so a backlog that leaked the holder
// would be worse than a page that did — both arms are asserted.
/**
 * THE PAGE WITHOUT ITS STYLESHEET.
 *
 * The screen carries ~7KB of CSS, and that CSS contains the very selectors the
 * secrecy arms search for — `.am-turn-out[data-f="1"]` is a rule as well as a
 * badge. Asserting over the raw string therefore matched the stylesheet and
 * reported a leak that was not on the page (and counted every find twice). Same
 * reason tr-vp.test.js strips `<style>` before reading a screen.
 */
const body = html => String(html || '').replace(/<style[\s\S]*?<\/style>/gi, ' ');

describe('the Armoury screen shows the room and withholds the door', () => {
  it('is registered right after the mission, and only on a night that ran one', () => {
    const g = season(5);
    const row = (g.episodeHistory || []).find(e => e.tr?.armoury);
    expect(row, 'no armoury night to test').toBeTruthy();
    const ids = TRAITORS_SCREENS.filter(s => s.when(row)).map(s => s.id);
    expect(ids).toContain('tr-armoury');
    expect(ids.indexOf('tr-armoury'), 'the Armoury does not follow the mission')
      .toBe(ids.indexOf('tr-mission') + 1);
    // A night with no Armoury must not get the screen.
    const plain = (g.episodeHistory || []).find(e => e.tr && !e.tr.armoury);
    if (plain) {
      expect(TRAITORS_SCREENS.find(s => s.id === 'tr-armoury').when(plain)).toBeFalsy();
    }
  });

  it('carries its stylesheet on EVERY build, not just the first', () => {
    // The visual player swaps screens by replacing innerHTML, so the <style>
    // block leaves the document with the screen that carried it. A once-per-
    // process latch therefore styled the first Armoury of a session and left
    // every later one — and every re-render of the same one — as raw markup:
    // the scenery SVG at natural size, every step visible at once. Shipped
    // exactly that once; this is the arm that says so.
    const g = season(8);
    const rows = (g.episodeHistory || []).filter(e => e.tr?.armoury);
    expect(rows.length, 'need more than one armoury night to test this')
      .toBeGreaterThan(1);
    for (const r of rows) {
      expect(rpBuildArmoury(r, 'audience'), `ep ${r.num} rendered with no stylesheet`)
        .toMatch(/<style>/);
    }
    // ...and the same night built twice still carries it the second time.
    const twice = rpBuildArmoury(rows[0], 'audience');
    expect(twice, 're-rendering the same night dropped the stylesheet')
      .toMatch(/<style>/);
  });

  it('gives every entrant a different door', () => {
    const g = season(5);
    const row = (g.episodeHistory || []).find(e => e.tr?.armoury);
    const html = body(rpBuildArmoury(row, 'audience'));
    const nums = [...html.matchAll(/opens door ([IVX]+)</g)].map(m => m[1]);
    expect(nums.length, 'no doors were rendered').toBe(row.tr.armoury.entrants.length);
    expect(new Set(nums).size, 'two entrants opened the same door: ' + nums.join(','))
      .toBe(nums.length);
  });

  it('shows a Faithful the queue and never the find — page and transcript', () => {
    const g = season(5);
    const row = (g.episodeHistory || []).find(e => e.tr?.armoury);
    const a = row.tr.armoury;
    const outsider = (row.tr.living || []).find(n => !a.entrants.includes(n));
    expect(outsider, 'everybody was in the armoury').toBeTruthy();

    const page = body(rpBuildArmoury(row, 'player:' + outsider));
    // The public half: the names went up in front of the castle.
    for (const n of a.entrants) expect(page, 'an entrant is missing').toContain(n);
    // The secret half. The find is rendered as a shield badge and an audience
    // strip; neither may exist for somebody who was not in the room.
    expect(page, 'a Faithful was shown a find').not.toMatch(/data-f="1"/);
    expect(page, 'a Faithful was shown the audience strip').not.toMatch(/You only/);

    const text = generateTraitorsSummaryText(row, 'player:' + outsider);
    expect(text, 'the transcript leaked the holder to a Faithful')
      .not.toMatch(/opened the loaded door|cannot be murdered tonight/);

    // ...and the audience does get it, or this arm proves nothing.
    const aud = generateTraitorsSummaryText(row, 'audience');
    expect(aud).toMatch(/cannot be murdered tonight/);
  });

  it('tells the holder about their own door and nobody else’s', () => {
    const g = season(5);
    const row = (g.episodeHistory || []).find(e => e.tr?.armoury);
    const a = row.tr.armoury;
    const page = body(rpBuildArmoury(row, 'player:' + a.holders[0]));
    expect(page, 'the holder was not shown their own find').toMatch(/data-f="1"/);
    // Exactly one find is visible to them — their own, never a second holder's.
    expect((page.match(/data-f="1"/g) || []).length).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE ROOM'S READ ON A NIGHT THE SHIELD HELD
// ══════════════════════════════════════════════════════════════════════
//
// MEASURED BEFORE IT WAS BUILT: across 120 Armoury seasons the castle blocked
// 16 murders and formed ZERO beliefs from any of them. Every channel that
// reads a night reads a BODY — `murderEvidence` suppresses itself on a blocked
// night, `variantEvidence` returns early with a comment saying so, and
// `shieldEvidence` runs off the witness list, which an Armoury shield leaves
// empty on purpose because nobody is told who won. Three channels, each right
// on its own terms, and between them the format's strongest night was silent.
//
// `armouryBlockEvidence` is the one read the room can actually run: WHO WENT
// IN IS PUBLIC, so a full table on that night says the Traitors spent the
// night on one of those four.
//
// It incriminates the PUSHERS and not the entrants, and that is not a
// preference — a targeted entrant is Faithful, and `learn` has no way to say
// "this person looks innocent". See the header note in js/tr/armoury.js.
describe('a blocked Armoury night is not dead air', () => {
  it('costs nothing — no beliefs, no rng — on a night that was not one', () => {
    // THE ARM THAT PROTECTS EVERY STORED SEASON. The channel runs on the
    // missions' stream; a draw taken on an ordinary night would displace every
    // mission roll after it.
    seasonConfig.trShieldSource = 'mission';
    setPlayers(ROSTER);
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 4 });
    let calls = 0;
    const rng = () => { calls++; return 0.5; };
    for (let ep = 1; ep <= 8; ep++) {
      expect(armouryBlockEvidence(ep, rng),
        `ep ${ep} formed beliefs on a season with no Armoury`).toEqual([]);
    }
    expect(calls, 'the channel drew from the rng on a night it does nothing').toBe(0);
  });

  // ── WHY THIS IS TWO ARMS AND NOT ONE END-TO-END ONE ────────────────
  //
  // Two attempts at a single "play seasons and check what happened" arm both
  // failed for reasons worth keeping, because each was the guard measuring the
  // wrong thing rather than the code being wrong:
  //
  //   1. RE-RUNNING THE CHANNEL after the season does not reproduce the night.
  //      It reads live `gs.activePlayers`, and by the finale almost every
  //      pusher and entrant has been banished or murdered, so it correctly
  //      declines to speak about any of them. The arm reported "no block in 60
  //      seasons reached the channel" about a channel that had fired.
  //   2. READING THE BELIEF STORE at the end does not find them either.
  //      `pruneStale` drops a fact roughly six episodes after it is created
  //      (js/knowledge.js), so a belief formed on night 5 of a twelve-night
  //      season is gone before the season is.
  //
  // So the behaviour is asserted directly on a constructed night, and
  // REACHABILITY -- that real seasons produce such nights at all -- is
  // asserted separately. Neither half is worth much alone: the first without
  // the second is the written-but-unreachable shape this project keeps
  // shipping, and the second without the first proves only that a rare thing
  // happens.
  it('blames the people who pushed an entrant, never the shield holder', () => {
    setPlayers(ROSTER.map(p => ({ ...p })));
    const cast = CAST.slice(0, 8);
    const [holder, other, pusher, bystander] = cast;
    resetKnowledge();
    gs.activePlayers = [...cast];
    for (const n of cast) recordFact({ type: 'alignment', subject: n, truth: false, ep: 1 });
    gs.tr = Object.assign(gs.tr || {}, {
      blockedMurders: [{ ep: 3, target: holder }],
      shields: [{ ep: 3, holder, via: 'armoury', witnesses: [], visibility: 'secret' }],
      armouries: [{ ep: 3, via: 'armoury', entrants: [holder, other, cast[4], cast[5]],
        holders: [holder], count: 1 }],
      rounds: [{ ep: 3,
        accusations: [{ accuser: pusher, target: holder }],
        ballots: [{ channel: 'banishment', voter: pusher, voted: holder }] }],
    });
    // AN ACCEPTING DRAW, ON PURPOSE. `learn` rolls for acceptance against the
    // belief's credibility, and this channel is deliberately cheap — pushing
    // one of four entrants is a quarter of the case, so it prices at 0.155 and
    // is REFUSED by most of the room most of the time. A 0.5 draw here made
    // the arm report silence from a channel that was working exactly as
    // designed. What is under test is who gets blamed, not how often.
    const formed = armouryBlockEvidence(3, () => 0);
    expect(formed.length, 'the channel said nothing about a night built to make it speak')
      .toBeGreaterThan(0);
    const subjects = new Set(formed.map(f => f.subject));
    expect([...subjects], 'somebody other than the pusher was blamed').toEqual([pusher]);
    expect(subjects.has(holder), 'the holder was blamed for having been protected')
      .toBe(false);
    for (const f of formed) {
      expect(f.observer, 'a player formed this belief about themselves').not.toBe(f.subject);
      expect(gs.activePlayers).toContain(f.observer);
    }
    // The whole castle runs this read — that is the difference from the
    // witness-gated mission channel, and it is the point of the Armoury being
    // public about WHO WENT IN.
    expect(new Set(formed.map(f => f.observer)).size).toBeGreaterThan(2);
    expect(formed.every(f => f.observer !== bystander)).toBe(false);
  });

  it('and real seasons actually reach that night', () => {
    let blocks = 0, withEntrants = 0;
    for (let seed = 1; seed <= 60; seed++) {
      seasonConfig.trShieldSource = 'armoury';
      seasonConfig.trArmourySize = 4;
      setPlayers(ROSTER.map(p => ({ ...p })));
      playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
      const tr = gs.tr || {};
      for (const b of (tr.blockedMurders || [])) {
        const sh = (tr.shields || []).find(x => x.ep === b.ep && x.holder === b.target
          && x.via === 'armoury');
        if (!sh) continue;
        blocks++;
        const rec = (tr.armouries || []).find(a => a.ep === b.ep);
        if (rec && (rec.entrants || []).length >= 2
          && (tr.rounds || []).some(r => r.ep === b.ep)) withEntrants++;
      }
    }
    expect(blocks, 'no Armoury shield blocked a murder in 60 seasons').toBeGreaterThan(0);
    expect(withEntrants, 'blocks happen but never with the entrant list and table the '
      + 'channel needs — it would be unreachable in a real season').toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE ARMOURY SCREEN HAS TO BE TRUE ABOUT ITS OWN NIGHT
// ══════════════════════════════════════════════════════════════════════
//
// Five defects, all found by rendering the screen as plain text and reading
// it. Four were reported from the finished product; the fifth came out of the
// same read.
const _armouryHtml = (ep, obs = 'audience') => stripTags(rpBuildArmoury(ep, obs));

/** Rendered text with the stylesheet and markup gone — what a viewer reads. */
function stripTags(html) {
  return String(html)
    .replace(/<style>[\s\S]*?<\/style>/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&rsquo;/g, '\u2019').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
}

/** Every episode across a sweep that actually opened the Armoury. */
function armouryEpisodes(seeds = [1, 2, 3, 4, 5, 6, 7, 8]) {
  const out = [];
  for (const seed of seeds) {
    seasonConfig.trShieldSource = 'armoury';
    seasonConfig.trArmourySize = 4;
    setPlayers(ROSTER.map(p => ({ ...p })));
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
    for (const row of (gs.episodeHistory || [])) {
      if (row.tr && row.tr.armoury && (row.tr.armoury.entrants || []).length) {
        out.push({ ...row });
      }
    }
  }
  return out;
}

describe('the Armoury screen says true things about its own night', () => {
  const EPS = armouryEpisodes();

  it('reached enough Armoury nights to be worth asserting on', () => {
    expect(EPS.length).toBeGreaterThan(20);
  });

  // 1. GRAMMAR. `{They} pick door {n}` was written for they/them and is filled
  //    with a gendered pronoun for most of the cast, producing "He pick door X"
  //    and "She pick door XI".
  it('conjugates its verbs for a gendered pronoun', () => {
    const BAD = /\b(He|She|he|she)\s+(pick|come|walk|go|open|take|choose|stand|count|pull|close|say)\b/;
    for (const ep of EPS) {
      const t = _armouryHtml(ep);
      const hit = t.match(BAD);
      expect(hit, `ep ${ep.num}: "${hit && hit[0]}" — singular subject, plural verb`).toBe(null);
    }
  });

  // 2 & 3. THE CONTRADICTION. The turn cards announce a Shield behind a door
  //    and the closing card then says every entrant came back empty-handed.
  //    Both are on the same screen, four cards apart.
  it('never says everybody found nothing on a night somebody found something', () => {
    let withFind = 0;
    for (const ep of EPS) {
      const holders = ep.tr.armoury.holders || [];
      if (!holders.length) continue;
      withFind++;
      const t = _armouryHtml(ep);
      expect(/hands empty/i.test(t),
        `ep ${ep.num}: ${holders.join(', ')} found a shield and the screen says hands empty`)
        .toBe(false);
      expect(/came back .*with nothing|all .* found nothing/i.test(t),
        `ep ${ep.num}: the screen says nobody found anything`).toBe(false);
    }
    expect(withFind, 'no Armoury night in the sweep produced a shield').toBeGreaterThan(5);
  });

  // 4. THE RULE. The entrants are NOT protected. The Traitors may target any of
  //    them; the risk is that the murder is wasted on the one who is holding it.
  it('does not claim the entrants are untouchable', () => {
    const WRONG = /cannot touch|can ?not be touched|out of reach|untouchable|off limits/i;
    for (const ep of EPS) {
      const t = _armouryHtml(ep);
      const hit = t.match(WRONG);
      expect(hit, `ep ${ep.num}: "${hit && hit[0]}" — the pact may target any entrant`)
        .toBe(null);
    }
  });

  // 5. THE ONE THAT WAS NOT REPORTED. "neither will the Traitors" is false on
  //    a night a Traitor walked into the Armoury and opened the loaded door —
  //    which is exactly the case `armouryHesitation` already handles by
  //    returning 0 for a `pactAware` room.
  it('does not tell the audience the Traitors are in the dark when they are not', () => {
    let aware = 0;
    for (const ep of EPS) {
      if (!ep.tr.armoury.pactAware) continue;
      aware++;
      const t = _armouryHtml(ep);
      expect(/neither will the Traitors|nor will the Traitors|the Traitors will not be told/i.test(t),
        `ep ${ep.num}: a Traitor is holding this shield and the screen says the pact does not know`)
        .toBe(false);
    }
    expect(aware, 'no pact-aware Armoury night in the sweep').toBeGreaterThan(0);
  });

  // 7. NO LINE TWICE ON ONE WALL. The turn pools are drawn once per entrant
  //    from pools of four and six, and a hash keyed on the name cannot see
  //    what the name above it drew: a real night gave three of the four
  //    entrants the same closing sentence, stacked one under the other.
  it('does not give two entrants the same sentence on the same night', () => {
    for (const ep of EPS) {
      const t = _armouryHtml(ep);
      // The two lines that are drawn per entrant, reduced to a fingerprint so
      // the check does not depend on which names were filled into them.
      for (const frag of ['gives the room no help whatever', 'face doing nothing at all',
        'closes the door on it and says nothing', 'only sound in it is the iron',
        'without breaking step', 'puts a hand flat on the oak',
        'longer than the wall deserves', 'settled on hours ago',
        'walks the length of the rack first']) {
        const n = t.split(frag).length - 1;
        expect(n, `ep ${ep.num}: "${frag}" appears ${n} times on one wall`)
          .toBeLessThanOrEqual(1);
      }
    }
  });

  // 6. OBSERVER SAFETY, extended from tests/tr-host-explanations.test.js: the
  //    rule that a branch which never receives a fact cannot leak it.
  it('never names the holder to a player who is not the holder', () => {
    let checked = 0;
    for (const ep of EPS.slice(0, 12)) {
      const holders = ep.tr.armoury.holders || [];
      if (!holders.length) continue;
      for (const who of (ep.tr.living || []).slice(0, 6)) {
        if (holders.includes(who)) continue;
        const t = _armouryHtml(ep, 'player:' + who);
        checked++;
        for (const h of holders) {
          expect(new RegExp(h + '\s+(opened the loaded|is safe|cannot be murdered)', 'i').test(t),
            `${who} was told ${h} holds the shield`).toBe(false);
        }
        expect(/opened the loaded door/i.test(t),
          `${who} was shown the audience-only result line`).toBe(false);
        // THE HARDEST ONE ON THIS SCREEN. "one of the people who went up is a
        // Traitor" narrows the pact to a NAMED, PUBLIC four-person group,
        // which is a bigger gift than the holder's identity. Audience only.
        expect(/is a Traitor, so tonight the pact is not guessing/i.test(t),
          `${who} was told a Traitor is in the Armoury group`).toBe(false);
      }
    }
    expect(checked, 'no player view was checked').toBeGreaterThan(10);
  });
});
