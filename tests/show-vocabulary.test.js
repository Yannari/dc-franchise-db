// No show may be described in another show's words.
//
// THE BUG CLASS THIS EXISTS FOR, which has shipped twice:
//
//   "Jade, Logan, Anastasia, Hannah, Spencer reached the end without ever
//    being nominated."  — printed over a Total Drama season, which has no
//    nominations. There is no block to be put on; the honest equivalent is
//    never having a vote cast against you.
//
//   "Amelie was evicted, 5-2."  — printed over a camp, which votes people out.
//
// Both were true sentences about Big Brother rendered onto a Total Drama page,
// and both were written by somebody (me) who had just been working in the other
// show. Neither errored. Nobody's test failed. They were found by a person
// reading the page weeks later.
//
// So this walks EVERY REGISTERED FORMAT — including one that does not exist yet
// — renders the screens that generate sentences, and fails if a show's own
// output contains another show's vocabulary. A third show gets this coverage by
// existing in js/shows.js; there is no list here to remember to extend.
import { describe, expect, it } from 'vitest';
import { SHOWS, DEFAULT_FORMAT, showWords } from '../js/shows.js';
import { buildDossier } from '../js/wiki.js';
import { renderArticle } from '../js/wiki-view.js';
import { roundLedger } from '../js/wiki-fill.js';
import { words as socialWords } from '../js/social/adapter.js';

const FORMATS = Object.keys(SHOWS);

// ── the vocabularies, by the thing that makes them exclusive ──────────
//
// Only words that CANNOT be true of the other show. "Competition" is fine
// everywhere; "Power of Veto" is a fact about one house and a falsehood
// anywhere else.
const EXCLUSIVE = {
  'big-brother': [
    'head of household', 'hoh', 'power of veto', 'veto',
    'evicted', 'eviction', 'houseguest', 'have-not', 'block buster',
    'nominated', 'nomination', 'on the block',
  ],
  'total-drama': [
    'tribe', 'tribal council', 'campfire', 'idol', 'immunity challenge',
    'contestant', 'voted out', 'camper',
  ],
};

/** Everything a given format is not allowed to say. */
function forbiddenFor(format) {
  return Object.entries(EXCLUSIVE)
    .filter(([f]) => f !== format)
    .flatMap(([, list]) => list);
}

const strip = html => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

