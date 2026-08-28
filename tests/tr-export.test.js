// ══════════════════════════════════════════════════════════════════════
// tr-export.test.js — a finished season, in the shape the site reads
// ══════════════════════════════════════════════════════════════════════
//
// Everything here runs off REAL SEASONS from `playTraitorsSeason`, not a
// fixture, because the export's whole job is to describe what the engine
// actually produced. A fixture-shaped test of an export is a test of the
// fixture: the two places this suite has been bitten — night one writing no
// round record, and a conclave whose loser is on the ledger — are both facts
// about the engine that a hand-written season would simply not have had.
//
// And every figure is READ off the record the engine wrote at the moment it
// wrote it (`aliveAtVote`, `traitorsAtVote`, `banishedWasTraitor`, `variant`)
// rather than recomputed here. Recomputing alignment at season end is this
// project's most expensive recurring mistake — alignment has ERAS, recruitment
// moves people between them, and a test that re-derives who was a Traitor is
// measuring its own arithmetic against the engine's.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { SHOWS, DEFAULT_FORMAT, seasonId, formatPrefix, exitVerbs, showWords } from '../js/shows.js';
import { roundLedger } from '../js/wiki-fill.js';
import { episodeRecords } from '../js/social/live.js';
import { _rebuildByShow, _tagSeasonDetail, seasonExporterFor,
  exportTraitorsSeason } from '../js/stats-export.js';
import {
  TRAITORS_FORMAT, traitorsVotingHistory, traitorsSeasonDetails,
  traitorsCareerStats, buildTraitorsSeasonDocument,
  seasonFilePath, episodeStoreKey, analyticsKey,
} from '../js/tr/export.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

/** Eight real seasons, played once and shared — a season costs ~40ms. */
const SEASONS = SEEDS.map(seed => {
  setPlayers(ROSTER);
  return playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
});

const HISTORIES = SEASONS.map(s => traitorsVotingHistory(s));
const ballotsOn = (row, channel) => row.votes.filter(v => v.channel === channel);
const votersOn = (row, channel) => new Set(ballotsOn(row, channel).map(v => v.voter));
/** What the engine recorded about episode `ep` while it was happening. */
const logged = (season, ep) => (season.log || []).find(l => l.ep === ep) || {};

