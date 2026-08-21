// Trivia that is derived rather than written.
//
// The reference pages carry facts like "the third houseguest to win after being
// nominated in Week 1" and "tied with Jun Song and four others for the second
// fewest HOH wins among winners". Those are queries across every season. Asked
// to write one, a model produces a sentence of exactly that shape with the
// number wrong, and a reader cannot tell. Derived, they are right forever.
//
// Which puts all the risk in two places, and both are guarded here:
//
//   1. AN ORDINAL COMPUTED OFF THE WRONG DATE. The first version sorted on the
//      earliest season a player APPEARED in, and announced "Alejandro was the
//      first contestant to win the game" — he played season 1 and lost it.
//      Lindsay won it. A wrong ordinal is worse than no ordinal: it is
//      confident, checkable, and on a page whose promise is that these are
//      derived.
//
//   2. FACTS THAT ARE ARTEFACTS OF A SMALL SAMPLE. With one season played,
//      "the first winner" is true and worthless. Every claim is gated on the
//      size of the pool it compares against.
import { describe, expect, it } from 'vitest';
import { playerTriviaFor, allPlayerTrivia } from '../js/player-trivia.js';

/** A career shaped like records.js careersIn() produces. */
const career = (id, details, extra = {}) => ({
  id,
  name: id[0].toUpperCase() + id.slice(1),
  seasonsPlayed: details.length,
  wins: details.filter(d => d.placement === 1).length,
  challengeWins: details.reduce((n, d) => n + (d.challengeWins || 0), 0),
  immunityWins: details.reduce((n, d) => n + (d.immunityWins || 0), 0),
  idolsFound: details.reduce((n, d) => n + (d.idolsFound || 0), 0),
  votesAgainst: details.reduce((n, d) => n + (d.votesReceived || 0), 0),
  bestPlacement: Math.min(...details.map(d => d.placement)),
  seasons: details.map(d => d.season),
  details,
  ...extra,
});

const lines = (slug, careers, fmt = 'total-drama') =>
  playerTriviaFor(slug, careers, fmt).join(' | ');

describe('ordinals count from when it happened', () => {
  // Alejandro plays season 1 and LOSES it; Lindsay wins it. Alejandro wins
  // season 4. Sorting on debut makes him "the first to win the game".
  const field = [
    career('alejandro', [{ season: 1, placement: 2 }, { season: 4, placement: 1 }]),
    career('lindsay', [{ season: 1, placement: 1 }]),
    career('duncan', [{ season: 2, placement: 1 }]),
    career('emma', [{ season: 3, placement: 1 }]),
  ];

  it('names the season-1 winner first, not the season-1 runner-up', () => {
    expect(lines('lindsay', field)).toContain('was the first contestant to win the game');
    expect(lines('alejandro', field), 'ordered by debut instead of by the win')
      .not.toContain('first contestant to win the game');
  });

  it('counts the rest in the order they won', () => {
    expect(lines('duncan', field)).toContain('was the second contestant to win the game');
    expect(lines('emma', field)).toContain('was the third contestant to win the game');
    expect(lines('alejandro', field)).toContain('was the fourth contestant to win the game');
  });

  it('names who came before', () => {
    expect(lines('alejandro', field)).toMatch(/following Lindsay, Duncan, and Emma/);
  });

  it('dates a second win by the second win, not the first', () => {
    const twice = [
      ...field,
      career('bob', [{ season: 2, placement: 1 }, { season: 9, placement: 1 }]),
      career('cara', [{ season: 5, placement: 1 }, { season: 6, placement: 1 }]),
      career('dee', [{ season: 7, placement: 1 }, { season: 8, placement: 1 }]),
    ];
    // Bob wins first in season 2 but completes his double in season 9 — last.
    expect(lines('bob', twice)).toContain('the third contestant to win twice');
  });
});

