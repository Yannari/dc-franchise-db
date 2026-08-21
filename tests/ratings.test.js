// ══════════════════════════════════════════════════════════════════════
// The TV ratings
// ══════════════════════════════════════════════════════════════════════
//
// What these guard, in order of how badly it would hurt to get wrong:
//
//   1. the four demographics genuinely disagree. If they move together every
//      week the weight table is decoration and the feature is one number
//      wearing four hats.
//   2. the show layer bites — the same week does NOT rate the same on Total
//      Drama and Big Brother.
//   3. momentum is asymmetric, which is the whole model of an audience.
//   4. every tier is reachable. A band nothing can land in is not a band.
//   5. every episode-complete site calls it. Seventeen sites is exactly the
//      shape of bug this project has shipped before — one path forgotten and
//      that episode type quietly has no data forever.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gs, players, seasonConfig } from '../js/core.js';
import {
  TIERS, DEMOS, BASE_TASTE, RATINGS_V, tierFor, readSignals, rawScore,
  applyMomentum, foldWeek, seasonScore, ratingsForSeason, updateRatings,
  ratingsSummary, engagement, demoNote, overallOf,
} from '../js/ratings.js';
import { SHOWS } from '../js/shows.js';
import { seedGame } from './helpers/setup.js';

const ROSTER = JSON.parse(readFileSync(resolve(process.cwd(), 'franchise_roster.json'), 'utf8'));
const POOL = (Array.isArray(ROSTER) ? ROSTER : ROSTER.players || Object.values(ROSTER)[0])
  .filter(p => p?.stats && p.name);
const CAST = Array.from({ length: 12 }, (_, i) => POOL[(i * 7 + 2) % POOL.length])
  .map(p => ({ name: p.name, archetype: p.archetype || 'floater',
    gender: p.gender || 'm', sexuality: p.sexuality || 'straight', stats: { ...p.stats } }));

/** A week built to order, in the shape both shows actually record. */
function week(n, opts = {}) {
  const house = opts.house || CAST.map(c => c.name);
  const gone = opts.eliminated === undefined ? house[house.length - 1] : opts.eliminated;
  const bloc = opts.bloc || house.slice(0, Math.ceil(house.length / 2));
  return {
    num: n,
    format: opts.format || 'big-brother',
    houseAtStart: [...house],
    eliminated: gone,
    hoh: opts.hoh || house[0],
    immunityWinner: opts.hoh || house[0],
    plan: opts.target ? { target: opts.target } : null,
    nominees: opts.nominees || [],
    twists: opts.twists || [],
    votingLog: bloc.map(v => ({ voter: v, voted: gone, changed: !!opts.flipped })),
    defections: opts.defections || [],
    acts: [{ type: 'house', beats: (opts.beats || []).map(b => ({ badgeText: b })) }],
    campEvents: opts.campEvents || [],
    popularitySnapshot: opts.popularity || {},
  };
}

beforeEach(() => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  seasonConfig.format = 'big-brother';
});

