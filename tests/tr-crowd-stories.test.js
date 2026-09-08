// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// tr-crowd-stories.test.js — a story the country followed, and the screen
// that shows what it made of it
// ══════════════════════════════════════════════════════════════════════
//
// Two things are guarded here.
//
//   1. A RESOLVED STORYLINE MOVES THE CROWD. The audience of this format does
//      not watch acts, it follows stories, and until `scoreStories` existed a
//      player could carry the season's most-watched arc and finish on the
//      popularity of somebody who was never discussed.
//   2. IT MUST NOT BECOME A SURVIVAL BONUS. Arcs resolve for people who are
//      still there to resolve them, so a generous arc payout is placement
//      wearing a story's clothes — the -0.952 accrual bug arriving through a
//      new door. tr-audience.test.js holds the correlation bound; this file
//      holds the rules that keep it there.
import { describe, expect, it } from 'vitest';
import { gs, setPlayers, setGs } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { rpBuildTraitorsDebug } from '../js/vp-tr/debug.js';
import {
  CROWD_COLOURS, STORY_SENSE_COLOUR, scoreStories, storyWeight, initCrowd,
} from '../js/tr/crowd.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

/** One thread, in the shape `js/tr/threads.js` writes. */
const thread = (o = {}) => ({
  id: 't1', kind: 'suspicion', parties: ['Amy', 'Beardo'], state: 'closed',
  outcome: 'denied-convincingly', lastEp: 3, beats: [{ ep: 1 }, { ep: 2 }, { ep: 3 }], ...o,
});

describe('a storyline moves the crowd', () => {
  const run = (threads, ep = 3) => {
    setPlayers(ROSTER);
    setGs({ ...gs, popularity: {}, tr: { ...(gs.tr || {}), notoriety: {}, threads } });
    initCrowd(CAST);
    return scoreStories(ep, { threads });
  };

  it('pays the parties when the story ends, not while it runs', () => {
    expect(run([thread({ state: 'open', outcome: null })])).toEqual([]);
    const paid = run([thread()]);
    expect(paid.map(m => m.name)).toEqual(['Amy', 'Beardo']);
    expect(gs.popularity.Amy).toBeGreaterThan(0);
  });

  it('pays each story exactly once, however often the night is scored', () => {
    // `lastEp` is stamped by closeThread, so a thread closed in episode 3 is
    // invisible to every other episode's scoring pass.
    const ts = [thread()];
    run(ts);
    const first = gs.popularity.Amy;
    expect(scoreStories(4, { threads: ts })).toEqual([]);
    expect(gs.popularity.Amy).toBe(first);
  });

  it('reads the sense, not the outcome string', () => {
    /* The events branch on `outcomeSense` (spec 5.5) and so does this, so a
       twelfth outcome added to that map is scored the moment it is mapped —
       rather than falling off the end of a list of known strings kept here. */
    const walked = run([thread({ outcome: 'passed-clean' })]);
    const cracked = run([thread({ outcome: 'test-exposed' })]);
    expect(walked[0].colour).toBe(STORY_SENSE_COLOUR.walked);
    expect(cracked[0].colour).toBe(STORY_SENSE_COLOUR.cracked);
    // An outcome the sense map has never heard of scores nothing at all,
    // rather than guessing a direction for it.
    expect(run([thread({ outcome: 'invented-yesterday' })])).toEqual([]);
  });

  it('costs affection to be caught and earns it to be cleared', () => {
    expect(run([thread({ outcome: 'passed-clean' })])[0].affection).toBeGreaterThan(0);
    expect(run([thread({ outcome: 'test-exposed' })])[0].affection).toBeLessThan(0);
  });

  it('pays a story more television than warmth', () => {
    /* THE RULE THAT KEEPS THE CORRELATION DOWN. Being in a storyline is
       television, not virtue: the country's affection comes from behaviour.
       Paying arcs at the warmth of an ACT (`wronged`, 3.5) tripled the
       standing-to-placement correlation, 0.16 → 0.48. */
    for (const colour of Object.values(STORY_SENSE_COLOUR)) {
      const c = CROWD_COLOURS[colour];
      expect(c, `${colour} is not in the colour table`).toBeTruthy();
      expect(c.spectacle, `${colour} should be watched more than it is loved`)
        .toBeGreaterThan(Math.abs(c.affection));
      expect(Math.abs(c.affection), `${colour} pays an act's worth of affection`)
        .toBeLessThan(CROWD_COLOURS.heroic.affection);
    }
  });

  it('is worth more when there was more story', () => {
    const one = storyWeight({ beats: [{}] });
    const five = storyWeight({ beats: [{}, {}, {}, {}, {}] });
    expect(five).toBeGreaterThan(one);
    // Capped, so no single arc outweighs a season of behaviour.
    expect(storyWeight({ beats: Array(40).fill({}) })).toBeLessThanOrEqual(1);
  });
});