describe('the per-round export shape', () => {
  it('exports one votingHistory row per episode, and misses none of them', () => {
    // Night one has no Round Table and therefore writes no round record — it
    // exists only on the log — so an export built from `rounds` alone silently
    // drops the season's first murder. It is the one episode most likely to be
    // missing and the one nobody notices, because the season still reads.
    for (const [i, season] of SEASONS.entries()) {
      const eps = HISTORIES[i].map(r => r.episode);
      expect(eps[0], `seed ${SEEDS[i]}: the first night is not in the export`).toBe(1);
      expect(eps).toEqual([...eps].sort((a, b) => a - b));
      expect(new Set(eps).size, 'an episode was exported twice').toBe(eps.length);
      const last = Math.max(...eps);
      expect(eps, 'the export has a hole in it')
        .toEqual(Array.from({ length: last }, (_, n) => n + 1));
    }
  });

  it('the banishment channel carries a ballot from every player at the table', () => {
    let checked = 0;
    for (const [i, season] of SEASONS.entries()) {
      for (const row of HISTORIES[i]) {
        const ballots = ballotsOn(row, 'banishment');
        if (!ballots.length) continue;
        // `aliveAtVote` is the population as it stood when the ballots were
        // cast, written by the engine on the round itself. Read, not counted.
        const alive = logged(season, row.episode).aliveAtVote;
        if (alive == null) continue;   // an endgame table, which the log has no row for
        expect(ballots.length, `seed ${SEEDS[i]} ep ${row.episode}`).toBe(alive);
        expect(votersOn(row, 'banishment').size, 'somebody voted twice').toBe(alive);
        checked++;
      }
    }
    expect(checked, 'no round was checked — this passed over an empty set')
      .toBeGreaterThan(40);
  });

  it('the murder channel carries a ballot only from the Traitors', () => {
    let checked = 0, exact = 0;
    for (const [i, season] of SEASONS.entries()) {
      for (const row of HISTORIES[i]) {
        const murderers = votersOn(row, 'murder');
        if (!murderers.size) continue;
        const table = votersOn(row, 'banishment');
        if (table.size) {
          // A conclave is a strict subset of the room: everybody in the turret
          // was at the table, and the table was not all turret.
          for (const m of murderers) {
            expect(table.has(m), `seed ${SEEDS[i]} ep ${row.episode}: ${m} murdered `
              + 'but never voted at the table').toBe(true);
          }
          expect(murderers.size, `seed ${SEEDS[i]} ep ${row.episode}: the whole room `
            + 'voted in the murder').toBeLessThan(table.size);
        }
        checked++;

        // AND THE EXACT SIZE, where the engine recorded enough to say it. The
        // conclave is every living Traitor — `traitorsAtVote` as the round
        // opened, less the one the table had just banished. The two variants
        // that hold no conclave (one Traitor acts alone, or is handed the
        // choice) are excluded by name rather than by their ballot count.
        const l = logged(season, row.episode);
        const round = (season.rounds || []).find(r => r.ep === row.episode) || {};
        if (l.traitorsAtVote == null || !round.variant) continue;
        if (round.variant === 'plain-sight' || round.variant === 'name-your-own') continue;
        const expected = l.traitorsAtVote - (row.banishedWasTraitor ? 1 : 0);
        expect(murderers.size, `seed ${SEEDS[i]} ep ${row.episode} (${round.variant})`)
          .toBe(expected);
        exact++;
      }
    }
    expect(checked, 'no murder ballot was checked').toBeGreaterThan(30);
    expect(exact, 'no conclave size was pinned to the engine\'s own count')
      .toBeGreaterThan(20);
  });

  it('keeps the two ballot sets distinguishable, and disagreeing', () => {
    // THE POINT OF THE `channel` FIELD. One record, two ballot sets: collapse
    // them and the season still exports, still has votes on every row, and
    // quietly reports the Traitors' private conclave as part of the public
    // vote — a room that unanimously banished somebody it did not banish.
    let bothOnOneRow = 0, disagreed = 0;
    for (const [i] of SEASONS.entries()) {
      for (const row of HISTORIES[i]) {
        for (const v of row.votes) {
          expect(v.channel, 'a ballot with no channel is unattributable').toBeTruthy();
        }
        const b = ballotsOn(row, 'banishment'), m = ballotsOn(row, 'murder');
        if (!b.length || !m.length) continue;
        bothOnOneRow++;
        // The two sets are answering different questions, so they land on
        // different names — if they never did, one of them is not being read.
        const banishTargets = new Set(b.map(x => x.target));
        if (m.some(x => !banishTargets.has(x.target))) disagreed++;
      }
    }
    expect(bothOnOneRow, 'no round carried both channels').toBeGreaterThan(30);
    expect(disagreed, 'the murder ballots always match the table\'s — one set is a '
      + 'copy of the other').toBeGreaterThan(5);
  });

  it('records the conclave that lost the argument, not just the body', () => {
    // The overruled Traitor's ballot is the one no reader could ever recover
    // from the victim, and it is the reason the murder is exported as a ballot
    // set rather than as a name. If every conclave came out unanimous, the
    // export is reconstructing the vote from the outcome.
    let split = 0, unanimous = 0;
    for (const [i] of SEASONS.entries()) {
      for (const row of HISTORIES[i]) {
        const m = ballotsOn(row, 'murder');
        if (m.length < 2) continue;
        (new Set(m.map(x => x.target)).size > 1 ? split++ : unanimous++);
      }
    }
    expect(split + unanimous, 'no multi-Traitor conclave was exported').toBeGreaterThan(20);
    expect(split, 'every conclave exported as unanimous — the losing ballots are gone')
      .toBeGreaterThan(3);
  });
});