// ── the shape of the thing ────────────────────────────────────────────
describe('the scale', () => {
  it('covers the whole range with no gap and no overlap', () => {
    for (let n = 0; n <= 100; n++) expect(tierFor(n), `nothing owns ${n}`).toBeTruthy();
    const keys = TIERS.map(t => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(tierFor(0).key).toBe('dogwater');
    expect(tierFor(100).key).toBe('iconic');
    // Monotonic: a better number never returns a worse tier.
    let last = -1;
    for (let n = 0; n <= 100; n++) {
      const idx = TIERS.findIndex(t => t.key === tierFor(n).key);
      expect(idx).toBeGreaterThanOrEqual(last);
      last = idx;
    }
  });

  it('reaches every tier from real weight tables', () => {
    // Not "the bands are declared" — that a week can actually LAND in each.
    // A tier nothing reaches is a label, and this catches a weight table
    // retuned until the ends of the scale became unreachable.
    const reached = new Set();
    const keysOf = obj => Object.keys(obj);
    const all = keysOf(BASE_TASTE.teens);
    for (const demo of DEMOS) {
      for (const on of [0, 0.25, 0.5, 0.75, 1]) {
        const signals = Object.fromEntries(all.map(k => [k, on]));
        reached.add(tierFor(rawScore(signals, demo, 'big-brother')).key);
      }
      // The best and worst weeks this demographic can be shown.
      const best = Object.fromEntries(all.map(k => [k, (BASE_TASTE[demo][k] || 0) > 0 ? 1 : 0]));
      const worst = Object.fromEntries(all.map(k => [k, (BASE_TASTE[demo][k] || 0) < 0 ? 1 : 0]));
      reached.add(tierFor(rawScore(best, demo, 'big-brother')).key);
      reached.add(tierFor(rawScore(worst, demo, 'big-brother')).key);
    }
    for (const t of TIERS) {
      expect(reached.has(t.key), `no week can rate ${t.label}`).toBe(true);
    }
  });
});

// ── the point of the feature ──────────────────────────────────────────
describe('the four of them disagree', () => {
  it('splits the room on a season built to split it', () => {
    // A showmance-heavy, twist-heavy, unstrategic week: teen catnip and
    // exactly what a middle-aged viewer switches off.
    const teenBait = { showmance: 1, twist: 1, returns: 1, mess: 1, powerShift: 0.8,
      blindside: 0.3, strategy: 0.05, predictable: 0.2, steamroll: 0.1,
      likability: 0.5, villainy: 0.4 };
    const scores = Object.fromEntries(DEMOS.map(d => [d, rawScore(teenBait, d, 'big-brother')]));
    expect(scores.teens, 'teens should love this week').toBeGreaterThan(scores.middleAged + 15);

    // And the reverse: a long, competent, quiet game.
    const gameShow = { strategy: 1, predictable: 0.35, steamroll: 0.8, likability: 0.9,
      blindside: 0.4, powerShift: 0.2, showmance: 0, twist: 0, returns: 0,
      mess: 0.05, villainy: 0.1 };
    const s2 = Object.fromEntries(DEMOS.map(d => [d, rawScore(gameShow, d, 'big-brother')]));
    expect(s2.middleAged, 'the game audience should be fed').toBeGreaterThan(s2.teens + 10);
    expect(s2.older, 'a likable competent cast is exactly their show')
      .toBeGreaterThan(s2.youngAdults + 10);
  });

  it('does not move the four as one across a played season', () => {
    // The real guard: over a whole season the four curves must separate. If
    // they track each other the table is doing nothing.
    let st = null;
    for (let n = 1; n <= 8; n++) {
      st = foldWeek(st, week(n, {
        // alternating weeks of romance-and-chaos and quiet strategy
        beats: n % 2 ? ['SHOWMANCE', 'PRANK', 'KISS'] : ['ALLIANCE', 'VOTE PLAN', 'TARGET'],
        twists: n % 2 ? ['x'] : [],
        flipped: n % 3 === 0,
      }));
    }
    const spread = Math.max(...DEMOS.map(d => st.demos[d]))
      - Math.min(...DEMOS.map(d => st.demos[d]));
    expect(spread, 'all four demographics agreed all season').toBeGreaterThan(5);
  });
});

// ── the show layer ────────────────────────────────────────────────────
describe('what the show is for', () => {
  it('every registered show declares an audience', () => {
    for (const [format, show] of Object.entries(SHOWS)) {
      expect(show.audience, `${format} has no audience overlay`).toBeTruthy();
    }
  });

  it('rates the same quiet strategic week differently on the two shows', () => {
    const quietGame = { strategy: 1, predictable: 0.4, steamroll: 0.6, likability: 0.6,
      blindside: 0.5, powerShift: 0.3, showmance: 0, twist: 0, returns: 0,
      mess: 0.05, villainy: 0.2 };
    const bb = rawScore(quietGame, 'middleAged', 'big-brother');
    const td = rawScore(quietGame, 'middleAged', 'total-drama');
    // Big Brother is sold on the vote; Total Drama is not.
    expect(bb, 'the show layer is not biting').toBeGreaterThan(td + 2);
  });

  it('rates an unregistered format instead of crashing', () => {
    const signals = Object.fromEntries(Object.keys(BASE_TASTE.teens).map(k => [k, 0.5]));
    expect(() => rawScore(signals, 'teens', 'the-traitors')).not.toThrow();
    expect(rawScore(signals, 'teens', 'the-traitors')).toBeGreaterThan(0);
  });
});

// ── momentum ──────────────────────────────────────────────────────────
describe('momentum', () => {
  it('lifts a rising season more than a falling one, and costs both the same', () => {
    const rising = applyMomentum(50, 80, 2);
    const falling = applyMomentum(50, 80, -2);
    expect(rising, 'momentum does nothing on the way up').toBeGreaterThan(falling + 3);

    const badRising = applyMomentum(50, 20, 2);
    const badFalling = applyMomentum(50, 20, -2);
    expect(badRising, 'a bad week must land the same either way')
      .toBeCloseTo(badFalling, 5);
    expect(badRising).toBeLessThan(50);
  });

  it('never overshoots the week it is reacting to', () => {
    for (const m of [-2, -1, 0, 1, 2]) {
      expect(applyMomentum(50, 90, m)).toBeLessThanOrEqual(90);
      expect(applyMomentum(50, 10, m)).toBeGreaterThanOrEqual(10);
    }
  });

  it('stays inside its bounds across a long season', () => {
    let st = null;
    for (let n = 1; n <= 14; n++) st = foldWeek(st, week(n, { flipped: n > 6 }));
    expect(st.momentum).toBeGreaterThanOrEqual(-2);
    expect(st.momentum).toBeLessThanOrEqual(2);
    st.weeks.forEach(w => {
      expect(w.overall).toBeGreaterThanOrEqual(0);
      expect(w.overall).toBeLessThanOrEqual(100);
    });
  });
});

// ── signals ───────────────────────────────────────────────────────────
describe('reading a week', () => {
  it('sees a blindside and a coronation as different weeks', () => {
    const flip = readSignals(week(3, { flipped: true, defections: [{ player: 'x' }, { player: 'y' }] }), null);
    const clean = readSignals(week(3, { flipped: false }), null);
    expect(flip.blindside).toBeGreaterThan(clean.blindside);
  });

  it('calls the named target leaving predictable', () => {
    const house = CAST.map(c => c.name);
    const named = readSignals(week(3, { target: house[house.length - 1] }), null);
    const surprise = readSignals(week(3, { target: house[1] }), null);
    expect(named.predictable).toBeGreaterThan(surprise.predictable);
  });

  it('builds a steamroll only when the same bloc keeps deciding', () => {
    const house = CAST.map(c => c.name);
    const same = { bloc: house.slice(0, 6) };
    let prev = null, sameSteam = 0;
    for (let n = 1; n <= 5; n++) {
      prev = readSignals(week(n, same), prev);
      sameSteam = prev.steamroll;
    }
    let p2 = null, churn = 0;
    for (let n = 1; n <= 5; n++) {
      // a different half of the house decides every week
      p2 = readSignals(week(n, { bloc: n % 2 ? house.slice(0, 6) : house.slice(6) }), p2);
      churn = p2.steamroll;
    }
    expect(sameSteam, 'five weeks of one bloc is not reading as a steamroll')
      .toBeGreaterThan(churn + 0.2);
  });

  it('calls it a power shift when the throne crosses a line', () => {
    const house = CAST.map(c => c.name);
    let prev = readSignals(week(1, { bloc: house.slice(0, 6), hoh: house[0] }), null);
    const crossed = readSignals(week(2, { hoh: house[8], bloc: house.slice(6) }), prev);
    const held = readSignals(week(2, { hoh: house[0], bloc: house.slice(0, 6) }), prev);
    expect(crossed.powerShift).toBeGreaterThan(held.powerShift);
  });

  it('reads both shows without inventing fields', () => {
    for (const format of Object.keys(SHOWS)) {
      const s = readSignals(week(2, { format }), null);
      expect(s, `${format} produced nothing`).toBeTruthy();
      for (const k of Object.keys(BASE_TASTE.teens)) {
        expect(Number.isFinite(s[k]), `${format}.${k} is not a number`).toBe(true);
        expect(s[k], `${format}.${k} out of range`).toBeGreaterThanOrEqual(0);
        expect(s[k]).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ── the season verdict ────────────────────────────────────────────────
describe('the verdict', () => {
  it('weights the back half harder than the front', () => {
    const rise = [40, 40, 40, 40, 80, 80, 80, 80].map((overall, i) => ({ ep: i + 1, overall }));
    const fall = [80, 80, 80, 80, 40, 40, 40, 40].map((overall, i) => ({ ep: i + 1, overall }));
    expect(seasonScore(rise)).toBeGreaterThan(seasonScore(fall));
    // and both stay inside the range they were built from
    expect(seasonScore(rise)).toBeLessThanOrEqual(80);
    expect(seasonScore(fall)).toBeGreaterThanOrEqual(40);
  });

  it('says nothing about a season with no weeks', () => {
    expect(seasonScore([])).toBe(0);
    expect(ratingsForSeason([])).toBe(null);
  });
});

// ── retro == live ─────────────────────────────────────────────────────
describe('a replayed season rates the same as a lived one', () => {
  it('agrees week for week', () => {
    const history = [1, 2, 3, 4, 5].map(n => week(n, { flipped: n === 3 }));
    // live
    history.forEach(ep => updateRatings(ep));
    const live = ratingsSummary();
    // retro, from the same records
    const retro = ratingsForSeason(history);
    expect(retro.weeks.length).toBe(live.weeks.length);
    retro.weeks.forEach((w, i) => {
      expect(w.overall, `week ${i + 1} disagrees`).toBeCloseTo(live.weeks[i].overall, 5);
    });
    expect(retro.score).toBeCloseTo(live.score, 5);
  });

  it('stamps a version so a retune can be re-derived later', () => {
    expect(ratingsForSeason([week(1)]).v).toBe(RATINGS_V);
  });
});

// ── the consequence ───────────────────────────────────────────────────
describe('engagement', () => {
  it('is neutral before a season has aired', () => {
    expect(engagement()).toBe(1);
  });

  it('flattens the public vote on a season nobody is watching', () => {
    // The mechanic: weight = base + popularity * engagement. Low engagement
    // compresses the spread toward flat, which IS the vote going random.
    const pop = { a: 4, b: 1, c: -2 };
    const spread = e => {
      const w = Object.values(pop).map(p => 3 + p * e);
      return Math.max(...w) - Math.min(...w);
    };
    expect(spread(0.45)).toBeLessThan(spread(1.6));
    // and the floor never inverts a weight into nonsense
    expect(Math.min(...Object.values(pop).map(p => 3 + p * 0.45))).toBeGreaterThan(0);
  });

  it('tracks the season it is reading', () => {
    for (let n = 1; n <= 6; n++) {
      updateRatings(week(n, { beats: ['ALLIANCE', 'VOTE PLAN'], flipped: true }));
    }
    const e = engagement();
    expect(e).toBeGreaterThanOrEqual(0.45);
    expect(e).toBeLessThanOrEqual(1.6);
  });
});

// ── it survives being saved ───────────────────────────────────────────
describe('serialization', () => {
  it('is plain data all the way down', () => {
    [1, 2, 3].forEach(n => updateRatings(week(n)));
    const round = JSON.parse(JSON.stringify(gs.ratings));
    expect(round.weeks.length).toBe(3);
    expect(round.demos.teens).toBeCloseTo(gs.ratings.demos.teens, 5);
    // and a reload can keep folding from where it stopped
    const next = foldWeek(round, week(4));
    expect(next.weeks.length).toBe(4);
  });

  it('puts the week on the episode for the screens to read back', () => {
    const ep = week(1);
    updateRatings(ep);
    expect(ep.ratingsSnapshot?.overall).toBeGreaterThan(0);
  });

  it('stays out of the way when the season turned it off', () => {
    seasonConfig.ratings = false;
    try {
      expect(updateRatings(week(1))).toBe(null);
      expect(gs.ratings).toBeFalsy();
    } finally { delete seasonConfig.ratings; }
  });
});

// ── the wiring ────────────────────────────────────────────────────────
describe('every episode calls it', () => {
  it('rates at every site the edit layer runs at', () => {
    // Seventeen call sites. The failure this guards is the one this project
    // has actually shipped: a path added later, the new call forgotten, and
    // that episode type silently carrying no data for the rest of time.
    for (const file of ['js/episode.js', 'js/bb-run.js']) {
      const src = readFileSync(resolve(process.cwd(), file), 'utf8');
      const edit = (src.match(/updateEditLayer\(ep\)/g) || []).length;
      const rate = (src.match(/updateRatings\(ep\)/g) || []).length;
      expect(edit, `${file} lost its edit-layer calls`).toBeGreaterThan(0);
      expect(rate, `${file}: ${edit} edit sites but ${rate} ratings sites`).toBe(edit);
    }
  });
});

// ── the sentences under the numbers ───────────────────────────────────
describe('why the number moved', () => {
  const twoWeeks = (a, b) => {
    let st = foldWeek(null, week(1, a));
    st = foldWeek(st, week(2, b));
    return st.weeks;
  };

  it('gives every column its own sentence', () => {
    // Two groups reacting to the same signal in the same week drew the
    // identical line and sat next to each other saying it.
    const [w1, w2] = twoWeeks({ beats: ['ALLIANCE'] }, { flipped: true, beats: ['PRANK', 'KISS'] });
    const notes = DEMOS.map(d => demoNote(d, w2, w1, 'big-brother')).filter(Boolean);
    expect(notes.length, 'nobody had anything to say').toBeGreaterThan(1);
    expect(new Set(notes.map(n => n.text)).size, `repeated line: ${notes.map(n => n.text)}`)
      .toBe(notes.length);
  });

  it('says what happened, not whether it was good', () => {
    // The pools describe the week; the number and the colour carry the
    // verdict. A line that approves of the week reads as sarcasm in the
    // column where the score went down — which is exactly how it shipped
    // first time, telling the older audience their falling score was
    // 'scrappy in the way that makes people talk'.
    const [w1, w2] = twoWeeks({ beats: ['ALLIANCE'] }, { beats: ['PRANK', 'FOOD FIGHT', 'CRY'] });
    for (const d of DEMOS) {
      const n = demoNote(d, w2, w1, 'big-brother');
      if (!n) continue;
      expect(n.text, `${d} was given a verdict instead of an observation: ${n.text}`)
        .not.toMatch(/better for it|the good stuff|whole appeal|worth watching|makes people talk/i);
    }
  });

  it('has something to say about an opening week', () => {
    const [w1] = twoWeeks({ flipped: true, beats: ['ALLIANCE', 'VOTE PLAN'] }, {});
    const notes = DEMOS.map(d => demoNote(d, w1, null, 'big-brother')).filter(Boolean);
    expect(notes.length, 'week one produced no notes at all').toBeGreaterThan(0);
  });

  it('speaks the show its season belongs to', () => {
    // {round} is filled from the registry: an episode on Total Drama, a week
    // on Big Brother. This is the surface the wrong-show-vocabulary bug keeps
    // coming back on.
    const [w1, w2] = twoWeeks({ beats: ['ALLIANCE'] }, { flipped: true });
    const all = f => DEMOS.map(d => demoNote(d, w2, w1, f)).filter(Boolean).map(n => n.text).join(' | ');
    expect(all('total-drama')).not.toMatch(/week/i);
    expect(all('big-brother')).not.toMatch(/episode/i);
    expect(all('total-drama') + all('big-brother')).not.toMatch(/\{round\}|\{exit\}/);
  });
});

describe('the headline number', () => {
  it('rewards a season one group loves over one nobody minds', () => {
    const beloved = { teens: 30, youngAdults: 30, middleAged: 30, older: 90 };
    const fine = { teens: 45, youngAdults: 45, middleAged: 45, older: 45 };
    expect(overallOf(beloved)).toBeGreaterThan(overallOf(fine));
  });

  it('never leaves the scale', () => {
    expect(overallOf({ teens: 0, youngAdults: 0, middleAged: 0, older: 0 })).toBe(0);
    expect(overallOf({ teens: 100, youngAdults: 100, middleAged: 100, older: 100 })).toBe(100);
  });
});

// ── the season carries its tier off the simulator ─────────────────────
describe('a finished season keeps its rating', () => {
  it('compresses the curve instead of storing every week whole', () => {
    // A ledger holding twenty seasons of full week objects — every signal,
    // every demographic — is the state-bloat shape this project has already
    // paid for once. What a card needs is a tier, a score and a line.
    const r = ratingsForSeason([1, 2, 3, 4].map(n => week(n)));
    const stored = { v: r.v, score: r.score, tier: r.tier,
      demos: r.demos, curve: r.weeks.map(w => w.overall) };
    expect(stored.curve).toHaveLength(4);
    stored.curve.forEach(n => expect(typeof n).toBe('number'));
    // It has to survive being written to a file and read back on a page that
    // never loads the simulator.
    const round = JSON.parse(JSON.stringify(stored));
    expect(round.tier.key).toBe(tierFor(r.score).key);
    expect(round.tier.label, 'the label must survive the trip').toBeTruthy();
    expect(round.score).toBe(r.score);
  });

  it('gives the badge everything it draws from', () => {
    // seasons.html reads exactly these three fields off the document. If the
    // shape drifts the badge silently disappears — it renders nothing when
    // `ratings.tier` is absent, which looks identical to a season that was
    // never rated.
    const r = ratingsForSeason([1, 2, 3].map(n => week(n)));
    const tier = tierFor(r.score);
    const doc = { ratings: { score: r.score, tier, curve: r.weeks.map(w => w.overall) } };
    expect(doc.ratings.tier.key, 'the badge class comes from this').toBeTruthy();
    expect(doc.ratings.tier.label, 'the badge text comes from this').toBeTruthy();
    expect(typeof doc.ratings.score, 'the tooltip comes from this').toBe('number');
  });
});
