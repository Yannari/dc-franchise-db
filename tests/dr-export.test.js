// ══════════════════════════════════════════════════════════════════════
// dr-export.test.js — the document the rest of the site reads
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import {
  DRAG_FORMAT, seasonFilePath, episodeStoreKey, analyticsKey,
  dragEpisodes, dragPlacements, dragCareerStats, dragSeasonDetails,
  buildDragSeasonDocument,
} from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { SHOWS } from '../js/shows.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];

function cast(n = 12, seed = 1) {
  const rng = rngFor(seed);
  const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen ${i + 1}`, slug: `queen-${i + 1}`, gender: 'f',
    archetype: i % 2 ? 'villain' : 'hero', age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

function season(seed = 4, n = 12) {
  const c = cast(n, 100 + seed);
  const bonds = {};
  const key = (a, b) => [a, b].sort().join('|');
  const r = rngFor(seed * 7919 + 13);
  for (let i = 0; i < c.length; i++) {
    for (let j = i + 1; j < c.length; j++) bonds[key(c[i].name, c[j].name)] = Math.round((r() - 0.5) * 14);
  }
  return playDragSeason({
    cast: c, seed,
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
  });
}

describe('the keys', () => {
  it('are prefixed the way the registry says, and never a bare integer', () => {
    // A bare integer means Total Drama, permanently. Every other show is
    // prefixed, and getting this wrong collides two shows' saves.
    expect(seasonFilePath(3)).toBe('data/seasons/dr-3-data.json');
    expect(episodeStoreKey(3, 5)).toBe('dr_episode_s3_e5');
    expect(analyticsKey(3)).toBe('AI_ANALYTICS_dr-3');
    expect(DRAG_FORMAT).toBe('drag-race');
    expect(SHOWS[DRAG_FORMAT].prefix).toBe('dr');
  });
});

describe('dragEpisodes', () => {
  const { rows } = season();
  const eps = dragEpisodes(rows);

  it('gives one entry per episode, in order', () => {
    expect(eps.length).toBe(rows.length);
    eps.forEach((e, i) => expect(e.episode).toBe(rows[i].num));
  });

  it('EVERY QUEEN HAS A CELL IN EVERY EPISODE', () => {
    // The whole reason the exporter looks like this: a track record chart has
    // a row per queen and a column per episode, and a row that stops early
    // cannot be drawn. A queen already gone is `OUT`, not absent.
    const width = eps[0].placements.length;
    expect(width).toBe(12);
    for (const e of eps) {
      expect(e.placements.length, `episode ${e.episode} is a short row`).toBe(width);
      const names = e.placements.map(p => p.name);
      expect(new Set(names).size, `episode ${e.episode} repeats a queen`).toBe(width);
    }
  });

  it('uses only the results the grid knows', () => {
    // BTM2 lip synced and survived; BTM was named in the bottom and saved.
    const OK = ['WIN', 'HIGH', 'SAFE', 'LOW', 'BTM', 'BTM2', 'ELIM', 'OUT', 'WINNER', 'FINALIST'];
    for (const e of eps) {
      for (const p of e.placements) {
        expect(OK, `episode ${e.episode}: ${p.name} is "${p.result}"`).toContain(p.result);
      }
    }
  });

  it('marks a queen OUT for every episode after she leaves, and never before', () => {
    for (const name of eps[0].placements.map(p => p.name)) {
      const seq = eps.map(e => e.placements.find(p => p.name === name).result);
      const gone = seq.indexOf('ELIM');
      if (gone === -1) continue;
      for (let i = 0; i < gone; i++) {
        expect(seq[i], `${name} was OUT before she left`).not.toBe('OUT');
      }
      for (let i = gone + 1; i < seq.length; i++) {
        expect(['OUT'], `${name} came back as ${seq[i]}`).toContain(seq[i]);
      }
    }
  });

  it('NEVER writes `eliminated`, because this show has no vote', () => {
    // Every existing reader of `eliminated` in this codebase means "the person
    // the house voted out". A name here would make a drag season read as an
    // eviction across half the site.
    for (const e of eps) {
      expect(e.eliminated, `episode ${e.episode} filled in eliminated`).toBeNull();
      for (const x of e.exits) {
        expect(x.name).toBeTruthy();
        expect(x.verb, 'an exit with no verb').toBeTruthy();
      }
    }
  });

  it('carries the night: challenge, judges, runway, and the song when there was one', () => {
    const withLipsync = eps.filter(e => e.lipsync);
    expect(withLipsync.length).toBeGreaterThan(3);
    for (const e of withLipsync) {
      expect(e.song?.title, `episode ${e.episode} lip synced to nothing`).toBeTruthy();
      expect(e.lipsync.queens.length).toBeGreaterThanOrEqual(2);
    }
    const normal = eps.filter(e => e.challenge && e.challenge.id !== 'finale');
    for (const e of normal) {
      expect(e.challenge.name, `episode ${e.episode} has no challenge name`).toBeTruthy();
      expect(e.judges.length, `episode ${e.episode} had no panel`).toBeGreaterThan(0);
    }
  });
});

describe('dragPlacements', () => {
  const { rows } = season();
  const p = dragPlacements(rows);

  it('places everybody exactly once, from the crown down', () => {
    expect(p.length).toBe(12);
    expect(p.map(x => x.placement)).toEqual([...Array(12)].map((_, i) => i + 1));
    expect(new Set(p.map(x => x.name)).size).toBe(12);
    expect(p[0].status).toBe('Winner');
    expect(p[1].status).toBe('Runner-up');
  });

  it('gives everybody else the verb they actually left by, capitalised', () => {
    for (const x of p.slice(2)) {
      expect(x.status, `${x.name} has no status`).toBeTruthy();
      expect(x.status[0]).toBe(x.status[0].toUpperCase());
    }
  });

  it('orders the eliminated by when they went, latest first', () => {
    const leftAt = {};
    rows.forEach((r, i) => { for (const x of r.exits || []) leftAt[x.name] = i; });
    const eliminated = p.filter(x => leftAt[x.name] !== undefined);
    for (let i = 1; i < eliminated.length; i++) {
      expect(leftAt[eliminated[i].name],
        `${eliminated[i].name} placed below somebody who left earlier`)
        .toBeLessThanOrEqual(leftAt[eliminated[i - 1].name]);
    }
  });
});

describe('career stats', () => {
  const { rows } = season();

  it('match the registry keys the rest of the site reads', () => {
    const keys = SHOWS[DRAG_FORMAT].careerStats.map(([path]) => path.replace('dr.', ''));
    const stats = dragCareerStats(rows, dragPlacements(rows)[0].name);
    for (const k of keys) {
      expect(stats, `careerStats promises dr.${k} and the exporter has no such field`)
        .toHaveProperty(k);
    }
  });

  it('count what actually happened', () => {
    for (const name of dragPlacements(rows).map(p => p.name)) {
      const s = dragCareerStats(rows, name);
      const wins = rows.filter(r => (r.dr?.call?.win || []).includes(name)).length;
      expect(s.wins, name).toBe(wins);
      expect(s.lipsyncWins).toBeLessThanOrEqual(s.bottoms + 1);
    }
  });

  it('a season detail names the placement and the format', () => {
    const top = dragPlacements(rows)[0].name;
    const d = dragSeasonDetails(rows, 3, top);
    expect(d.format).toBe(DRAG_FORMAT);
    expect(d.season).toBe(3);
    expect(d.placement).toBe(1);
    expect(d.status).toBe('Winner');
    expect(d.dr.wins).toBeGreaterThanOrEqual(0);
  });
});

describe('the whole document', () => {
  const { rows } = season();
  const doc = buildDragSeasonDocument(rows, { seasonNumber: 3, twists: ['smackdown'] });

  it('has the top-level shape the site expects', () => {
    for (const k of ['seasonNumber', 'format', 'seasonId', 'castSize', 'episodeCount',
      'winner', 'winners', 'placements', 'twists', 'finale']) {
      expect(doc, `the document has no ${k}`).toHaveProperty(k);
    }
    expect(doc.seasonId).toBe('dr-3');
    expect(doc.format).toBe(DRAG_FORMAT);
    expect(doc.castSize).toBe(12);
  });

  it('puts the rounds where the registry says they live', () => {
    // roundsPath is 'dr.episodes'. A reader that follows the registry has to
    // find them there or the season page draws nothing.
    const path = SHOWS[DRAG_FORMAT].roundsPath.split('.');
    let node = doc;
    for (const key of path) node = node?.[key];
    expect(Array.isArray(node), `nothing at ${SHOWS[DRAG_FORMAT].roundsPath}`).toBe(true);
    expect(node.length).toBe(doc.episodeCount);
  });

  it('names a winner consistently in all three places', () => {
    expect(doc.winner.name).toBe(doc.winners[0]);
    expect(doc.placements[0].name).toBe(doc.winner.name);
    expect(doc.finale.placements[0]).toBe(doc.winner.name);
    // The winner has no vote count: nobody voted for anybody.
    expect(doc.winner.vote).toBe('');
  });

  it('survives the round trip through JSON, because that is how it is stored', () => {
    const back = JSON.parse(JSON.stringify(doc));
    expect(back).toEqual(doc);
  });

  it('hands Miss Congeniality her title when the season named one', () => {
    const name = dragPlacements(rows)[5].name;
    const withAward = buildDragSeasonDocument(rows, { seasonNumber: 3, congeniality: name });
    const row = withAward.placements.find(p => p.name === name);
    expect(row.status).toBe(SHOWS[DRAG_FORMAT].words.audienceAward);
    expect(withAward.congeniality).toBe(name);
  });
});