describe('it refuses to state what the sample cannot support', () => {
  it('says nothing about a single winner', () => {
    // One season played: "the first winner" is true and means nothing.
    const one = [
      career('wayne', [{ season: 1, placement: 1, challengeWins: 3 }]),
      ...Array.from({ length: 17 }, (_, i) =>
        career(`hg${i}`, [{ season: 1, placement: i + 2 }])),
    ];
    const out = playerTriviaFor('wayne', one, 'big-brother');
    expect(out.join(' '), 'announced a first from a sample of one')
      .not.toMatch(/first houseguest to win/);
  });

  it('drops a record that a third of the field shares', () => {
    // Eight of twelve winners found no idols. That is a fact about idols, not
    // about any of the eight.
    const winners = Array.from({ length: 12 }, (_, i) =>
      career(`w${i}`, [{ season: i + 1, placement: 1, idolsFound: i < 8 ? 0 : 1 }]));
    expect(playerTriviaFor('w0', winners).join(' '))
      .not.toMatch(/fewest idols/);
  });

  it('still states a record a few people share, and names them', () => {
    const field = Array.from({ length: 12 }, (_, i) =>
      career(`w${i}`, [{ season: i + 1, placement: 1, challengeWins: i < 2 ? 1 : 5 }]));
    const out = playerTriviaFor('w0', field).join(' ');
    expect(out).toMatch(/tied with W1 for the fewest challenge wins among winners, with 1/);
  });

  it('names three and counts the rest rather than listing a crowd', () => {
    const field = Array.from({ length: 30 }, (_, i) =>
      career(`p${i}`, [{ season: 1, placement: i + 1, challengeWins: i < 6 ? 9 : 0 }]));
    const out = playerTriviaFor('p0', field).join(' ');
    expect(out).toMatch(/tied with P1, P2, P3, and 2 others for the most challenge wins/);
  });

  it('never claims a record of zero', () => {
    // "has the most idols found of any contestant, with 0" — nobody found any.
    const field = Array.from({ length: 10 }, (_, i) =>
      career(`p${i}`, [{ season: 1, placement: i + 1, idolsFound: 0 }]));
    expect(playerTriviaFor('p0', field).join(' ')).not.toMatch(/most idols/);
  });
});

describe('each show speaks its own language', () => {
  const bbField = Array.from({ length: 10 }, (_, i) => career(`p${i}`, [{
    season: 1, placement: i + 1,
    bb: { hohWins: i === 0 ? 4 : 0, vetoWins: 0, timesNominated: 1 },
  }]));

  it('a house has Heads of Household, not challenges', () => {
    const out = playerTriviaFor('p0', bbField, 'big-brother').join(' ');
    expect(out).toMatch(/Head of Household wins/);
    expect(out, 'Total Drama vocabulary on a Big Brother page')
      .not.toMatch(/challenge|immunity|idol/i);
    expect(out).toMatch(/houseguest/);
  });

  it('a camp has challenges, not vetoes', () => {
    const tdField = Array.from({ length: 10 }, (_, i) =>
      career(`p${i}`, [{ season: 1, placement: i + 1, challengeWins: i === 0 ? 9 : 0 }]));
    const out = playerTriviaFor('p0', tdField).join(' ');
    expect(out).toMatch(/challenge wins/);
    expect(out, 'Big Brother vocabulary on a Total Drama page')
      .not.toMatch(/Head of Household|veto|Block Buster|houseguest/i);
    expect(out).toMatch(/contestant/);
  });
});

describe('it survives the shapes it will actually be handed', () => {
  it('returns nothing for somebody who is not in the pool', () => {
    expect(playerTriviaFor('nobody', [career('a', [{ season: 1, placement: 1 }])])).toEqual([]);
  });

  it('survives empty and malformed input', () => {
    expect(playerTriviaFor('a', [])).toEqual([]);
    expect(playerTriviaFor('a', [{ id: 'a' }])).toEqual([]);
    expect(allPlayerTrivia([], 'big-brother')).toEqual({});
  });

  it('writes a placement as 3rd, not 3th', () => {
    const field = [
      career('a', [{ season: 1, placement: 3 }, { season: 2, placement: 5 }]),
    ];
    expect(playerTriviaFor('a', field).join(' ')).toContain('as high as 3rd');
  });
});