describe('two exit verbs, and each departure gets its own', () => {
  const [BANISH, MURDER] = exitVerbs(TRAITORS_FORMAT);

  it('the registry declares both of them', () => {
    expect(BANISH).toBe('banished');
    expect(MURDER).toBe('murdered');
    // The default word is the vote, because a vote is what most screens
    // describe — but a show with two verbs must not be readable as having one.
    expect(showWords(TRAITORS_FORMAT).exit).toBe(BANISH);
    expect(exitVerbs(DEFAULT_FORMAT)).toHaveLength(1);
  });

  it('a season produces both, and each names the right departure', () => {
    let banished = 0, murdered = 0;
    for (const [i, season] of SEASONS.entries()) {
      for (const row of HISTORIES[i]) {
        for (const x of row.exits) {
          expect([BANISH, MURDER]).toContain(x.verb);
          if (x.verb === BANISH) {
            expect(x.name, `seed ${SEEDS[i]} ep ${row.episode}`).toBe(row.eliminated);
            expect(x.channel).toBe('banishment');
            banished++;
          } else {
            expect(x.name, 'a murder verb over somebody who was not killed')
              .not.toBe(row.eliminated);
            murdered++;
          }
        }
      }
    }
    // An empty section is the failure mode this whole guard family exists for:
    // a season that only ever banishes passes a verb check by never printing
    // the other one.
    expect(banished, 'no banishment in eight seasons').toBeGreaterThan(40);
    expect(murdered, 'no murder in eight seasons').toBeGreaterThan(30);
  });

  it('the round ledger every page and both AI fills read prints both', () => {
    // roundLedger() is ONE function for every show, which is exactly how a
    // castle gets handed the house's words. It is given the real document.
    const doc = buildTraitorsSeasonDocument(SEASONS[0], { seasonNumber: 1 });
    const facts = roundLedger(doc).flatMap(r => r.facts).join(' | ');
    expect(facts).toContain(`was ${BANISH}`);
    expect(facts).toContain(`was ${MURDER}`);
    // ...and nobody's exit is described in the other two shows' words.
    expect(facts).not.toMatch(/was evicted|was eliminated|voted out/);
  });
});

