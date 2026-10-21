// The Circle and The Challenge reach the feed as themselves (js/social/packs/the-circle.js, the-challenge.js).
// The user, 2026-10-21: "do the social feed birdie chat alumni for the other shows like we did for big brother and
// total drama". Measured that day before the packs: both were fed by the shared library, written for a show decided
// by a vote — a Circle episode was "the majority", "that beach" and "the bottom finding a spine", with one event
// (the block, read as an eviction).
import { describe, expect, it, beforeAll } from 'vitest';
import fs from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { chLedgerRecord } from '../js/ch/ledger-record.js';
import { buildChallengeSeasonDocument } from '../js/ch/export.js';
import { extractEvents } from '../js/social/events.js';
import { buildEpisodeFeed } from '../js/social/feed.js';
import { episodeRecords, feedSeed } from '../js/social/live.js';
import { archiveEpisode, episodesOf } from '../js/social/archive.js';
import { packFor } from '../js/social/packs/index.js';
import { CIRCLE_FORMAT, CHALLENGE_FORMAT } from '../js/shows.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { makePlayers, circleSetup } from './helpers/ci-cast.js';
import { challengeCast } from './helpers/ch-cast.js';

const kindsOf = (state, format) => {
  const seen = new Set();
  for (const rec of episodeRecords(state, format)) {
    for (const e of extractEvents(rec.record, { format, season: 1, episode: rec.episode }, packFor(format).context(state))) seen.add(e.kind);
  }
  return seen;
};
const foreignPosts = (state, format) => {
  const bad = [];
  for (const rec of episodeRecords(state, format)) {
    const ev = extractEvents(rec.record, { format, season: 1, episode: rec.episode }, packFor(format).context(state));
    for (const p of buildEpisodeFeed(ev, { seed: feedSeed(1, rec.episode) })) {
      const text = [p.text, p.body, ...(p.replies || []).map(r => r.text)].filter(Boolean).join(' ');
      const foreign = foreignWordsIn(text.toLowerCase(), format);
      if (foreign.length) bad.push(`ep ${rec.episode} ${p.topic}: ${foreign.join(',')} | ${text.slice(0, 110)}`);
    }
  }
  return bad;
};

describe('The Circle reaches the feed as the Circle', () => {
  let state;
  beforeAll(() => {
    const cast = makePlayers(13, 4); setPlayers(cast);
    const names = cast.map(p => p.name);
    const played = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed: 4 });
    state = { episodeHistory: played.rows, ci: { winners: played.state.profiles[played.result?.winner?.profile ?? played.result?.winner]?.players || [] } };
  }, 120000);

  it('has a pack, and reads every aired episode', () => {
    expect(packFor(CIRCLE_FORMAT)).toBeTruthy();
    expect(episodeRecords(state, CIRCLE_FORMAT).length).toBe(state.episodeHistory.length);
  });
  it('produces the ratings, the Influencers, the blocks and the chats, and nothing from a vote show', () => {
    const seen = kindsOf(state, CIRCLE_FORMAT);
    for (const k of ['top-rated', 'bottom-rated', 'blocked', 'circle-flirt', 'blocked-visit']) expect(seen.has(k), `no "${k}"`).toBe(true);
    for (const k of ['nomination', 'blindside', 'veto-used', 'eviction']) expect(seen.has(k), `the Circle produced a "${k}"`).toBe(false);
  });
  it('speaks the Circle: no house, no jury, no vote', () => {
    expect(foreignPosts(state, CIRCLE_FORMAT)).toEqual([]);
  });
  it('reads the published season the same way, catfish and all', () => {
    const doc = JSON.parse(fs.readFileSync('data/seasons/ci-1-data.json', 'utf8'));
    const kinds = new Set();
    for (const { episode } of episodesOf(doc, CIRCLE_FORMAT)) for (const e of archiveEpisode(doc, CIRCLE_FORMAT, 1, episode).events) kinds.add(e.kind);
    for (const k of ['top-rated', 'made-influencer', 'blocked', 'catfish-caught', 'finale']) expect(kinds.has(k), `the archive has no "${k}"`).toBe(true);
    const fin = archiveEpisode(doc, CIRCLE_FORMAT, 1, 14).events.find(e => e.kind === 'finale');
    expect(fin.subject).toBe('lila');
  });
});

describe('The Challenge reaches the feed as the Challenge', () => {
  let state, doc;
  beforeAll(() => {
    const { cast, names, background } = challengeCast(24, 3);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed: 3, options: {} });
    airSeason(r.state);
    const rows = challengeRows(r);
    state = { episodeHistory: rows };
    doc = buildChallengeSeasonDocument(rows, chLedgerRecord(r.state, r, { seasonName: 'Blue Lagoon' }), { seasonNumber: 1 });
  }, 120000);

  it('has a pack, and reads every aired episode', () => {
    expect(packFor(CHALLENGE_FORMAT)).toBeTruthy();
    expect(episodeRecords(state, CHALLENGE_FORMAT).length).toBe(state.episodeHistory.length);
  });
  it('produces the daily, the house vote, the Arena and the house, and nothing from a jury show', () => {
    const seen = kindsOf(state, CHALLENGE_FORMAT);
    for (const k of ['daily-won', 'voted-in', 'called-out', 'arena-won', 'arena-out', 'house-fight', 'finale']) expect(seen.has(k), `no "${k}"`).toBe(true);
    for (const k of ['nomination', 'blindside', 'veto-used', 'eviction']) expect(seen.has(k), `the Challenge produced a "${k}"`).toBe(false);
  });
  it('speaks the Challenge: no jury, no tribe, nobody voted out', () => {
    expect(foreignPosts(state, CHALLENGE_FORMAT)).toEqual([]);
  });
  it('names every champion on the final, decided by the final, not a vote', () => {
    const fin = [...episodeRecords(state, CHALLENGE_FORMAT)].pop();
    const ev = extractEvents(fin.record, { format: CHALLENGE_FORMAT, season: 1, episode: fin.episode }, packFor(CHALLENGE_FORMAT).context(state))
      .find(e => e.kind === 'finale');
    expect(ev.subjects.length).toBe(fin.record.ch.final.champions.length);
    expect(ev.decidedBy).toBe('challenge');
  });
  it('reads a published season from its document', () => {
    const kinds = new Set();
    for (const { episode } of episodesOf(doc, CHALLENGE_FORMAT)) for (const e of archiveEpisode(doc, CHALLENGE_FORMAT, 1, episode).events) kinds.add(e.kind);
    for (const k of ['daily-won', 'voted-in', 'arena-out']) expect(kinds.has(k), `the archive has no "${k}"`).toBe(true);
  });
});
