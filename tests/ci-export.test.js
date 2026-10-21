// ══════════════════════════════════════════════════════════════════════
// ci-export.test.js — a Circle season as the document the site reads
// ══════════════════════════════════════════════════════════════════════
// docs/ADDING-A-SHOW.md §5 (the document every show carries), §5.1 (dated on
// the franchise calendar), §8.4 (placements the canon loader compares with the
// ledger record, place for place, as a standard ranking of PEOPLE) and the
// life layer's fields. The user, 2026-10-17: "build an exporter for the circle".
// Played through the real run loop, so the queue, gs.ci.record and the rows
// are exactly what the Export button sees.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, setGs, setPlayers, seasonConfig, TWIST_CATALOG } from '../js/core.js';
import { simulateCircleEpisode } from '../js/ci-run.js';
import { buildCircleSeasonDocument } from '../js/ci/export.js';
import { seasonExporterFor, exportCircleSeason, mergeCircleSeason, mergeCircleSeasonsDatabase } from '../js/stats-export.js';
import { roundLedger } from '../js/wiki-fill.js';
import { CIRCLE_FORMAT, roundShape, SHOWS } from '../js/shows.js';
import { setFranchiseLedger, applyPublishedSeason, activeSeasons } from '../js/franchise-meta.js';
import { episodeText } from '../js/ci/transcript.js';
import { makePlayers } from './helpers/ci-cast.js';

function fresh(seed, extra = {}) {
  Object.assign(seasonConfig, { format: CIRCLE_FORMAT, seasonNumber: 3, name: '', ciSetup: {}, ciPool: [], twistSchedule: [],
    ciDays: null, ciFinalists: 5, ciNewcomerRule: 'rate-not-rated', ciPickBy: 'stats', ciAI: false, franchiseMeta: false, ...extra });
  const cast = makePlayers(13, seed);
  setPlayers(cast);
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ci: { seed: seed * 101 }, seasonNumber: 3 });
  return cast.map(p => p.name);
}
const playAll = () => { for (let i = 0; i < 60; i++) if (!simulateCircleEpisode()) break; };

const played = {};
function season(seed, { pair = false } = {}) {
  const k = `${seed}|${pair}`;
  if (played[k]) return played[k];
  const names = fresh(seed);
  if (pair) seasonConfig.ciSetup = { [names[1]]: { partner: names[0] } };
  playAll();
  const rows = gs.episodeHistory.filter(r => r.format === CIRCLE_FORMAT);
  const record = JSON.parse(JSON.stringify(gs.ci.record));
  const doc = buildCircleSeasonDocument(rows, record, { seasonNumber: 3 });
  return (played[k] = { names, rows, record, doc, queue: [...(gs._ciQueue || [])] });
}