describe('the three data traps', () => {
  it('stamps the format on every seasonDetails entry', () => {
    // AN APPEARANCE WITH NO FORMAT IS TOTAL DRAMA. Not an error, not a blank —
    // it is a Total Drama appearance, and it joins the Total Drama career of
    // whoever shares the slug.
    const details = traitorsSeasonDetails(SEASONS[0], 1);
    expect(details.length).toBe(CAST.length);
    for (const d of details) {
      expect(d.format, `${d.name} has an appearance with no show on it`).toBe(TRAITORS_FORMAT);
      expect(d.seasonId).toBe(seasonId(TRAITORS_FORMAT, 1));
      expect(d.playerSlug).toBeTruthy();
    }
  });

  it('keeps a Traitors appearance out of a Total Drama career', () => {
    // The trap at the exact line where it would spring: _rebuildByShow is
    // where an appearance becomes a career total.
    const details = traitorsSeasonDetails(SEASONS[0], 1);
    const mine = details.find(d => d.tr.roundsAsTraitor > 0) || details[0];
    const player = {
      name: mine.name, playerSlug: mine.playerSlug,
      seasonDetails: [
        { season: 4, format: DEFAULT_FORMAT, placement: 3, status: 'Eliminated',
          challengeWins: 5, immunityWins: 3 },
        mine,
      ],
    };
    _rebuildByShow(player);
    expect(player.byShow[DEFAULT_FORMAT].seasons).toBe(1);
    expect(player.byShow[DEFAULT_FORMAT].totalChallengeWins,
      'the castle got into the camp\'s challenge record').toBe(5);
    expect(player.byShow[TRAITORS_FORMAT].seasons).toBe(1);
    expect(player.totalSeasons).toBe(2);
  });

  it('reads the six tr.* career figures the registry declares', () => {
    // Every pair in SHOWS.traitors.careerStats is nested under `tr.`, and the
    // reader used to test the prefix against Big Brother's — so all six landed
    // on a key that did not exist and every Traitors career totalled zero.
    const details = traitorsSeasonDetails(SEASONS[0], 1);
    const totals = {};
    for (const d of details) {
      const player = { seasonDetails: [d] };
      _rebuildByShow(player);
      const bucket = player.byShow[TRAITORS_FORMAT];
      for (const [from, to] of SHOWS[TRAITORS_FORMAT].careerStats) {
        expect(bucket, `${to} is missing from byShow`).toHaveProperty(to);
        totals[to] = (totals[to] || 0) + bucket[to];
        // ...and it is the appearance's own number, not a zero that agrees.
        expect(bucket[to]).toBe(from.split('.').reduce((o, k) => o?.[k], d) || 0);
      }
    }
    // A season removes everybody, so these two cannot both be zero unless the
    // export is reading nothing at all.
    expect(totals.totalTimesBanished + totals.totalTimesMurdered,
      'nobody left the castle').toBeGreaterThan(10);
    expect(totals.totalRoundsAsTraitor, 'nobody was ever a Traitor').toBeGreaterThan(10);
    expect(totals.totalMissionsWon, 'nobody was ever on the better team').toBeGreaterThan(10);
  });

  it('refuses an appearance carrying another show\'s stat block', () => {
    expect(() => _tagSeasonDetail({ season: 1, bb: { hohWins: 2 } }, TRAITORS_FORMAT))
      .toThrow(/split-brain/);
    expect(() => _tagSeasonDetail({ season: 1, tr: { shieldsWon: 1 } }, DEFAULT_FORMAT))
      .toThrow(/split-brain/);
    // ...and its own block is fine.
    expect(_tagSeasonDetail({ season: 1, tr: { shieldsWon: 1 } }, TRAITORS_FORMAT).format)
      .toBe(TRAITORS_FORMAT);
  });

  it('registers the format before publishing, which is what the worker checks', () => {
    // `POST /api/publish-season` refuses a format the registry does not know,
    // deliberately: formatPrefix falls back to the DEFAULT show's prefix, so
    // two unregistered shows would both write td-N-data.json and overwrite
    // each other. This is the client-side half of that contract.
    expect(SHOWS[TRAITORS_FORMAT], 'the show is not registered — publish will refuse')
      .toBeTruthy();
    expect(formatPrefix(TRAITORS_FORMAT)).toBe('tr');
    expect(formatPrefix('the-mole'), 'an unregistered show must not get its own prefix')
      .toBe(SHOWS[DEFAULT_FORMAT].prefix);
    // The filename the worker builds for a registered non-default show.
    expect(`${formatPrefix(TRAITORS_FORMAT)}-1-data.json`).toBe('tr-1-data.json');
  });

  it('keys every store by the registry\'s prefix', () => {
    // A key that forgets its prefix does not fail — a bare key IS Total Drama,
    // permanently, so it lands on top of a Total Drama season and takes it.
    const pre = formatPrefix(TRAITORS_FORMAT);
    expect(seasonFilePath(1)).toBe('data/seasons/tr-1-data.json');
    expect(episodeStoreKey(1, 1)).toBe('tr_episode_s1_e1');
    expect(analyticsKey(1)).toBe('AI_ANALYTICS_tr-1');
    for (const key of [seasonFilePath(1), episodeStoreKey(1, 1), analyticsKey(1)]) {
      expect(key, `${key} does not carry the ${pre} prefix`).toContain(pre);
      expect(key, `${key} carries the default show's prefix`)
        .not.toMatch(/(^|[^a-z])td[-_]/);
    }
    // And the document says which show it is, in both fields every reader uses.
    const doc = buildTraitorsSeasonDocument(SEASONS[0], { seasonNumber: 1 });
    expect(doc.format).toBe(TRAITORS_FORMAT);
    expect(doc.seasonId).toBe('tr-1');
  });
});

describe('the export dispatches on the registry, not on one other show', () => {
  it('does not send a Traitors season down the default show\'s exporter', () => {
    // The old dispatch was a single equality against the Big Brother slug, so
    // a castle was exported as a camp: no error, no empty result, a published
    // season document in the wrong show's shape.
    expect(seasonExporterFor(TRAITORS_FORMAT)).not.toBe(seasonExporterFor(DEFAULT_FORMAT));
    expect(seasonExporterFor('big-brother')).not.toBe(seasonExporterFor(DEFAULT_FORMAT));
    // An unregistered show still falls back to the default, which is the
    // bare-integer rule and is correct.
    expect(seasonExporterFor('the-mole')).toBe(seasonExporterFor(DEFAULT_FORMAT));
  });

  it('refuses by name rather than exporting a castle as a camp', async () => {
    await expect(exportTraitorsSeason()).rejects.toThrow(/no live export path/);
  });

  it('reads the Traitors round array, not whichever one is the default', () => {
    // The same two-show shape one layer down: js/social/live.js picked the
    // round array by testing the format against the Big Brother slug, so a
    // Traitors season read `gs.episodeHistory` — empty — and the audience had
    // no reaction to a single episode of it. Which array is a fact about the
    // show, so the registry holds it.
    const gsLike = {
      episodeHistory: [],
      bb: { weeks: [{ num: 9 }] },
      tr: { rounds: [{ ep: 1 }, { ep: 2 }, { ep: 3 }] },
    };
    expect(episodeRecords(gsLike, TRAITORS_FORMAT).map(r => r.episode)).toEqual([1, 2, 3]);
    // ...and the other two shows still read their own.
    expect(episodeRecords(gsLike, 'big-brother').map(r => r.episode)).toEqual([9]);
    expect(episodeRecords(gsLike, DEFAULT_FORMAT)).toEqual([]);
  });
});

