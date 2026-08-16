// Majority Rules has to be long enough to be a competition.
//
// The rule that makes it interesting is also what kept killing it: the
// majority that decides a round is the majority of the LOCK-INS, so the side
// sent home is always the smaller one, and the field halves on every question.
// Eight houseguests is therefore three questions and a tiebreaker — eight to
// five to three to two — no matter how many superlatives sit in the bank.
// Measured before this: an average of 4.1 questions on a field of eight, and
// seasons that resolved the whole competition in TWO.
//
// The elimination rounds are the second half now. The first is a survey: same
// questions, nobody goes home, everybody marked. So the guard is about depth
// and about the shape of the two halves — the survey must not evict anybody,
// and the sudden death must still obey the real rule.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';
import { rpBuildBBComp, _tvState } from '../js/vp-screens.js';

const ID = 'bb-mental-quiz';
const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Wayne', 'Emmah', 'Chase', 'Scary', 'Nichelle',
  'Axel', 'Zee', 'Brightly', 'Hicks', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater',
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const rngFor = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const boot = () => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null, haveNots: [] };
  gs.popularity = {};
  seasonConfig.romance = 'off';
  NAMES.forEach(n => { gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
    timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 }; });
};

const play = (seed, size = 8) => runBBCompetition({
  type: 'hoh', participants: NAMES.slice(0, size), house: NAMES.slice(0, size),
  library: BB_COMPETITIONS, forcedId: ID, rng: rngFor(seed),
  week: { num: 4, houseAtStart: NAMES.slice(0, size) },
});

const bdOf = r => r.breakdown || r.debug?.scoreBreakdown || {};
const asked = r => Math.max(0, ...Object.values(bdOf(r)).map(x => (x.picks || []).length));

