// ══════════════════════════════════════════════════════════════════════
// dr-readers.test.js — the change is not the field, it is every reader
// ══════════════════════════════════════════════════════════════════════
//
// A fourth show does not arrive by exporting a document. It arrives when
// every screen that used to ask "is `weeks` non-empty?" stops asking, because
// that question is a two-show world wearing a boolean, and a show that
// exports NEITHER array falls out of both branches and is drawn nothing.
import { describe, expect, it } from 'vitest';
import { roundShape, seasonRounds, roundExits, SHOWS } from '../js/shows.js';
import { roundLedger } from '../js/wiki-fill.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';
import { extractEvents } from '../js/social/events.js';
import { episodesOf, stillIn } from '../js/social/archive.js';
import { episodeRecords } from '../js/social/live.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 10, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const season = playDragSeason({ cast: cast(10, 5), seed: 9 });
const doc = buildDragSeasonDocument(season.rows, { seasonNumber: 1 });
const episodes = doc.dr.episodes;

describe('the registry answers the shape question', () => {
  it('every show declares one, and they are the three that exist', () => {
    for (const fmt of Object.keys(SHOWS)) {
      expect(['ballots', 'weeks', 'placements'], fmt).toContain(roundShape(fmt));
    }
    expect(roundShape('drag-race')).toBe('placements');
    expect(roundShape('big-brother')).toBe('weeks');
    expect(roundShape('total-drama')).toBe('ballots');
    expect(roundShape('the-traitors')).toBe('ballots');
    // An unknown format gets the DEFAULT SHOW's shape, never another show's.
    expect(roundShape('nonsense')).toBe('ballots');
  });
});

describe('roundLedger reads the third array', () => {
  const rows = roundLedger(doc);

  it('produces one entry per episode, named in the show\'s word', () => {
    expect(rows.length).toBe(episodes.length);
    expect(rows[0].word).toBe(SHOWS['drag-race'].words.round);
    expect(rows.map(r => r.n)).toEqual(episodes.map(e => e.episode));
  });

  it('states what happened without inventing a vote', () => {
    const text = rows.map(r => (r.facts || []).join(' ')).join(' ');
    expect(text).not.toMatch(/votes:/);
    expect(text).toMatch(/won the maxi challenge/i);
    expect(text).toMatch(/lip synced/i);
    expect(foreignWordsIn(text, 'drag-race')).toEqual([]);
  });

  it('names who left, with this show\'s verb', () => {
    const withExit = rows.filter(r => (r.facts || []).some(f => /sashayed away/.test(f)));
    expect(withExit.length).toBeGreaterThan(0);
    for (const r of withExit) expect(r.gone).toBeTruthy();
  });

  it('a ledger built from a BALLOT show is untouched by any of this', () => {
    // The regression that matters most here: the placement branch must not
    // have changed what fourteen published Total Drama seasons render.
    const td = roundLedger({
      format: 'total-drama',
      votingHistory: [{ episode: 1, eliminated: 'Gwen', votes: [{ voter: 'Duncan', target: 'Gwen' }] }],
    });
    expect(td[0].facts).toContain('votes: Gwen 1');
    expect(td[0].facts).toContain('Gwen was eliminated');
  });
});

describe('roundExits on a placement round', () => {
  it('reads exits[] and never falls back to eliminated', () => {
    for (const e of episodes) {
      const x = roundExits(e, 'drag-race');
      expect(x.length).toBe(e.exits.length);
      for (const one of x) {
        expect(one.verb).toBe('sashayed away');
        expect(one.channel).toBe('lipsync');
      }
    }
    expect(episodes.some(e => e.exits.length)).toBe(true);
  });
});

describe('seasonRounds finds the live array', () => {
  it('resolves dr.episodes off gs AND off the published document', () => {
    expect(seasonRounds({ dr: { episodes: season.rows } }, 'drag-race').length)
      .toBe(season.rows.length);
    expect(seasonRounds(doc, 'drag-race').length).toBe(episodes.length);
  });
});

describe('the audience feed reads a night with no ballot in it', () => {
  it('the archive gives every episode a night, not just the finale', () => {
    // The failure it replaced: no `weeks`, no `votingHistory`, and the
    // episodes are not at `doc.episodes` either, so a fourteen-episode season
    // was given ONE night. An archive with a hole in it looks like a working
    // archive.
    const nights = episodesOf(doc, 'drag-race');
    expect(nights.length).toBe(episodes.length);
    expect(nights[nights.length - 1].record.isFinale).toBe(true);
  });

  it('extracts the call, the lip sync and the exit — on BOTH paths', () => {
    // The played row and the published episode are different shapes of the
    // same night, and a reader that knows one emits nothing on the other.
    const shapes = {
      published: episodes.find(e => e.exits.length && e.lipsync?.winner),
      played: season.rows.find(r => (r.exits || []).length && r.dr?.lipsync?.winner),
    };
    for (const [label, ep] of Object.entries(shapes)) {
      expect(ep, `no ${label} night to test`).toBeTruthy();
      const kinds = new Set(extractEvents(ep, { format: 'drag-race', season: 1, episode: 3 })
        .map(e => e.kind));
      for (const want of ['comp-win', 'nomination', 'domination', 'eviction']) {
        expect(kinds, `${label}: no ${want}`).toContain(want);
      }
    }
  });

  it('a played season reaches the live feed through the registry path', () => {
    const recs = episodeRecords({ dr: { episodes: season.rows } }, 'drag-race');
    expect(recs.length).toBe(season.rows.length);
  });

  it('stillIn knows who is gone WITHOUT a ballot to read it from', () => {
    // With no votingHistory nobody was ever marked out, so the predictions
    // panel offered the whole cast in PLACEMENT ORDER — the answer, not a
    // prediction.
    const half = Math.ceil(episodes.length / 2);
    const left = stillIn(doc, 'drag-race', half);
    const goneByThen = episodes.slice(0, half).flatMap(e => e.exits.map(x => x.name));
    expect(goneByThen.length).toBeGreaterThan(0);
    for (const name of goneByThen) {
      expect(left.map(p => p.name), `${name} is still listed as playing`).not.toContain(name);
    }
    expect(left.length).toBe(doc.castSize - goneByThen.length);
  });
});