describe('The Circle exporter', () => {
  beforeAll(() => { season(4); season(9); season(5, { pair: true }); });

  it('is registered, so the export never falls through to Total Drama', () => {
    expect(seasonExporterFor(CIRCLE_FORMAT)).toBe(exportCircleSeason);
    expect(roundShape(CIRCLE_FORMAT)).toBe('ballots');
  });

  it('refuses a season that still has episodes to air', async () => {
    fresh(4);
    simulateCircleEpisode();
    expect(gs._ciQueue.length).toBeGreaterThan(0);
    await expect(exportCircleSeason(() => {})).rejects.toThrow(/still to air/);
  });

  it('carries the identity every show carries (§5)', () => {
    const { doc } = season(4);
    expect(doc.format).toBe(CIRCLE_FORMAT);
    expect(doc.seasonNumber).toBe(3);
    expect(doc.seasonId).toBe('ci-3');
    expect(doc.title).toBe('The Circle 3');
    expect(Array.isArray(doc.twists)).toBe(true);
    expect(doc.exitVerbs[0]).toBe(SHOWS[CIRCLE_FORMAT].words.exit);
  });

  it('places everybody once, from the ledger record, as a standard ranking the canon loader keeps', () => {
    for (const k of Object.keys(played)) {
      const { doc, names, record } = played[k];
      expect(doc.placements.map(p => p.name).sort(), k).toEqual(Object.keys(record.players).sort());
      for (const n of names) expect(doc.placements.some(p => p.name === n), `${k} ${n}`).toBe(true);
      for (const p of doc.placements) {
        expect(p.placement, `${k} ${p.name}`).toBe(record.players[p.name].placement);
        expect(p.playerSlug).toMatch(/^[a-z0-9-]+$/);
        expect(['Winner', 'Finalist', 'Blocked']).toContain(p.status);
        // everybody at place p has exactly p-1 people ahead (a pair at 3rd makes the next player 5th)
        expect(doc.placements.filter(q => q.placement < p.placement).length, `${k} ${p.name} at ${p.placement}`).toBe(p.placement - 1);
      }
      setFranchiseLedger({ v: 2, active: 'x', franchises: { x: { name: 'x', seasons: { 'ci-3': { ...record, format: CIRCLE_FORMAT } } } } });
      applyPublishedSeason(doc, CIRCLE_FORMAT, 3);
      const kept = activeSeasons()['ci-3'];
      for (const n of Object.keys(record.players)) expect(kept.players[n].allies, `${k} ${n}`).toEqual(record.players[n].allies);
    }
  });

  it('the winner is at placement 1, and a winning shared profile is two winners', () => {
    for (const k of Object.keys(played)) {
      const { doc, record } = played[k];
      const won = Object.entries(record.players).filter(([, r]) => r.winner).map(([n]) => n).sort();
      expect(won.length, k).toBeGreaterThan(0);
      expect(doc.placements.filter(p => p.status === 'Winner').map(p => p.name).sort()).toEqual(won);
      expect(doc.placements.filter(p => p.status === 'Winner').every(p => p.placement === 1)).toBe(true);
      expect(doc.winners.map(w => w.name).sort()).toEqual(won);
      if (won.length === 1) expect(doc.winner.name).toBe(won[0]); else expect(doc.winner).toBe(null);
      expect(doc.finalRatings.length).toBeGreaterThan(1);
      expect(doc.finalRatings[0].place).toBe(1);
    }
  });

  it('two people sharing a profile share its place', () => {
    const { doc, names } = season(5, { pair: true });
    const [a, b] = names;
    const pa = doc.placements.find(p => p.name === a);
    const pb = doc.placements.find(p => p.name === b);
    expect(pa.placement).toBe(pb.placement);
    expect(pa.ci.sharedWith).toContain(b);
  });

  it('one votingHistory row an episode: every block on exits[], ratings beside it, never a vote', () => {
    for (const k of Object.keys(played)) {
      const { doc, rows } = played[k];
      expect(doc.votingHistory.length, k).toBe(rows.length);
      expect(doc.episodeCount).toBe(rows.length);
      let ratings = 0;
      for (const [i, h] of doc.votingHistory.entries()) {
        expect(h.exits.map(x => x.name)).toEqual((rows[i].exits || []).map(x => x.name));
        expect(h.votes).toEqual([]);
        for (const x of h.exits) {
          expect(x.verb).toBe('blocked');
          const p = doc.placements.find(q => q.name === x.name);
          // a blocked player who came back (a second chance) may still finish the season
          if (p.status === 'Blocked' && !doc.votingHistory.slice(i + 1).some(l => l.exits.some(y => y.name === x.name))) {
            expect(p.exitEpisode, `${k} ${x.name}`).toBe(h.episode);
          }
        }
        if (h.ratings) {
          ratings++;
          expect(h.ratings.results.every(r => r.profile && r.people.length)).toBe(true);
        }
      }
      expect(ratings, k).toBeGreaterThan(2);
      // the wiki's round reader understands it without a third shape
      const ledger = roundLedger(doc);
      expect(Array.isArray(ledger) ? ledger.length : Object.keys(ledger || {}).length).toBeGreaterThan(0);
    }
  });

  it('every appearance carries the registry careerStats and the relationships the life layer reads', () => {
    let influencers = 0, blocks = 0;
    for (const k of Object.keys(played)) {
      const { doc, record } = played[k];
      for (const p of doc.placements) {
        for (const [path] of SHOWS[CIRCLE_FORMAT].careerStats) {
          const v = path.split('.').reduce((o, key) => o?.[key], p);
          expect(typeof v, `${k} ${p.name} ${path}`).toBe('number');
        }
        influencers += p.ci.influencerTimes; blocks += p.ci.blocksMade;
        const r = record.players[p.name];
        expect(p.alliances).toEqual(r.allies);
        expect(p.rivalries).toEqual(r.rivals);
        expect(p.betrayedBy).toEqual(r.betrayedBy);
        if (r.showmances.length) {
          expect(r.showmances.map(s => s.partner)).toContain(p.showmance);
          expect(['intact', 'broken']).toContain(p.showmanceEnded);
        } else expect(p.showmance).toBeUndefined();
        expect(p.votesReceived).toBe(0);
      }
      // a catfish season is credited to the person behind the persona
      for (const c of doc.catfish) expect(doc.placements.find(p => p.name === c.name).ci.catfishSeasons).toBe(1);
    }
    expect(influencers).toBeGreaterThan(0);
    expect(blocks).toBeGreaterThan(0);
  });

  it('merges into players_database with the format stamped, and onto the calendar in its home quarter', () => {
    const { doc } = season(4);
    const db = mergeCircleSeason({ players: [] }, doc);
    for (const p of doc.placements) {
      const pl = db.players.find(x => x.id === p.playerSlug);
      const det = pl.seasonDetails.find(d => d.season === 3);
      expect(det.format, p.name).toBe(CIRCLE_FORMAT);
      expect(det.placement).toBe(p.placement);
      expect(det.ci.influencerTimes).toBe(p.ci.influencerTimes);
      if (p.status === 'Winner') expect(pl.wins).toBe(1);
    }
    const again = mergeCircleSeason(db, doc);
    expect(again.players.find(x => x.id === doc.placements[0].playerSlug).seasonDetails
      .filter(d => d.season === 3 && d.format === CIRCLE_FORMAT).length).toBe(1);
    const sdb = mergeCircleSeasonsDatabase({ seasons: [
      { seasonNumber: 1, format: 'drag-race', seasonId: 'dr-1', airYear: 2027, airSlot: 'winter' },
    ] }, doc);
    const row = sdb.seasons.find(s => s.format === CIRCLE_FORMAT && s.seasonNumber === 3);
    expect(row.status).toBe('Complete');
    expect(row.seasonId).toBe('ci-3');
    expect(row.winners.map(w => w.name).sort()).toEqual(doc.winners.map(w => w.name).sort());
    // dated in The Circle's home quarter (spring), after what aired last (ADDING-A-SHOW §5.1)
    expect({ airYear: row.airYear, airSlot: row.airSlot }).toEqual({ airYear: 2027, airSlot: 'spring' });
  });

  it('keeps the window the season fixed when it started (js/air-watch.js), whatever was exported since', () => {
    const { doc } = season(4);
    gs.airWindow = { airYear: 2029, airSlot: 'spring' };
    try {
      const sdb = mergeCircleSeasonsDatabase({ seasons: [
        { seasonNumber: 1, format: 'drag-race', seasonId: 'dr-1', airYear: 2028, airSlot: 'winter', episodeCount: 16 },
      ] }, doc);
      const row = sdb.seasons.find(s => s.format === CIRCLE_FORMAT && s.seasonNumber === 3);
      expect({ airYear: row.airYear, airSlot: row.airSlot }).toEqual({ airYear: 2029, airSlot: 'spring' });
    } finally { delete gs.airWindow; }
  });

  it('names a blocking format once, on the night it decided, and never the default arrival', () => {
    let formats = 0;
    for (const k of Object.keys(played)) {
      const { doc, rows } = played[k];
      for (const t of doc.twists) {
        expect(t.type, k).not.toBe('ci-arrive-snoop');
        const fmt = TWIST_CATALOG.find(c => c.id === t.type)?.ciFormat;
        if (!fmt) continue;
        formats++;
        // the row it is credited to holds a night (its ratings named the Influencers)...
        expect(rows.find(r => r.num === t.episode)?.ci?.night, `${k} ${t.type} ep${t.episode}`).toBeTruthy();
        // ...and the blocking that aired the next episode is not credited a second time
        expect(doc.twists.filter(o => o.type === t.type && o.episode === t.episode + 1).length).toBe(0);
      }
    }
    expect(formats).toBeGreaterThan(0);
  });

  it('every episode has a transcript for the wiki fills', () => {
    const { rows } = season(4);
    for (const r of rows) expect(episodeText(r).length, `episode ${r.num}`).toBeGreaterThan(200);
  });
});

