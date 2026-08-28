// No show may be described in another show's words.
//
// THE BUG CLASS THIS EXISTS FOR, which has shipped three times:
//
//   "Jade, Logan, Anastasia, Hannah, Spencer reached the end without ever
//    being nominated."  — printed over a Total Drama season, which has no
//    nominations. There is no block to be put on; the honest equivalent is
//    never having a vote cast against you.
//
//   "Amelie was evicted, 5-2."  — printed over a camp, which votes people out.
//
//   "He finished 5th as a murdered."  — printed over a castle, whose statuses
//    are its exit VERBS. And, on the same page, "played The Traitors 1 without
//    winning a challenge" about somebody who won four missions.
//
// All three were true sentences about one show rendered onto another's page,
// and all three were written by somebody who had just been working in the other
// show. None errored. Nobody's test failed. They were found by a person reading
// the page weeks later.
//
// So this walks EVERY REGISTERED FORMAT — including one that does not exist yet
// — renders the screens that generate sentences, and fails if a show's own
// output contains another show's vocabulary.
//
// ── WHAT IS AND IS NOT AUTOMATIC ──────────────────────────────────────
//
// The WALK is automatic: a newly registered show is rendered and checked the
// day it appears in js/shows.js. The VOCABULARY IS NOT. `VOCAB` (now in
// tests/helpers/show-vocabulary.js) is a list, and a third show was added to
// the registry without anybody extending it — which is why five vocabulary
// defects shipped at once (a castle headed "Total Drama" in its own infobox,
// "without winning a challenge", "Never made the merge", "as a murdered", a
// third of its posts signed `@bigjury`). The
// previous version of this header claimed "there is no list here to remember to
// extend". There was, it was two shows long, and that claim is the reason
// nobody looked.
//
// The vacuity arm below now FAILS if a registered format has no entry in VOCAB,
// so the next show cannot be added silently.
import { describe, expect, it } from 'vitest';
import { SHOWS, DEFAULT_FORMAT, showWords, exitVerbs } from '../js/shows.js';
import { buildDossier } from '../js/wiki.js';
import { renderArticle } from '../js/wiki-view.js';
import { roundLedger } from '../js/wiki-fill.js';
import { words as socialWords } from '../js/social/adapter.js';
import { VOCAB, forbiddenFor, foreignWordsIn } from './helpers/show-vocabulary.js';

const FORMATS = Object.keys(SHOWS);

// ── the vocabularies ──────────────────────────────────────────────────
//
// THE TABLE ITSELF LIVES IN `tests/helpers/show-vocabulary.js`, in ONE copy.
// It used to live here, and `tests/tr-vp.test.js` — which needs the same rule
// for a rendered VP screen — restated it, because a test file has nothing to
// import from. Two copies of one rule is the shape that has bitten this repo
// four times over, and a vocabulary list is the worst thing to hold two of:
// the bug it catches is itself a copy that drifted.
//
// `own` is what a show is ALLOWED to say, and therefore what its rivals are
// not. FORBIDDEN IS DERIVED, IN BOTH DIRECTIONS, by `forbiddenFor()`.

const strip = html => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

/** Which forbidden words appear, so a failure names them rather than just failing. */
function leaks(text, format) {
  return foreignWordsIn(strip(text), format);
}

// ── fixtures ──────────────────────────────────────────────────────────
//
// Deliberately neutral: the names, titles and prose carry no show vocabulary of
// their own, so anything the assertions find was put there by the renderer and
// not by the data. A real-data version of this runs in the e2e suite, where the
// season titles and written prose are whatever the site actually holds.
const NEUTRAL_STORY = 'They arrived early, made themselves useful, and stayed useful.';

/** Everybody who leaves the fixture round: one per verb the show declares. */
function leaversFor(format) {
  const names = ['Otherperson', 'Thirdperson', 'Fourthperson'];
  return exitVerbs(format)
    .map((verb, i) => (names[i] ? { name: names[i], slug: names[i].toLowerCase(), verb } : null))
    .filter(Boolean);
}

const Cap = t => String(t || '').replace(/^./, c => c.toUpperCase());

