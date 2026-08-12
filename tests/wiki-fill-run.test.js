// Running a fill from either page.
//
// The orchestration used to live inside two onclick handlers on
// current-season.html, which is why filling a season meant leaving the
// simulator. It is a module now, and Export Season calls the same one.
//
// Two things are worth pinning: the EPISODE KEY (two places still compute it,
// and a disagreement means a fill silently reads no episodes), and the ORDER
// the export runs things in (the fill patches a document the export has to
// have committed first).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { episodeKey } from '../js/episode-store.js';
import { seasonFile } from '../js/wiki-fill-run.js';

describe('the episode key', () => {
  it('keeps Total Drama on the key fourteen seasons already use', () => {
    expect(episodeKey(14, 3, 'total-drama')).toBe('td_episode_s14_e3');
    // No format given is Total Drama, per the site's permanent rule.
    expect(episodeKey(14, 3)).toBe('td_episode_s14_e3');
  });

  it('namespaces every other show', () => {
    expect(episodeKey(1, 1, 'big-brother')).toBe('bb_episode_s1_e1');
  });

  // THE DRIFT GUARD.
  //
  // current-season.html computes this key too, for the sync call sites it has
  // always had. If the two ever disagree, a fill reads zero episodes and
  // reports "no transcripts saved" for a season full of them — which looks
  // like missing data rather than a bug.
  it('agrees with the copy inside current-season.html', () => {
    const html = readFileSync('current-season.html', 'utf8');
    const m = html.match(/function _epKey\(season, episode, format\) \{([\s\S]*?)\n  \}/);
    expect(m, 'could not find _epKey in current-season.html — has it been renamed?').toBeTruthy();

    // The page's version reads two helpers from its own scope; both are
    // supplied here so the body can run in isolation.
    const pageKey = new Function('season', 'episode', 'format',
      `const CS_DEFAULT_FORMAT = 'total-drama';
       const _csShows = () => ({ 'total-drama': 'td', 'big-brother': 'bb' });
       const _csFormat = () => CS_DEFAULT_FORMAT;
       ${m[1]}`);

    for (const fmt of ['total-drama', 'big-brother']) {
      for (const [s, e] of [[1, 1], [14, 3], [5, 26]]) {
        expect(pageKey(s, e, fmt), `${fmt} s${s}e${e}`).toBe(episodeKey(s, e, fmt));
      }
    }
  });
});

describe('the season document filename', () => {
  it('matches the rule the studio worker publishes under', () => {
    expect(seasonFile(14, 'total-drama')).toBe('season14-data.json');
    expect(seasonFile(1, 'big-brother')).toBe('bb-1-data.json');
    expect(seasonFile(14)).toBe('season14-data.json');
  });
});