// The user, 2026-10-21: the site had Luis as Lila's showmance; it was Mateo, the face of the profile the brothers
// shared. A record built before the rule gave the romance to both; the export puts it right from the rows.
describe('a showmance with a shared profile', () => {
  it('is the face\'s, and the other one of the two has none', async () => {
    const { ciPlacements } = await import('../js/ci/export.js');
    const rows = [{ num: 1, ci: { profiles: { '@mateo': { name: 'Mateo', people: ['Mateo', 'Luis'] }, '@lila': { name: 'Lila', people: ['Lila'] } }, aired: [] } }];
    const record = { players: {
      Lila: { placement: 1, winner: true, showmances: [{ partner: 'Mateo', ended: 'intact' }, { partner: 'Luis', ended: 'intact' }] },
      Luis: { placement: 7, showmances: [{ partner: 'Lila', ended: 'intact' }] },
      Mateo: { placement: 7, showmances: [{ partner: 'Lila', ended: 'intact' }] } } };
    const p = Object.fromEntries(ciPlacements(rows, record).map(x => [x.name, x]));
    expect(p.Lila.showmance).toBe('Mateo');
    expect(p.Lila.showmances).toBeUndefined();
    expect(p.Luis.showmance).toBeUndefined();
    expect(p.Mateo.showmance).toBe('Lila');
  });
});

