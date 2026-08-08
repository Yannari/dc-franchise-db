// The predictions panel was showing the answer.
//
// Names came from `placements.slice(0, 6)` — PLACEMENT ORDER — so the first bar
// under "who goes home tonight?" was the season's winner, in episode two, at a
// hardcoded 42%. Every question, every episode, every season: 42, 27, 19, 12,
// in finishing order. It predicted nothing and spoiled everything.
//
// And the panel of alumni had the same problem from the other end: relevance is
// deterministic and the panel does not change during a season, so the same few
// hosts covered all twenty-six nights while the rest sat on a list.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { archiveEpisode, stillIn } from '../js/social/archive.js';
import { eligibleHosts, episodeSpeakers, seasonPanel } from '../js/social/hosts.js';

const doc = {
  seasonNumber: 14, episodeCount: 6, winner: { name: 'Anastasia' },
  placements: [
    { name: 'Anastasia', playerSlug: 'anastasia', placement: 1 },
    { name: 'Ted', playerSlug: 'ted', placement: 2 },
    { name: 'Julia', playerSlug: 'julia', placement: 3 },
    { name: 'Jade', playerSlug: 'jade', placement: 4 },
    { name: 'Logan', playerSlug: 'logan', placement: 5 },
  ],
  votingHistory: [
    { episode: 1, eliminated: 'logan', immunityWinner: 'ted',
      votes: [{ voter: 'a', target: 'logan' }, { voter: 'b', target: 'logan' },
        { voter: 'c', target: 'logan' }, { voter: 'logan', target: 'a' }] },
    { episode: 2, eliminated: 'jade', immunityWinner: 'ted',
      votes: [{ voter: 'a', target: 'jade' }, { voter: 'b', target: 'jade' },
        { voter: 'c', target: 'jade' }, { voter: 'jade', target: 'a' }] },
  ],
};

describe('a prediction cannot be the result', () => {
  it('drops people the ballots have already sent home', () => {
    expect(stillIn(doc, 'total-drama', 1).map(p => p.name)).not.toContain('Logan');
    expect(stillIn(doc, 'total-drama', 2).map(p => p.name)).not.toContain('Jade');
    // And keeps everybody a ballot has not touched yet.
    expect(stillIn(doc, 'total-drama', 2).map(p => p.name)).toContain('Ted');
  });

  it('narrows as the season goes on', () => {
    const before = stillIn(doc, 'total-drama', 1).length;
    const after = stillIn(doc, 'total-drama', 2).length;
    expect(after).toBeLessThan(before);
  });

  it('offers the whole cast rather than an ordered one when nothing is known', () => {
    // A season with no ballots says nothing about who is out, and guessing from
    // placement would leak the result — which is the bug being fixed. The
    // unordered whole cast is the honest answer.
    const bare = { placements: doc.placements };
    expect(stillIn(bare, 'total-drama', 5)).toHaveLength(doc.placements.length);
  });

  it('has no hardcoded percentages left in the page', () => {
    const PAGE = fs.readFileSync('js/social-page.js', 'utf8');
    expect(PAGE, 'the 42/27/19/12 ladder is still there')
      .not.toMatch(/\[42, 27, 19, 12\]/);
    expect(PAGE, 'the panel is still slicing placement order')
      .not.toMatch(/placements \|\| \[\]\)\.slice\(0, 6\)/);
    // Computed from the two readers the rest of the page already trusts.
    expect(PAGE).toMatch(/function predictionRows/);
    expect(PAGE).toMatch(/audiencePulse\(visible\(\)\)/);
  });

  it('answers each question with its own reader', () => {
    // Signing the sentiment was not enough, and this test asserted that weaker
    // version and passed while the panel printed the same four names five
    // times: "who wins the next challenge", "who makes the merge", "who wins
    // the season" and "who are you rooting for" all ran one formula.
    //
    // They are questions about different things. A challenge question reads the
    // challenge record; a rooting question reads affection and nothing else,
    // because being good at the game is not what is being asked.
    const PAGE = fs.readFileSync('js/social-page.js', 'utf8');
    const fn = PAGE.slice(PAGE.indexOf('function predictionRows'),
      PAGE.indexOf('function renderPredictions'));
    for (const q of ['boot', 'evicted', 'immunity', 'hoh', 'veto', 'merge',
      'winner', 'favourite']) {
      expect(fn, `"${q}" has no reader of its own`).toMatch(new RegExp(`case '${q}':`));
    }
    // And they must genuinely read different things, not different constants.
    expect(fn, 'nothing reads the challenge record').toMatch(/challengeWins/);
    expect(fn, 'nothing reads how deep they have gone').toMatch(/bestPlacement/);
    expect(fn, 'nothing reads pure affection').toMatch(/Math\.max\(0, warmth\)/);
  });

  it('does not let one formula serve every question', () => {
    const PAGE = fs.readFileSync('js/social-page.js', 'utf8');
    const fn = PAGE.slice(PAGE.indexOf('function predictionRows'),
      PAGE.indexOf('function renderPredictions'));
    // Five questions, five distinct weight expressions.
    const weights = [...fn.matchAll(/weight = ([^;]+);/g)].map(m => m[1].trim());
    expect(weights.length).toBeGreaterThanOrEqual(6);
    expect(new Set(weights).size, 'two questions share a formula')
      .toBe(weights.length);
  });

  it('adds up to a hundred', () => {
    // A column of rounded-down bars reads 99 and looks broken.
    const PAGE = fs.readFileSync('js/social-page.js', 'utf8');
    const fn = PAGE.slice(PAGE.indexOf('function predictionRows'),
      PAGE.indexOf('function renderPredictions'));
    expect(fn).toMatch(/const short = 100 - rows\.reduce/);
  });
});

describe('the panel actually takes turns', () => {
  const panel = () => {
    const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
    const vp = read('voice-profiles.json');
    return seasonPanel(eligibleHosts({
      players: read('players_database.json'),
      seasons: read('seasons_database.json'),
      rankings: read('rankings_database.json'),
      voices: vp.profiles || vp, format: 'total-drama', airingCast: [],
    }), { format: 'total-drama' });
  };

  const across = (p, opts) => {
    const seen = new Set();
    for (let ep = 1; ep <= 6; ep++) {
      const { events } = archiveEpisode(doc, 'total-drama', 14, ep);
      for (const s of episodeSpeakers(p, events, { ...opts, episode: opts.episode ? ep : 0 })) {
        seen.add(s.name);
      }
    }
    return seen;
  };

  it('lets more of the panel speak across a season', () => {
    const p = panel();
    const rotated = across(p, { episode: true });
    const fixed = across(p, {});
    expect(rotated.size, 'rotation reached no more hosts than the fixed order')
      .toBeGreaterThan(fixed.size);
  });

  it('reaches the whole panel rather than a headline act', () => {
    const p = panel();
    expect(across(p, { episode: true }).size).toBe(p.length);
  });

  it('keeps the most relevant hosts in the room every night', () => {
    // Rotation must not become a rota that ignores the episode: somebody who
    // shared a season with tonight's subject belongs there whatever week it is.
    const p = panel();
    const { events } = archiveEpisode(doc, 'total-drama', 14, 2);
    const a = episodeSpeakers(p, events, { episode: 2 });
    const b = episodeSpeakers(p, events, { episode: 5 });
    expect(a[0].name).toBe(b[0].name);
    expect(a[1].name).toBe(b[1].name);
    // ...and that the rest genuinely moved.
    expect(a.map(h => h.name).join()).not.toBe(b.map(h => h.name).join());
  });
});