/** Which forbidden words appear, so a failure names them rather than just failing. */
function leaks(text, format) {
  const hay = strip(text).toLowerCase();
  return forbiddenFor(format).filter(w => new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`).test(hay));
}

// ── fixtures ──────────────────────────────────────────────────────────
//
// Deliberately neutral: the names, titles and prose carry no show vocabulary of
// their own, so anything the assertions find was put there by the renderer and
// not by the data. A real-data version of this runs in the e2e suite, where the
// season titles and written prose are whatever the site actually holds.
const NEUTRAL_STORY = 'They arrived early, made themselves useful, and stayed useful.';

/**
 * Two people per show, because they render different sentences.
 *
 * The winner exercises the endgame clauses. THE ONE WHO LEFT exercises the exit
 * cell, and that distinction is not academic: the first version of this guard
 * tested only a winner, so a camp grid labelling an exit "Evicted" — one of the
 * two bugs in the header — passed it. A guard that cannot catch the bug it was
 * written for is worse than none, because it is also a claim that the bug is
 * impossible.
 */
function playerFor(format, who = 'winner') {
  const houseLike = format === 'big-brother';
  const left = who === 'left';
  return {
    id: left ? 'otherperson' : 'testcase',
    name: left ? 'Otherperson' : 'Testcase',
    seasonDetails: [{
      season: 1, format,
      placement: left ? 2 : 1,
      status: left ? 'Juror' : 'Winner',
      votesReceived: left ? 3 : 4, juryVotes: left ? 0 : 5,
      challengeWins: 2, immunityWins: 1,
      ...(houseLike ? { bb: { hohWins: left ? 0 : 2, vetoWins: 1,
        timesNominated: left ? 1 : 2, timesSaved: 1 } } : {}),
      alliances: ['The Quiet Part'], unbreakableBonds: ['Testcase'],
    }],
    story: NEUTRAL_STORY,
  };
}

/**
 * A season document in whichever round shape that format exports.
 *
 * A format the registry knows but that has no exporter yet gets the default
 * show's shape, which is the honest default — and if that is wrong for it, this
 * test is where somebody finds out.
 */
function docFor(format) {
  const base = {
    format, seasonNumber: 1, title: 'A Season',
    winner: { name: 'Testcase', vote: 'Testcase 5 — Otherperson 2', runnerUp: 'Otherperson' },
    placements: [
      { placement: 1, name: 'Testcase', playerSlug: 'testcase', story: NEUTRAL_STORY },
      { placement: 2, name: 'Otherperson', playerSlug: 'otherperson' },
    ],
  };
  if (format === 'big-brother') {
    return { ...base, weeks: [
      { week: 1, hoh: 'Testcase', initialNominees: ['Otherperson'], finalNominees: ['Otherperson'],
        vetoWinner: 'Testcase', votes: { Otherperson: 3 }, evicted: 'Otherperson',
        haveNots: ['Testcase'], ballots: [{ voter: 'Testcase', evict: 'Otherperson' }] },
    ] };
  }
  return { ...base, votingHistory: [
    { episode: 1, eliminated: 'Otherperson',
      votes: [{ voter: 'Testcase', target: 'Otherperson' }] },
  ] };
}

describe('every registered show is described in its own words', () => {
  it('has at least the two shipped shows, so this is not passing vacuously', () => {
    expect(FORMATS).toEqual(expect.arrayContaining(['total-drama', 'big-brother']));
  });

  // The character article: the screen with the most generated sentences on it —
  // a lead paragraph, an infobox, a round grid and a trivia list.
  for (const format of FORMATS) {
    for (const who of ['winner', 'left']) {
      it(`the ${format} article for the ${who} uses no other show's words`, () => {
        const dossier = buildDossier(playerFor(format, who), { seasonDocs: [docFor(format)] });
        const html = renderArticle(dossier, format, { root: '.' });
        expect(html.length, 'nothing rendered — the fixture is wrong, not the code').toBeGreaterThan(500);
        // The exit cell must actually be on the page, or this passes by drawing
        // nothing — which is how the first version of this guard missed it.
        //
        // Asked of the registry, not of a list. This line used to read
        // /voted out|evicted/ — the exact two-show assumption the header above
        // promises is not in here, sitting inside the guard against it. A third
        // show would have passed it by printing the second show's verb.
        if (who === 'left') {
          const exit = showWords(format).exit.toLowerCase();
          expect(strip(html).toLowerCase(),
            `the ${format} article never says "${exit}" — no exit cell rendered`)
            .toContain(exit);
        }
        expect(leaks(html, format)).toEqual([]);
      });
    }
  }

  // The round ledger: the facts every season page prints and both AI fills are
  // sent. It is one function for both shows, which is exactly why it can hand a
  // camp the house's words.
  for (const format of FORMATS) {
    it(`the ${format} round ledger states facts in its own words`, () => {
      const rounds = roundLedger(docFor(format));
      expect(rounds.length).toBeGreaterThan(0);
      const text = rounds.flatMap(r => [r.word, ...r.facts]).join(' | ');
      expect(leaks(text, format)).toEqual([]);
    });
  }

  // The social feed's vocabulary table. Components never branch on format, so a
  // wrong entry here is wrong in every post the feed writes.
  for (const format of FORMATS) {
    it(`the ${format} social vocabulary borrows nothing`, () => {
      const w = socialWords(format);
      const text = Object.values(w).flat().join(' | ');
      expect(leaks(text, format)).toEqual([]);
    });
  }
});

describe('the registry says enough about every show', () => {
  // A format that omits `words` silently inherits the default show's, which is
  // how a house came to be described to the AI writer as a summer camp.
  for (const format of FORMATS) {
    it(`${format} declares its own vocabulary`, () => {
      const w = showWords(format);
      for (const key of ['player', 'players', 'round', 'exit']) {
        expect(w[key], `${format}.words.${key} is missing`).toBeTruthy();
      }
      if (format !== DEFAULT_FORMAT) {
        // Not merely inherited: at least one word has to be this show's own, or
        // every screen will describe it as the default show.
        const mine = SHOWS[format].words || {};
        expect(Object.keys(mine).length,
          `${format} has no words of its own — it will render as ${DEFAULT_FORMAT}`).toBeGreaterThan(0);
      }
    });

    it(`${format} has a prefix nothing else uses`, () => {
      const others = FORMATS.filter(f => f !== format).map(f => SHOWS[f].prefix);
      expect(others).not.toContain(SHOWS[format].prefix);
    });

    it(`${format} declares a name and a short code`, () => {
      expect(SHOWS[format].name).toBeTruthy();
      // The wiki's season tabs are built from `short`; without it they read
      // "undefined1".
      expect(SHOWS[format].short || '').toBeTruthy();
    });
  }
});