// The user, 2026-10-21: "can u store those photo in R2 cloudfare like the rest?" The record names each player's
// photos by id (kept in R2), so every page in every browser can find them.
describe('the published photos', () => {
  it('a player\'s own photos and the catfish profile the room saw, by id; never a roster face', async () => {
    const { ciPlacements } = await import('../js/ci/export.js');
    const rows = [{ num: 1, ci: { profiles: { '@nadiya': { name: 'Nadiya', people: ['Hector'], mode: 'catfish', personaId: 'p1' },
      '@lila': { name: 'Lila', people: ['Lila'], mode: 'honest' } }, aired: [] } }];
    const record = { players: { Hector: { placement: 2 }, Lila: { placement: 1, winner: true } } };
    const photos = { ciPhotos: { Lila: { throwback: 'photo:t1', profile: 'portrait:Lila' }, Hector: { real: 'photo:r1' } },
      pool: [{ id: 'p1', handle: 'Nadiya', face: 'photo:n1', photos: { naughty: 'photo:n2' } }] };
    const p = Object.fromEntries(ciPlacements(rows, record, photos).map(x => [x.name, x]));
    expect(p.Lila.ci.photos).toEqual({ own: { throwback: 'photo:t1' }, persona: {} });
    expect(p.Hector.ci.photos).toEqual({ own: { real: 'photo:r1' }, persona: { profile: 'photo:n1', naughty: 'photo:n2' } });
    expect(ciPlacements(rows, record).find(x => x.name === 'Lila').ci.photos).toBeUndefined();
  });
});
