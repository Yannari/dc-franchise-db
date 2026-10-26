// What airs before a result must not give the result away. The user, 2026-10-24, on Block Buster
// weeks: "it's too obvious who is still on the block with the way they're campaigning" and "they
// often hesitate between 2 people before the Block Buster when there's obviously 3 nominees"; and on
// any week: a nominee's campaign pitch "happened after Kyle's eviction".
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Beth', 'Owen'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'hero', 'floater'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const weeks = [];

beforeAll(() => {
  for (const seed of [7, 11, 23]) {
    setGs(null);
    setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(), gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
      stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3 + seed) % 10)])) })));
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'block-buster', seasonNumber: 1, theme: 'none' });
    seasonConfig.twistSchedule = []; initGameState(); globalThis.gs = gs;
    withSeededRandom(seed, () => { for (let i = 0; i < 3; i++) simulateBBEpisode(); });
    weeks.push(...JSON.parse(JSON.stringify(gs.episodeHistory.filter(r => r.format === 'big-brother'))));
  }
}, 900000);

const busters = () => weeks.filter(r => (r.acts || []).some(a => a?.type === 'safety' && a.winner));

describe('a Block Buster week before the Block Buster', () => {
  it('has Block Buster weeks to read', () => expect(busters().length).toBeGreaterThan(4));

  // the user, 2026-10-24, on taking the vote talk off: "you cant do that when blockbuster is active all
  // season... just tweak so the discussion is more realist: if the target is really x, what if x wins
  // blockbuster, we go y"
  it('talks the vote through three ways, never between the final two, before the arena', () => {
    let planned = 0;
    for (const row of busters()) {
      const three = row.blockBeforeSafety || [];
      const scenes = row.acts.flatMap(a => a.scenes || []).filter(s => /^vote\./.test(String(s.step)));
      expect(scenes.map(s => s.step).filter(k => !/^vote\.bb\.(plan(\.hoh)?|split)$/.test(k)), `week ${row.num}`).toEqual([]);
      for (const s of scenes.filter(x => /^vote\.bb\.plan/.test(x.step))) {
        planned++;
        // a target and a backup, both of the three, and nothing said yet about who wins it
        const said = (s.lines || []).map(l => l.text).join(' ');
        expect(three.filter(n => said.includes(n)).length, `week ${row.num}: ${said}`).toBeGreaterThanOrEqual(2);
        expect(said).toMatch(/Block Buster|wins it|comes off|isn't|pulls it off|backup|plan B/);
      }
    }
    expect(planned).toBeGreaterThan(busters().length / 2);
  });

  it('shows the one the Block Buster saves campaigning, and never more than the other two', () => {
    let seenThird = 0;
    for (const row of busters()) {
      const third = row.acts.find(a => a?.type === 'safety').winner;
      const aired = {};
      for (const a of row.acts.filter(x => x?.type === 'campaign')) for (const s of a.scenes || []) {
        if (s.step === 'pitch' && s.cast?.[0]) aired[s.cast[0]] = (aired[s.cast[0]] || 0) + 1;
      }
      const others = Object.entries(aired).filter(([n]) => n !== third).map(([, k]) => k);
      if (aired[third]) seenThird++;
      expect(aired[third] || 0, `week ${row.num}: ${JSON.stringify(aired)}`).toBeLessThanOrEqual(Math.max(1, ...others));
      // the engine gives them pitches of the same kind as everybody's
      const beats = row.acts.filter(x => x?.type === 'campaign').flatMap(a => a.socialBeats || []);
      expect(beats.some(b => b.eventId === 'campaign-pitch' && b.players?.[0] === third), `week ${row.num}`).toBe(true);
    }
    expect(seenThird).toBeGreaterThan(busters().length / 2);
  });
});

// read 2026-10-25: Beth pitching Caleb alone in a bedroom, closed by "Owen (dr): I could tell I
// wasn't the first" — the engine's beat for a case taken to several voters carried Owen's line
describe('a campaign pitch', () => {
  it('is closed only by somebody the viewer saw in it', () => {
    let wide = 0;
    for (const row of weeks) for (const a of (row.acts || []).filter(x => x?.type === 'campaign')) for (const s of a.scenes || []) {
      if (s.step !== 'pitch' || !s.cast?.length) continue;
      if (s.cast.length > 2) wide++;
      const lines = s.lines || [];
      const seen = n => n === s.cast[0] || n === s.cast[s.cast.length - 1]
        || lines.some(l => l.kind === 'say' ? l.by === n : l.kind === 'beat' && String(l.text).includes(n));
      for (const l of lines.filter(x => x.kind === 'dr')) expect(seen(l.by), `week ${row.num}: ${l.by}: ${l.text}`).toBe(true);
    }
    expect(wide).toBeGreaterThan(0);
  });
});

describe('the night after the vote', () => {
  it('has nobody who just went out of the front door in it, and no nominee campaigning', () => {
    for (const row of weeks) {
      for (const ev of (row.acts || []).filter(a => a?.type === 'eviction')) {
        const gone = [ev.evicted, ev.secondEvicted].filter(Boolean);
        for (const b of ev.socialBeats || []) {
          expect(b.eventId, `week ${row.num}`).not.toBe('power-nom-campaign');
          // nobody gone is the one doing anything (their own goodbye, the evict- events, is theirs; an
          // alliance that fell apart because they left can still name them)
          if (!/^evict-/.test(String(b.eventId))) for (const n of gone) expect(b.players?.[0], `week ${row.num} ${b.eventId}`).not.toBe(n);
        }
      }
    }
  });
});