/**
 * One person per ROLE the show can produce, because they render different
 * sentences.
 *
 * The winner exercises the endgame clauses. THE ONES WHO LEFT exercise the exit
 * cell, and that distinction is not academic: the first version of this guard
 * tested only a winner, so a camp grid labelling an exit "Evicted" passed it.
 *
 * ── AND ONE PER DOOR, NOT ONE PER SHOW ────────────────────────────────
 *
 * The second version tested "the one who left", singular — and on a show with
 * two doors out that was always the BANISHED one. The murdered fixture player
 * was never rendered, so the cell that reads "Banished" over a murder was never
 * drawn and the guard could not see it. `who` is an INDEX into the show's own
 * verb list now, so a show with three doors gets three people the day it
 * declares a third.
 */
function playerFor(format, who = 'winner') {
  const houseLike = format === 'big-brother';
  const leavers = leaversFor(format);
  const idx = typeof who === 'number' ? who : -1;
  const left = idx >= 0 ? leavers[idx] : null;
  if (idx >= 0 && !left) return null;
  return {
    id: left ? left.slug : 'testcase',
    name: left ? left.name : 'Testcase',
    seasonDetails: [{
      season: 1, format,
      placement: left ? 2 + idx : 1,
      // THE SHOW'S OWN STATUS. A castle records `Banished`/`Murdered` — its
      // own words, which is the point — and that is what turned "finished 5th
      // as a juror" into "finished 5th as a murdered."
      status: left ? Cap(left.verb) : 'Winner',
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
  const leavers = leaversFor(format);
  const base = {
    format, seasonNumber: 1, title: 'A Season',
    winner: { name: 'Testcase', vote: 'Testcase 5 — Otherperson 2', runnerUp: 'Otherperson' },
    placements: [
      { placement: 1, name: 'Testcase', playerSlug: 'testcase', story: NEUTRAL_STORY },
      // ONE BODY PER DOOR, because a show may have more than one way of
      // producing one. The Traitors banishes at the table and murders at
      // night, and a fixture with two people in it can exercise only one.
      ...leavers.map((x, i) => ({
        placement: 2 + i, name: x.name, playerSlug: x.slug, status: Cap(x.verb),
      })),
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
    { episode: 1, eliminated: leavers[0]?.name || null, exits: leavers,
      votes: [{ voter: 'Testcase', target: leavers[0]?.name || 'Otherperson' }] },
  ] };
}

describe('every registered show is described in its own words', () => {
  it('has at least the two shipped shows, so this is not passing vacuously', () => {
    expect(FORMATS).toEqual(expect.arrayContaining(['total-drama', 'big-brother']));
  });

  // ── the list that was never extended ────────────────────────────────
  //
  // The walk below is automatic; VOCAB is not. A show registered with no entry
  // here is a show whose nouns nobody else is forbidden from printing — and,
  // because `forbiddenFor` subtracts its own list, a show forbidden from
  // saying nothing at all. That is how five vocabulary defects shipped at once.
  it('knows the vocabulary of every registered show', () => {
    const missing = FORMATS.filter(f => !(VOCAB[f]?.own || []).length);
    expect(missing,
      'These formats are in js/shows.js and have no entry in VOCAB above. '
      + "Add the words that CANNOT be true of another show — this guard's "
      + 'coverage of a new show is NOT automatic, whatever the header used to '
      + 'claim.').toEqual([]);
  });

  it('forbids something in both directions, for every pair of shows', () => {
    // A one-sided table is how a Traitors noun could be printed over a camp
    // and pass: every list named the other shows and none named this one.
    for (const format of FORMATS) {
      const forbidden = forbiddenFor(format);
      expect(forbidden.length, `${format} is forbidden nothing`).toBeGreaterThan(5);
      for (const other of FORMATS) {
        if (other === format) continue;
        const theirs = (VOCAB[other]?.own || []).map(w => w.toLowerCase());
        expect(theirs.some(w => forbidden.includes(w)),
          `nothing ${other} says is forbidden on a ${format} page`).toBe(true);
      }
    }
  });

  // EVERY DOOR THE SHOW HAS, AND THE WINNER.
  for (const format of FORMATS) {
    const roles = ['winner', ...exitVerbs(format).map((_, i) => i)];
    for (const who of roles) {
      const label = who === 'winner' ? 'the winner'
        : `the player who was ${exitVerbs(format)[who]}`;
      it(`the ${format} article for ${label} uses no other show's words`, () => {
        const player = playerFor(format, who);
        expect(player, 'no fixture for this role').toBeTruthy();
        const dossier = buildDossier(player, { seasonDocs: [docFor(format)] });
        const html = renderArticle(dossier, format, { root: '.' });
        expect(html.length, 'nothing rendered — the fixture is wrong, not the code').toBeGreaterThan(500);
        // The exit cell must actually be on the page, or this passes by drawing
        // nothing — which is how the first version of this guard missed it.
        //
        // AND IT MUST BE **THIS** PLAYER'S VERB, not the show's default. One
        // `exitWord` per season printed "Banished" over a murder, and escaped
        // only because the murdered player had no cell at all: the grid read
        // `r.eliminated`, which is the banishment, so they never left it.
        if (who !== 'winner') {
          const verb = exitVerbs(format)[who].toLowerCase();
          /* READ THE ROW, NOT THE PAGE. Asking only whether the HTML contains
             the word is satisfied by the infobox's `Status: Murdered` — so a
             grid that never draws this player's exit cell passed, which is
             exactly the defect: the grid compared `r.eliminated`, which is the
             VOTE, so the murdered never left it. The row is the value here. */
          const rows = (dossier.career || [])
            .flatMap(sh => sh.seasons || []).flatMap(x => x.weekRows || []);
          expect(rows.length, 'no round grid was built at all').toBeGreaterThan(0);
          const mine = rows.find(w => w.evicted);
          expect(mine,
            `${player.name} left by the "${verb}" door and never leaves the round `
            + 'grid — every round of the season says they are still in it').toBeTruthy();
          expect(String(mine.exitVerb || showWords(format).exit).toLowerCase(),
            'the grid labels this exit with the show\'s DEFAULT verb rather than '
            + 'the one the round recorded').toBe(verb);
          /* AND THE CELL THE PAGE ACTUALLY DRAWS. `toContain(verb)` over the
             whole page is satisfied by the infobox's own `Status: Murdered`,
             so replacing the per-round verb with one `exitWord` for the whole
             season — the defect — left this arm green. The grid's cell labels
             are read on their own. */
          const cells = [...html.matchAll(/class="wk-cell-l">([^<]*)</g)].map(m => m[1]);
          expect(cells.map(c => c.toLowerCase()),
            `the round grid never labels a cell "${verb}" — it drew this exit in `
            + `"${showWords(format).exit}", the show's default verb`)
            .toContain(verb);
        }
        /* ── A STATUS IS NOT ALWAYS A NOUN ──────────────────────────────
           "He finished 5th as a murdered." Every word in that sentence is
           this show's own, so the leak table above cannot see it: the defect
           is GRAMMAR, not vocabulary. A show whose statuses are its exit
           VERBS — which is what makes them right on that show — cannot be
           dropped into a sentence written for "as a juror". Registry-driven,
           so a fourth show inherits it the day it declares a verb. */
        for (const verb of exitVerbs(format)) {
          expect(strip(html).toLowerCase(),
            `"as a ${verb}" — a sentence built for a noun was handed a verb`)
            .not.toMatch(new RegExp('\\bas an? ' + verb + '\\b'));
        }
        expect(leaks(html, format)).toEqual([]);
      });
    }
  }

  // The round ledger: the facts every season page prints and both AI fills are
  // sent. It is one function for every show, which is exactly why it can hand a
  // camp the house's words.
  for (const format of FORMATS) {
    it(`the ${format} round ledger states facts in its own words`, () => {
      const rounds = roundLedger(docFor(format));
      expect(rounds.length).toBeGreaterThan(0);
      const text = rounds.flatMap(r => [r.word, ...r.facts]).join(' | ');
      expect(leaks(text, format)).toEqual([]);
    });

    // EVERY VERB, NOT JUST THE DEFAULT ONE. A show with two ways of leaving
    // that only ever prints one of them is the empty-section failure mode
    // wearing a different hat: the guard passes because the second departure
    // was never drawn, and the day it is drawn it is described in the first
    // one's words.
    it(`the ${format} round ledger prints every exit verb the show declares`, () => {
      const rounds = roundLedger(docFor(format));
      const text = rounds.flatMap(r => r.facts).join(' | ');
      for (const verb of exitVerbs(format)) {
        expect(text, `the ${format} ledger never says "${verb}"`).toContain(`was ${verb}`);
      }
      // ...and no departure is described in another show's verb.
      const foreign = FORMATS.filter(f => f !== format).flatMap(f => exitVerbs(f));
      for (const verb of foreign) {
        if (exitVerbs(format).includes(verb)) continue;
        expect(text, `the ${format} ledger says "${verb}"`).not.toContain(`was ${verb}`);
      }
    });
  }

  // ── THE COVERAGE FLOOR ON THE VERB LIST ITSELF ──────────────────────
  //
  // Every arm above loops `exitVerbs(format)`, so deleting `exitMurder` from
  // the registry fails none of them — it silently reduces them all to the
  // one-verb case and the entire two-door apparatus stops being exercised. A
  // guard that quietly stops checking is worse than one that fails.
  it('some registered show declares more than one way out', () => {
    const many = FORMATS.filter(f => exitVerbs(f).length > 1);
    expect(many.length,
      'No registered show has a second exit verb, so every two-door arm above '
      + 'is running the one-door case and checking nothing. If a show genuinely '
      + 'lost its second door, delete those arms deliberately.')
      .toBeGreaterThan(0);
    // And each verb is distinct, or "printed both verbs" is one verb twice.
    for (const f of many) {
      expect(new Set(exitVerbs(f)).size, `${f} declares the same verb twice`)
        .toBe(exitVerbs(f).length);
    }
  });

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
      // `exitAction` is what the ROOM does — a ballot column is headed with
      // the act, not the participle, and for want of it every camp's grid was
      // headed "Voted to evict". `milestone` is the late-game boundary a
      // career line can say somebody never reached; naming another show's told
      // a castle it "never made the merge".
      for (const key of ['player', 'players', 'round', 'exit', 'exitAction', 'milestone']) {
        expect(w[key], `${format}.words.${key} is missing`).toBeTruthy();
      }
      if (format !== DEFAULT_FORMAT) {
        // Not merely inherited: at least one word has to be this show's own, or
        // every screen will describe it as the default show.
        const mine = SHOWS[format].words || {};
        expect(Object.keys(mine).length,
          `${format} has no words of its own — it will render as ${DEFAULT_FORMAT}`).toBeGreaterThan(0);
        for (const key of ['exit', 'exitAction', 'milestone']) {
          expect(mine[key], `${format} inherits ${DEFAULT_FORMAT}'s ${key}`).toBeTruthy();
        }
      }
    });

    it(`${format} declares the nouns its own fans post about`, () => {
      // js/social/crowd.js builds a third of every night's handles out of
      // these. With one fixed list for the whole franchise, 470 of 1,426 posts
      // on a Traitors night were signed `@campfireapologist`, `@bigjury`,
      // `@antitribal32`, and not one of 698 distinct handles held a word from
      // the show being watched.
      const own = SHOWS[format].words?.fanWords || [];
      expect(own.length,
        `${format} has no fanWords — its viewers will post as ${DEFAULT_FORMAT} fans`)
        .toBeGreaterThan(4);
      expect(leaks(own.join(' '), format), `${format}'s fan words belong to another show`)
        .toEqual([]);
    });

    it(`${format} declares which of its own numbers an article shows`, () => {
      /* A show with no `articleStats` does not fail — it silently gets the
         DEFAULT show's rows, so a castle's profile panel read "Challenge wins"
         and "Idols found" about somebody who won missions and carried a
         Dagger. Writing this guard immediately caught a second instance: Big
         Brother had been left without one and was reading the camp's. */
      const spec = SHOWS[format].articleStats;
      expect(spec, `${format} will show ${DEFAULT_FORMAT}'s numbers under `
        + `${DEFAULT_FORMAT}'s names`).toBeTruthy();
      for (const section of ['career', 'season', 'comps']) {
        expect(Array.isArray(spec[section]) && spec[section].length,
          `${format}.articleStats.${section} is empty`).toBeTruthy();
        for (const [path, label] of spec[section]) {
          expect(typeof path === 'string' && path.length,
            `${format}.articleStats.${section} has a row with no field`).toBeTruthy();
          expect(leaks(String(label), format),
            `${format} labels one of its own numbers in another show's word`)
            .toEqual([]);
        }
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