describe('the export hook', () => {
  const src = readFileSync('js/stats-export.js', 'utf8');

  it('is off unless it was switched on', () => {
    // Read as source rather than executed: the flag is localStorage, and the
    // point being pinned is the DEFAULT, which is what decides whether a
    // routine re-export quietly spends two paid calls.
    expect(src).toMatch(/localStorage\.getItem\(WIKI_FILL_FLAG\) === 'on'/);
    expect(src).toMatch(/if \(wikiFillOnExport\(\)\) \{/);
  });

  it('fills AFTER the export, because the fill patches a committed document', () => {
    const body = src.match(/export async function exportSeason\(onStatus\) \{[\s\S]*?\n\}/)[0];
    expect(body.indexOf('exportAndFill')).toBeLessThan(body.indexOf('wikiFillOnExport()'));
  });

  it('never lets a failed fill fail the export', () => {
    const body = src.match(/export async function exportSeason\(onStatus\) \{[\s\S]*?\n\}/)[0];
    expect(body).toMatch(/try \{ await _fillWikiAfterExport\(onStatus\); \}/);
    expect(body).toMatch(/catch \(e\)/);
  });

  it('refuses to spend the calls when there is nowhere to save the answer', () => {
    expect(src).toMatch(/if \(committingIsOff\(\)\) \{[\s\S]*?Wiki fill skipped/);
  });
});

// ── THE SIMULATOR'S OWN ROUND-BY-ROUND RECORD ───────────────────────────
//
// Three things describe a season to the writer and they are not equal. The
// screenplay is what people said. `keyMoments` is prose a model wrote about the
// season afterwards. This is what the ENGINE recorded — the night somebody won,
// the night they took votes, the night they went — so a claim in the article
// that contradicts it is checkable against the export.
import { timelineFor } from '../js/wiki-fill-run.js';

describe('a player timeline', () => {
  const HOUSE = { weeks: [
    { week: 1, hoh: 'Wayne', initialNominees: ['Axel', 'Emmah'], votes: { Axel: 6 },
      evicted: 'Axel', haveNots: ['Wayne'], ballots: [{ voter: 'Wayne', evict: 'Axel' }] },
    { week: 2, hoh: 'Raj', initialNominees: ['Wayne', 'Zee'], vetoWinner: 'Wayne',
      votes: { Zee: 5, Millie: 4 }, evicted: 'Zee', haveNots: [],
      ballots: [{ voter: 'Wayne', evict: 'Zee' }] },
    { week: 3, initialNominees: ['Wayne'], votes: { Wayne: 5, Raj: 2 }, evicted: 'Wayne' },
  ] };
  const CAMP = { votingHistory: [
    { episode: 2, winner: 'Jade', eliminated: 'Amelie',
      votes: [{ voter: 'Jade', target: 'Amelie' }, { voter: 'Amelie', target: 'Jade' }] },
    { episode: 3, eliminated: 'Jade',
      votes: [{ voter: 'Ted', target: 'Jade' }, { voter: 'Ivy', target: 'Jade' }] },
  ] };

  it('records what the house did to somebody, week by week', () => {
    const t = timelineFor(HOUSE, 'Wayne');
    expect(t[0]).toBe('wk1: won HOH, have-not, voted to evict Axel');
    // Nominated and then won the veto: somebody saving themselves, in that
    // order, because the reverse says nothing.
    expect(t[1]).toBe('wk2: nominated, won the veto, voted to evict Zee');
    // Nominated, took the votes, and the night it ended — with the margin.
    expect(t[2]).toBe('wk3: nominated, took 5 votes, EVICTED 5-2');
    // A house where nobody voted the other way still states the margin.
    const sweep = { weeks: [{ week: 1, votes: { Wayne: 7 }, evicted: 'Wayne', ballots: [] }] };
    expect(timelineFor(sweep, 'Wayne')[0]).toMatch(/EVICTED 7-0/);
  });

  it('records a camp in the camp', () => {
    const t = timelineFor(CAMP, 'Jade');
    expect(t[0]).toBe('ep2: won the challenge, voted Amelie, took 1 vote');
    expect(t[1]).toBe('ep3: took 2 votes, VOTED OUT 2-0');
    // No house vocabulary anywhere in it.
    expect(t.join(' ')).not.toMatch(/HOH|veto|EVICTED|have-not/);
  });

  it('says nothing about rounds where nothing happened to them', () => {
    const quiet = { weeks: [{ week: 1, hoh: 'Someone', votes: {}, ballots: [] },
      { week: 2, hoh: 'Wayne', votes: {}, ballots: [] }] };
    expect(timelineFor(quiet, 'Wayne')).toEqual(['wk2: won HOH']);
  });

  it('keeps both ends of a long season rather than the first half', () => {
    const long = { weeks: Array.from({ length: 30 }, (_, i) => ({
      week: i + 1, votes: { Wayne: 1 }, ballots: [] })) };
    const t = timelineFor(long, 'Wayne');
    expect(t.length).toBe(15);          // 7 + ellipsis + 7
    expect(t[7]).toBe('…');
    expect(t[0]).toMatch(/^wk1:/);
    expect(t[t.length - 1]).toMatch(/^wk30:/);
  });
});
