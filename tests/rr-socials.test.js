// The race on the four socials (the user, 2026-11-03: "theres no exit interview for the eliminated in ridonculous race
// theres no social at all for this show"): Kristal-talKs interviews every team that goes out and every finalist, and a
// published race reaches Birdie and ChatAlumni (it published nothing they could read: 0 episodes from a document whose
// live season had 13 legs of events), and its interviews reach the seasons row that Kristal and Dramagram read.
import { describe, it, expect, beforeAll } from 'vitest';
import { gs, setGs, setPlayers, seasonConfig, players } from '../js/core.js';
import { setFranchiseLedger } from '../js/franchise-meta.js';
import { simulateRaceEpisode, raceRows } from '../js/rr-run.js';
import { playRaceSeason } from '../js/rr/season.js';
import { airSeason } from '../js/rr/episode.js';
import { rrLedgerRecord } from '../js/rr/ledger-record.js';
import { buildRaceSeasonDocument } from '../js/rr/export.js';
import { mergeRaceSeasonsDatabase } from '../js/stats-export.js';
import { episodesOf } from '../js/social/archive.js';
import { extractEvents } from '../js/social/events.js';
import { packFor } from '../js/social/packs/index.js';
import { publishedExits } from '../js/exit-interview/house.js';
import { composeExit, pronounsFor } from '../js/kristal-exit.js';
import { RACE_FORMAT } from '../js/shows.js';
import { raceCast } from './helpers/rr-cast.js';

const VOTE = /\b(vote[sd]?|voting|jury|the numbers|ballots?|evict(ed|ion)?|nominat\w*|tribal|the block)\b/i;

describe('a published race reaches Birdie and ChatAlumni', () => {
  it('reads every leg off the document, with the same moments as the live season', () => {
    const { cast, teams } = raceCast(12, 7); setPlayers(cast);
    const res = playRaceSeason({ teams, seed: 7 });
    const rows = raceRows(res, airSeason(res));
    const doc = JSON.parse(JSON.stringify(buildRaceSeasonDocument(rows, rrLedgerRecord(res.state, res, {}), { seasonNumber: 1 })));
    const eps = episodesOf(doc, RACE_FORMAT);
    expect(eps.length).toBe(rows.length);
    const kinds = list => list.flatMap(e => extractEvents(e.record, { format: RACE_FORMAT, season: 1, episode: e.episode },
      packFor(RACE_FORMAT).context(doc)).map(x => x.kind)).sort();
    expect(kinds(eps)).toEqual(kinds(rows.map(r => ({ record: r, episode: r.num }))));
    // (slim: what the feed reads, not the transcript)
    expect(JSON.stringify(doc.legs).length).toBeLessThan(JSON.stringify(rows).length / 3);
  }, 300000);
});

describe('Kristal-talKs on the race', () => {
  let recs = [];
  beforeAll(() => {
    Object.assign(seasonConfig, { format: RACE_FORMAT, seasonNumber: 1, name: '', twistSchedule: [], franchiseMeta: false });
    const { cast, teams } = raceCast(10, 9);
    const partner = Object.fromEntries(teams.flatMap(t => [[t.a, t.b], [t.b, t.a]]));
    setPlayers(cast.map(p => ({ ...p, chPartner: partner[p.name] })));
    setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], rr: { seed: 909 }, seasonNumber: 1 });
    setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
    for (let i = 0; i < 40; i++) if (!simulateRaceEpisode()) break;
    recs = (gs.exitInterviews || []).filter(r => r.show === RACE_FORMAT);
  }, 300000);

  it('interviews both of every team that went out, the same night, as partners, and every finalist', () => {
    const out = recs.filter(r => r.kind !== 'finalist');
    expect(out.length).toBeGreaterThan(6);
    for (const r of out) {
      expect(['raced-last', 'found-on-the-road', 'cut-at-halfway', 'medical', 'walked']).toContain(r.kind);
      expect(r.story?.partner?.who, r.guest).toBeTruthy();
      expect(out.some(x => x.guest === r.story.partner.who && x.week === r.week), `${r.guest}'s partner`).toBe(true);
    }
    expect(recs.filter(r => r.kind === 'finalist').some(r => r.placement === 1)).toBe(true);
  });

  it('asks about their own race first, by how it ended, and never says a word about votes', () => {
    const used = new Set(), earlier = [];
    for (const rec of recs) {
      const ep = { id: `k-${rec.id}`, record: rec, guestName: rec.guest, season: { format: RACE_FORMAT },
        pronouns: pronounsFor(players.find(p => p.name === rec.guest)?.gender) };
      const t = composeExit(ep, { words: { round: 'Leg' }, earlier, used });
      earlier.push({ ...t, record: rec });
      for (const x of [{ q: t.coldOpen }, ...(t.exchanges || [])]) for (const s of [x.q, x.a].filter(Boolean)) expect(s, rec.guest).not.toMatch(VOTE);
      const first = (t.exchanges || [])[0];
      if (rec.kind !== 'finalist') expect(first?.topic, rec.guest).toBe('rr-exit');
      expect((t.exchanges || []).some(x => x.topic === 'rr-partner' || x.topic === 'rr-final'), rec.guest).toBe(true);
    }
  });

  it('goes on the season document and the seasons row, where Kristal and Dramagram read it', () => {
    const rows = gs.episodeHistory.filter(r => r.rr);
    const doc = buildRaceSeasonDocument(rows, gs.rr.record, { seasonNumber: 1 });
    doc.exitInterviews = publishedExits(RACE_FORMAT);
    expect(doc.exitInterviews.length).toBe(recs.length);
    const db = mergeRaceSeasonsDatabase({ seasons: [] }, doc);
    expect(db.seasons[0].exitInterviews.length).toBe(recs.length);
  });
});