describe('the article renders them', () => {
  it('is wired through the dossier and into the Trivia section', async () => {
    const { readFileSync } = await import('node:fs');
    const view = readFileSync('js/wiki-view.js', 'utf8');
    const wiki = readFileSync('js/wiki.js', 'utf8');
    const page = readFileSync('player.html', 'utf8');
    expect(wiki, 'buildDossier drops the computed trivia').toMatch(/computedTrivia:/);
    expect(view, 'the article never renders it')
      .toMatch(/dossier\.computedTrivia\?\.\[format\]/);
    expect(page, 'the page never computes it').toMatch(/allPlayerTrivia\(/);
    // Scoped per show: a Big Brother fact must not appear on a Total Drama page.
    expect(wiki).toMatch(/Object\.entries\(triviaByShow\)/);
  });
});

// ── life trivia ───────────────────────────────────────────────────────
//
// The most trivia-shaped facts the franchise produces lived in the life log,
// and this file never read it. Franchise-wide on purpose — a relationship does
// not restart when somebody changes shows — and under the same gates: zero
// weddings in the log means the marriage facts say NOTHING.
import { lifeTriviaFor } from '../js/player-trivia.js';

describe('life trivia', () => {
  const SEASONS = Array.from({ length: 6 }, (_, i) =>
    ({ seasonId: `s-${i + 1}`, airYear: 2020 + i, airSlot: 'spring', title: `S${i + 1}` }));
  const NAMES = Object.fromEntries('abcdefghijkl'.split('').map(c => [c, c.toUpperCase()]));
  const ev = (player, kind, whom, afterSeason, extra = {}) =>
    ({ player, kind, whom, afterSeason, seq: 1, status: 'approved', ...extra });

  // Five stable couples — enough pool for a superlative — with A+B the oldest.
  const COUPLES = ['ab', 'cd', 'ef', 'gh', 'ij'].flatMap((pair, i) =>
    [ev(pair[0], 'dating', pair[1], `s-${i + 1}`)]);

  it('crowns the longest-running couple, on both partners', () => {
    for (const who of ['a', 'b']) {
      const t = lifeTriviaFor(who, { lifeEvents: COUPLES, seasons: SEASONS, names: NAMES });
      expect(t.join(' ')).toMatch(/longest-running couple in the franchise/);
      expect(t.join(' ')).toContain('Spring 2020');
    }
    // And on nobody else.
    expect(lifeTriviaFor('c', { lifeEvents: COUPLES, seasons: SEASONS, names: NAMES })
      .join(' ')).not.toMatch(/longest-running/);
  });

  it('says nothing about a couple that has since broken up', () => {
    const log = [...COUPLES, ev('a', 'broke-up', 'b', 's-6')];
    expect(lifeTriviaFor('a', { lifeEvents: log, seasons: SEASONS, names: NAMES })
      .join(' ')).not.toMatch(/longest-running/);
  });

  it('refuses the superlative when the pool is too small', () => {
    expect(lifeTriviaFor('a', { lifeEvents: COUPLES.slice(0, 3), seasons: SEASONS, names: NAMES }))
      .toEqual([]);
  });

  it('stays silent on marriage with no weddings in the log — the gate is the feature', () => {
    for (const who of Object.keys(NAMES)) {
      expect(lifeTriviaFor(who, { lifeEvents: COUPLES, seasons: SEASONS, names: NAMES })
        .join(' ')).not.toMatch(/marr/i);
    }
  });

  it('orders "married a castmate" by when it happened, not by name', () => {
    const log = [...COUPLES,
      ev('e', 'wedding', 'f', 's-3'),
      ev('a', 'wedding', 'b', 's-5'),
      ev('c', 'wedding', 'd', 's-6')];
    expect(lifeTriviaFor('e', { lifeEvents: log, seasons: SEASONS, names: NAMES })
      .join(' ')).toMatch(/first in the franchise to marry a castmate/);
    expect(lifeTriviaFor('c', { lifeEvents: log, seasons: SEASONS, names: NAMES })
      .join(' ')).toMatch(/fifth in the franchise to marry/);
  });

  it('names the serial dater with their history, endings included', () => {
    const log = [
      ev('a', 'dating', 'b', 's-1'), ev('a', 'broke-up', 'b', 's-2'),
      ev('a', 'dating', 'c', 's-3'), ev('a', 'quietly-ended', 'c', 's-4'),
      ev('a', 'dating', 'd', 's-5'),
    ];
    const t = lifeTriviaFor('a', { lifeEvents: log, seasons: SEASONS, names: NAMES }).join(' ');
    expect(t).toMatch(/dated 3 fellow players/);
  });

  it('reads approved rows only, like every reader', () => {
    const proposed = COUPLES.map(e => ({ ...e, status: 'proposed' }));
    expect(lifeTriviaFor('a', { lifeEvents: proposed, seasons: SEASONS, names: NAMES }))
      .toEqual([]);
  });
});