describe('the season document', () => {
  it('gives every co-winner the same first place', () => {
    // The Traitors ends in a split more often than not, and there is no
    // ordinal between the takers to invent.
    let splits = 0, solo = 0;
    for (const [i, season] of SEASONS.entries()) {
      const doc = buildTraitorsSeasonDocument(season, { seasonNumber: 1 });
      const takers = season.endgame.takers;
      expect(doc.winners.map(w => w.name)).toEqual(takers);
      const firsts = doc.placements.filter(p => p.placement === 1);
      expect(firsts.map(p => p.name).sort(), `seed ${SEEDS[i]}`).toEqual([...takers].sort());
      for (const p of firsts) expect(p.status).toBe('Winner');
      // `winner{}` is singular and is populated only where the season really
      // had one; a split leaves it null rather than picking a main winner.
      if (takers.length === 1) { solo++; expect(doc.winner.name).toBe(takers[0]); }
      else { splits++; expect(doc.winner).toBe(null); }
    }
    expect(splits + solo).toBe(SEASONS.length);
    expect(splits, 'no season ended in a split — the co-winner shape is untested')
      .toBeGreaterThan(0);
  });

  it('places everybody exactly once, worst-placed first out', () => {
    for (const [i, season] of SEASONS.entries()) {
      const doc = buildTraitorsSeasonDocument(season, { seasonNumber: 1 });
      const names = doc.placements.map(p => p.name);
      expect(new Set(names).size, `seed ${SEEDS[i]}: somebody was placed twice`)
        .toBe(names.length);
      expect(names.length).toBe(CAST.length);
      expect(doc.castSize).toBe(CAST.length);
      // Last place belongs to the first body of the season, which on this
      // format is night one's murder — there is no banishment before it.
      const firstOut = HISTORIES[i][0].exits[0];
      const last = doc.placements[doc.placements.length - 1];
      expect(last.name, `seed ${SEEDS[i]}`).toBe(firstOut.name);
      expect(last.status).toBe('Murdered');
      // Every placement below the finalists says how that person left, in the
      // show's own verb.
      for (const p of doc.placements) {
        if (p.exit) expect(exitVerbs(TRAITORS_FORMAT)).toContain(p.exit);
      }
    }
  });
});

describe('the career figures are read, never re-simulated', () => {
  it('counts rounds as a Traitor across a recruitment, not seasons', () => {
    // Recruitment means the role is not a season-level property of a person:
    // somebody can be a Faithful for five rounds and a Traitor for three, and
    // roleHistory is the only place that is written down.
    let recruits = 0;
    for (const season of SEASONS) {
      for (const flip of season.roleHistory) {
        if (flip.to !== 'traitor' || flip.via === 'selection') continue;
        recruits++;
        const stats = traitorsCareerStats(season, flip.name);
        expect(stats.timesRecruited, `${flip.name} was recruited and it is not counted`)
          .toBeGreaterThan(0);
        // Recruited mid-season, so their Traitor tenure is shorter than the
        // season and longer than nothing.
        expect(stats.roundsAsTraitor).toBeGreaterThan(0);
      }
      // A founding Traitor is selected, not recruited.
      for (const name of season.traitors) {
        const first = season.roleHistory.find(r => r.name === name);
        if (first?.via !== 'selection') continue;
        expect(traitorsCareerStats(season, name).timesRecruited,
          `${name} was in the turret from night one and is counted as a recruit`).toBe(0);
      }
    }
    expect(recruits, 'no recruitment happened — the tenure rule is untested')
      .toBeGreaterThan(0);
  });
});