describe('Majority Rules runs long enough to be one', () => {
  beforeEach(boot);

  it('asks a real number of questions, whatever the field', () => {
    for (const size of [6, 8, 12]) {
      const counts = [];
      for (let s = 0; s < 25; s++) { boot(); counts.push(asked(play(s * 41 + 9, size))); }
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
      // Before: 3.6 / 4.1 / 5.1 by field size, with a floor of two.
      expect(Math.min(...counts), `field ${size} ran a ${Math.min(...counts)}-question competition`)
        .toBeGreaterThanOrEqual(5);
      expect(avg, `field ${size} averaged only ${avg.toFixed(1)} questions`).toBeGreaterThan(5.5);
    }
  });

  it('nobody goes home during the survey', () => {
    for (let s = 0; s < 25; s++) {
      boot();
      const r = play(s * 17 + 3);
      const cutAt = r.beats.findIndex(b => (b.badgeText || '') === 'THE CUT');
      if (cutAt < 0) continue;                       // short field: no survey
      const before = r.beats.slice(0, cutAt);
      expect(before.some(b => /^MINORITY/.test(b.badgeText || '')),
        'somebody was eliminated during the scoring half').toBe(false);
      // And the survey is not one question long.
      const surveyQs = before.filter(b => /^ROUND /.test(b.badgeText || '')).length;
      expect(surveyQs, 'the survey was too short to be worth scoring').toBeGreaterThanOrEqual(3);
    }
  });

  it('the cut takes the people who read the room worst', () => {
    for (let s = 0; s < 40; s++) {
      boot();
      const r = play(s * 23 + 5);
      const bd = bdOf(r);
      const cut = Object.entries(bd).filter(([, x]) => x.cutAtSurvey).map(([n]) => n);
      if (!cut.length) continue;
      const kept = Object.entries(bd).filter(([, x]) => !x.cutAtSurvey).map(([n]) => n);
      // Nobody cut may have out-scored somebody kept, at the moment of the cut.
      const worstKept = Math.min(...kept.map(n => bd[n].correct ?? 0));
      const bestCut = Math.max(...cut.map(n => bd[n].correct ?? 0));
      // Kept players keep scoring after the cut, so compare against the floor:
      // a cut player must not have beaten the worst survivor's SURVEY score.
      const surveyScore = n => (bd[n].picks || [])
        .filter(pk => pk.q <= Math.max(...cut.map(c => bd[c].outRound || 0)))
        .filter(pk => pk.right === true).length;
      expect(bestCut, `${cut[0]} was cut with more correct reads than a survivor`)
        .toBeLessThanOrEqual(Math.max(worstKept, ...kept.map(surveyScore)));
      return;
    }
    throw new Error('no cut happened in 40 competitions');
  });

  it('sudden death still sends the minority home', () => {
    for (let s = 0; s < 25; s++) {
      boot();
      const r = play(s * 31 + 11);
      const bd = bdOf(r);
      for (const [name, row] of Object.entries(bd)) {
        if (row.cutAtSurvey || !row.outRound) continue;
        const pick = (row.picks || []).find(pk => pk.q === row.outRound);
        if (!pick || !pick.majority) continue;       // dead-even round, nobody out
        expect(pick.right, `${name} went out on a question they got RIGHT`).toBe(false);
      }
    }
  });

  it('still produces exactly one winner, and everybody is placed', () => {
    for (const size of [3, 6, 8, 12]) {
      boot();
      const r = play(size * 77, size);
      expect(r.placements).toHaveLength(size);
      expect(new Set(r.placements).size).toBe(size);
      expect(r.winner).toBe(r.placements[0]);
      // Every question a houseguest was present for is recorded with its pair,
      // which is what the screen draws the board from.
      for (const row of Object.values(bdOf(r))) {
        (row.picks || []).forEach(pk => {
          expect(Array.isArray(pk.pair) && pk.pair.filter(Boolean).length).toBe(2);
          expect(pk.pair).toContain(pk.pick);
        });
      }
    }
  });

  // ── restored guards ──────────────────────────────────────────────────
  //
  // These two predate the survey and were lost when this file was rewritten
  // for it. Both come from defects a played week actually produced, so both
  // are back — the second one adapted, because its metric changed meaning.

  it('never asks A vs A', () => {
    // The screen drew "Wayne or Wayne" with both sides flagged as the
    // majority: the pair was derived from the ANSWERS, and a unanimous round
    // holds exactly one distinct answer. The pair travels with the record now.
    let sameName = 0; let rounds = 0;
    for (let s = 0; s < 60; s++) {
      boot();
      const c = play(s * 53 + 7);
      for (const v of Object.values(bdOf(c))) {
        for (const pk of (v.picks || [])) if (pk.pair && pk.pair[0] === pk.pair[1]) sameName++;
      }
      for (const b of c.beats) {
        const m = /—\s*(.+?)\s+or\s+(.+?)\s*\?/.exec(b.text || '');
        if (m) { rounds++; if (m[1].trim() === m[2].trim()) sameName++; }
      }
    }
    expect(rounds, 'no questions were asked at all').toBeGreaterThan(100);
    expect(sameName, 'a question asked somebody against themselves').toBe(0);
  });

  it('the elimination half does not stall', () => {
    // Originally "rarely stalls", counting every ALL SAFE and DEAD EVEN round
    // across the whole competition and requiring under 35%. The survey now
    // produces those verdicts DELIBERATELY — nobody goes home on a scored
    // question — so the old ratio would measure the new design rather than
    // the defect. Scoped to the half where a stall is still a stall.
    let dead = 0; let rounds = 0; let worstStreak = 0;
    for (let s = 0; s < 60; s++) {
      boot();
      const c = play(s * 53 + 7);
      const cutAt = c.beats.findIndex(b => (b.badgeText || '') === 'THE CUT');
      const tail = cutAt >= 0 ? c.beats.slice(cutAt) : c.beats;
      let run = 0;
      for (const b of tail) {
        const tag = b.badgeText || '';
        if (/^ROUND/.test(tag)) rounds++;
        else if (tag === 'ALL SAFE' || tag === 'DEAD EVEN') { dead++; run++; worstStreak = Math.max(worstStreak, run); }
        else if (/^MINORITY/.test(tag)) run = 0;
      }
    }
    expect(rounds, 'no sudden-death questions were asked').toBeGreaterThan(50);
    expect(dead / rounds, `${(100 * dead / rounds).toFixed(0)}% of sudden-death rounds sent nobody home`)
      .toBeLessThan(0.5);
    // Two dead rounds in a row ends the questions, by rule.
    expect(worstStreak, 'the competition sat on dead rounds').toBeLessThanOrEqual(2);
  });

  it('no verdict claims a room its own board contradicts', () => {
    // The defect this exists for: the survey printed SAFE_LINES on every
    // round that had a majority, so a five-to-four split was narrated as
    // "Every board in the room says Natasha. Nobody is in the minority"
    // directly above a board showing four people who said Felipe. The same
    // shape then turned up one level down, where "The minority is Tobias,
    // alone" ran on a round that eliminated Tobias AND Jules.
    //
    // So: walk the beats, and for any sentence that counts the room, check
    // the count against the picks recorded for that question.
    const UNANIMOUS = /Every board in the room|Unanimous for|Not one board disagrees|whole room lands on|Nobody is in the minority/;
    const ALONE = /, alone,|One board out of the whole room|by (?:him|her|them)self/;

    for (let s = 0; s < 50; s++) {
      boot();
      const r = play(s * 19 + 13, 8);
      const bd = bdOf(r);
      // Everybody's pick for question q, so a claim can be checked against it.
      const splitAt = q => {
        const picks = Object.values(bd).map(v => (v.picks || []).find(pk => pk.q === q)).filter(Boolean);
        const maj = picks.find(pk => pk.majority)?.majority || null;
        return { maj, wrong: picks.filter(pk => pk.right === false).length, seen: picks.length };
      };

      let q = 0;
      for (const b of r.beats) {
        const tag = b.badgeText || '';
        const m = /^ROUND (\d+)/.exec(tag);
        if (m) { q = Number(m[1]); continue; }
        const text = b.text || '';
        if (!q) continue;
        const { maj, wrong } = splitAt(q);
        if (!maj) continue;                          // dead-even: no claim to check

        if (UNANIMOUS.test(text)) {
          expect(wrong, `seed ${s} q${q}: "${text.slice(0, 70)}…" but ${wrong} boards disagreed`)
            .toBe(0);
        }
        // "alone" is about how many went out, which on a survey round is zero
        // and on a sudden-death round is the size of the minority.
        if (ALONE.test(text) && /^MINORITY/.test(tag)) {
          expect(wrong, `seed ${s} q${q}: called it a minority of one, but ${wrong} boards were wrong`)
            .toBe(1);
        }
        // The badge states the split; it must be the split.
        const sp = /^SURVEY (\d+)–(\d+)$/.exec(tag);
        if (sp) {
          expect(Number(sp[2]), `seed ${s} q${q}: badge says ${sp[0]}, boards say ${wrong} wrong`)
            .toBe(wrong);
        }
      }
    }
  });

  it('a survey round that split names who was on the wrong side of it', () => {
    // The screen colours minority boards red. A transcript has no red, so if
    // the sentence does not carry them the cut arrives out of nowhere.
    let checked = 0;
    for (let s = 0; s < 30 && checked < 12; s++) {
      boot();
      const r = play(s * 29 + 7, 8);
      const bd = bdOf(r);
      let q = 0;
      for (const b of r.beats) {
        const m = /^ROUND (\d+)/.exec(b.badgeText || '');
        if (m) { q = Number(m[1]); continue; }
        const sp = /^SURVEY \d+–(\d+)$/.exec(b.badgeText || '');
        if (!sp || Number(sp[1]) === 0) continue;
        const losers = Object.entries(bd)
          .filter(([, v]) => (v.picks || []).some(pk => pk.q === q && pk.right === false))
          .map(([n]) => n);
        for (const name of losers) {
          expect(b.text, `q${q}: ${name} was in the minority and the sentence never says so`)
            .toContain(name);
        }
        checked++;
      }
    }
    expect(checked, 'no split survey rounds were produced at all').toBeGreaterThan(5);
  });

  it('the screen draws two different people on every question card', () => {
    for (const seed of [3, 9, 21]) {
      boot();
      const c = play(seed);
      const act = { type: 'hoh', winner: c.winner,
        results: c.placements.map(n => ({ name: n, score: c.scores[n] })), competition: c };
      const ep = { num: 6, acts: [act] };
      Object.keys(_tvState).forEach(k => delete _tvState[k]);
      rpBuildBBComp(ep, 'hoh');
      Object.keys(_tvState).filter(k => k.startsWith('bb_sig_')).forEach(k => { _tvState[k].idx = 999; });
      const html = rpBuildBBComp(ep, 'hoh') || '';
      const cards = html.split('<article class="mjr-card mjr-round').slice(1);
      expect(cards.length, `seed ${seed}: no question cards drawn`).toBeGreaterThan(0);
      for (const card of cards) {
        const names = [...card.matchAll(/<figcaption>([^<]*)<\/figcaption>/g)].map(m => m[1].trim());
        expect(names.length, `seed ${seed}: card had ${names.length} names`).toBe(2);
        expect(names[0], `seed ${seed}: drew the same person twice`).not.toBe(names[1]);
        expect((card.match(/mjr-nom-flag/g) || []).length, `seed ${seed}: both sides flagged`)
          .toBeLessThanOrEqual(1);
      }
    }
  });
});