describe('the debug screen shows it', () => {
  setPlayers(ROSTER);
  playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 7 });
  const rows = gs.episodeHistory.filter(r => r.tr);
  const mid = rows[Math.floor(rows.length / 2)];

  it('records the crowd and the live stories on every row', () => {
    /* SNAPSHOT, NOT LIVE STATE. The ledgers live on `gs` and are replaced by
       the next season; the threads are mutated in place, so by the finale the
       only readable version of episode 3's storylines would be the finale's.
       A screen showing live state on a replayed episode is the §11.5 bug. */
    for (const r of rows) {
      expect(r.tr.crowd, `ep ${r.num} has no crowd`).toBeTruthy();
      expect(r.tr.crowd.rows.length).toBe(CAST.length);
      for (const row of r.tr.crowd.rows) {
        expect(typeof row.standing).toBe('number');
        expect(typeof row.affection).toBe('number');
        expect(typeof row.spectacle).toBe('number');
      }
    }
    // Different episodes hold different numbers, which is what proves these
    // are snapshots rather than the same live object read many times.
    const first = rows[0].tr.crowd.rows.find(r => r.name === mid.tr.crowd.rows[0].name);
    const late = rows[rows.length - 1].tr.crowd.rows.find(r => r.name === first.name);
    expect(first.affection === late.affection && first.rounds === late.rounds).toBe(false);
  });

  it('names a favourite who is still in it', () => {
    // Standing is affection per round, so somebody adored over three episodes
    // and then murdered outranks everybody still playing. True of the ledger,
    // useless as a fact about tonight.
    for (const r of rows) {
      if (!r.tr.crowd.favourite) continue;
      const fav = r.tr.crowd.rows.find(x => x.name === r.tr.crowd.favourite);
      expect(fav.out, `ep ${r.num}: the favourite has been eliminated`).toBe(false);
    }
  });

  it('keeps only the stories that are still live', () => {
    // Heat decays a point per round of silence and an event may only continue
    // a thread with heat left, so a cold thread is not a storyline anybody is
    // in. Keeping them put 76 rows on one episode.
    for (const r of rows) {
      for (const t of r.tr.crowd.stories) {
        if (t.state === 'open') expect(t.heat).toBeGreaterThan(0);
        else expect(t.lastEp).toBe(r.tr.ep ?? r.num);
      }
    }
  });

  it('draws both sections, with real names in them', () => {
    const html = rpBuildTraitorsDebug(mid);
    expect(html).toContain('What the country thinks');
    expect(html).toContain('Storylines');
    // Not merely present — populated. A section that renders its empty state
    // on a season full of data passes a `toContain` on its own heading.
    expect(html).toContain(mid.tr.crowd.rows[0].name);
    expect(html).not.toContain('no crowd ledger on this row');
    expect(html).toContain('favourite tonight');
    if (mid.tr.crowd.stories.length) {
      expect(html).toContain(mid.tr.crowd.stories[0].kind);
      expect(html).not.toContain('no storyline is open');
    }
  });

  it('opens on a row that has none of it', () => {
    // "A debug tab that can crash is a debug tab you cannot open on the
    // episode that broke" — this file's own rule, applied to the new sections.
    expect(() => rpBuildTraitorsDebug({ num: 1, tr: {} })).not.toThrow();
    expect(rpBuildTraitorsDebug({ num: 1, tr: {} })).toContain('no crowd ledger');
    expect(() => rpBuildTraitorsDebug({})).not.toThrow();
    expect(() => rpBuildTraitorsDebug(null)).not.toThrow();
  });
});
