// House life as storylines (js/bb/story; spec
// docs/superpowers/specs/2026-10-05-bb-house-storylines-design.md). The user, reading
// real seasons: conversations "cut short", "chronologically not reliable", "no setup",
// "they just happen randomly for no reason". These hold the layer to its contract:
//   - every pool is written whole, by known roles, and big enough not to repeat;
//   - no line talks about a past the house has not had (the tell-tale-word guard);
//   - in real weeks, every aired scene has its cause on screen or said plainly, nobody
//     speaks who is not on stage, no slot prints raw, and the first night only starts things;
//   - the season does not depend on the words (the storyline layer touches no game state).
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { STORY_POOLS } from '../js/bb/story/lines/index.js';
import { POOLS } from '../js/bb/script/lines/index.js';
import { BB_FACT_KEYS } from '../js/bb/script/facts.js';
import { classify, causeOf } from '../js/bb/story/storylines.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const ROOMS = new Set(['kitchen', 'living-room', 'bedroom', 'backyard', 'bathroom', 'hoh-room', 'storage-room']);

function season(seed, weeks) {
  seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] })), { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
  const eps = [];
  for (let w = 0; w < weeks; w++) eps.push(JSON.parse(JSON.stringify(withSeededRandom(seed * 100 + w, () => simulateBBEpisode()))));
  return { eps, lines: JSON.parse(JSON.stringify(gs.bb.storylines || [])) };
}
const A = season(4242, 4);

describe('the storyline pools', () => {
  const all = Object.entries(STORY_POOLS);
  it('give every entry an id of its own, across the old pools too', () => {
    const ids = all.flatMap(([, p]) => p.map(e => e.id));
    expect(new Set(ids).size).toBe(ids.length);
    const old = new Set(Object.values(POOLS).flatMap(p => p.map(e => e.id)));
    expect(ids.filter(id => old.has(id))).toEqual([]);
  });

  it('write every turn as one kind of line, by a known role, filtering only on known facts', () => {
    for (const [key, pool] of all) for (const e of pool) {
      for (const t of e.turns) {
        expect(['say', 'dr', 'beat'].filter(k => t[k]).length, `${key} ${e.id}`).toBe(1);
        if (t.say || t.dr) expect(['a', 'b', 'c', 'd', 'e', 'f', 'x', 'y'], `${key} ${e.id}`).toContain(t.by);
      }
      for (const k of Object.keys(e.when || {})) expect(BB_FACT_KEYS, `${key} ${e.id} when.${k}`).toContain(k);
      for (const p of e.presumes || []) expect(['hoh', 'noms', 'vote'], `${key} ${e.id}`).toContain(p);
      if (e.room) expect(ROOMS.has(e.room), `${key} ${e.id} room ${e.room}`).toBe(true);
      // background lines and cutaways are stage directions by design
      if (!/^(bg\.|set\.cut\.)/.test(key)) expect(e.turns.some(t => t.say || t.dr), `${key} ${e.id} has nobody speaking`).toBe(true);
    }
  });

  it('write scenes, not snippets: a scene is at least six lines (a Diary Room recap is one)', () => {
    for (const [key, pool] of all) {
      // recaps, cutaways, background lines and set-piece closes are one or two lines by design
      if (/^(recap\.|bg\.|set\.cut\.|set\.\w+\.close)/.test(key)) continue;
      // one person alone (a monologue to the Diary Room) or the cold war's silence can be shorter
      const solo = e => !JSON.stringify(e.turns).includes('{b}');
      for (const e of pool) expect(e.turns.length, `${key} ${e.id}`).toBeGreaterThanOrEqual(solo(e) || /^story\.feud\.cold/.test(key) ? 3 : 6);
    }
  });

  it('keep enough entries that a season does not hear the same scene twice', () => {
    for (const [key, pool] of all) {
      expect(pool.length, `${key}`).toBeGreaterThanOrEqual(3);
      expect(pool.filter(e => !e.when).length, `${key} unconditional`).toBeGreaterThanOrEqual(2);
    }
  });

  it('never talk about a past the house has not had, unless the line presumes it or answers a cause', () => {
    // The first-night bug: "what Damien said yesterday" on night one. A line that names a past
    // needs `presumes`, or must sit in a pool that can only air after its cause.
    const PAST = /\b(voted|last week|last night|yesterday|day one|used to|weeks)\b/i;
    const CAUSED = /^story\.(feud\.(argument|apology|cold)|alliance\.(betrayal|repair|leftout|checkin|exposed)|showmance\.(declare|hiding|jealous|fight|breakup)|scheme\.caught)|^recap\./;
    const bad = [];
    for (const [key, pool] of all) for (const e of pool) {
      const text = e.turns.map(t => t.say || t.dr || t.beat).join(' ');
      // the first-night sets only air on night one; the morning after only after an eviction
      if (/^set\.(firstnight|firstbed|morningafter)\./.test(key)) continue;
      if (PAST.test(text) && !e.presumes && !CAUSED.test(key) && e.when?.early !== false) bad.push(`${key} ${e.id}`);
    }
    expect(bad).toEqual([]);
  });

  it('never write a name into a pool', () => {
    for (const [key, pool] of all) for (const e of pool) {
      for (const n of NAMES.filter(n => !['Scary', 'Chase'].includes(n))) expect(JSON.stringify(e.turns).includes(n), `${key} ${e.id} names ${n}`).toBe(false);
    }
  });
});

describe('house life in real weeks', () => {
  const scenes = A.eps.flatMap(ep => ep.acts.flatMap(a => (a.scenes || []).map(sc => ({ ...sc, week: ep.num }))));

  it('airs three to five whole conversations a stretch, not a pile of snippets', () => {
    expect(scenes.length).toBeGreaterThan(30);
    const mean = scenes.reduce((s, sc) => s + sc.lines.length, 0) / scenes.length;
    expect(mean).toBeGreaterThan(8);
  });

  it('fills the house: whole-house set pieces, and most scenes with three or more people', () => {
    // The user, 2026-10-06: "we only have 2 person conversation", "no one in the background".
    const sets = scenes.filter(sc => sc.type === 'set');
    expect(sets.length, 'no whole-house set pieces').toBeGreaterThanOrEqual(A.eps.length * 3);
    expect(Math.min(...sets.map(sc => sc.cast.length))).toBeGreaterThanOrEqual(4);
    const crowded = scenes.filter(sc => sc.cast.length >= 3).length / scenes.length;
    expect(crowded).toBeGreaterThan(0.5);
    // and a private scene in a shared room usually shows somebody else around
    const bg = scenes.filter(sc => sc.type !== 'set' && sc.lines.some(l => l.bg)).length;
    expect(bg).toBeGreaterThan(scenes.length * 0.3);
  });

  it('prints no raw slot, and nobody speaks who is not on stage', () => {
    for (const sc of scenes) for (const l of sc.lines) {
      expect(l.text, `${sc.id}`).not.toMatch(/\{\w+(\.\w+)?\}/);
      if (l.by && l.kind === 'say') expect(sc.cast, `${sc.id}: ${l.by} speaks off stage`).toContain(l.by);
    }
  });

  it('never airs a step whose cause the viewer has neither seen nor been told', () => {
    for (const line of A.lines) for (const step of line.steps.filter(s => s.aired)) {
      const cause = causeOf(line, step);
      expect(cause, `${line.id} ${step.step} aired with no cause on record`).not.toBe(false);
    }
    // ...and a scene answering an unaired cause opens by saying it
    for (const line of A.lines) for (const step of line.steps.filter(s => s.aired)) {
      const cause = causeOf(line, step);
      if (!cause || cause.aired) continue;
      const sc = scenes.find(s => s.id === `${line.id}#${line.steps.indexOf(step)}`);
      if (sc) expect(sc.recap, `${sc.id} answers an unaired ${cause.step} without saying it`).toBe(true);
    }
  });

  it('only starts things on the first night: no argument, apology or betrayal before anybody has met', () => {
    const night = A.eps[0].acts.slice(0, A.eps[0].acts.findIndex(a => a.type === 'hoh'));
    for (const a of night) for (const sc of a.scenes || []) {
      expect(['argument', 'apology', 'betrayal', 'repair', 'caught', 'lobby', 'count', 'backdoor', 'pitch'], sc.id).not.toContain(sc.step);
    }
  });

  it('airs House Life from those scenes, in the order the week happened', () => {
    const screens = bbWeekSteps(A.eps[1], { houseLife: 'segments' }).filter(s => s.kind === 'houselife');
    expect(screens.length).toBeGreaterThan(1);
    const aired = screens.flatMap(s => s.storyScenes || []);
    const acts = A.eps[1].acts.flatMap(a => (a.scenes || []).map(sc => sc.id));
    expect(aired).toEqual(acts.filter(id => aired.includes(id)));
  });

  it('never airs the same scene twice, and keeps the rhythm of real house talk', () => {
    // Measured against Big Brother 22 transcripts (docs/bb-dialogue-style.md): strategy talk is
    // mostly short turns, but a season is not all clipped — arguments and heart-to-hearts run long.
    const ids = scenes.map(sc => sc.lineId);
    const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    expect(dup, 'a scene aired twice').toEqual([]);
    const says = scenes.flatMap(sc => sc.lines.filter(l => l.kind === 'say').map(l => l.text.split(/\s+/).length));
    const mean = says.reduce((a, b) => a + b, 0) / says.length;
    const short = says.filter(n => n <= 4).length / says.length;
    expect(mean).toBeGreaterThan(4);
    expect(mean).toBeLessThan(9);
    expect(short).toBeGreaterThan(0.25);
    expect(short).toBeLessThan(0.6);
    expect(Math.max(...scenes.map(sc => sc.lines.length))).toBeGreaterThanOrEqual(14);
  });

  it('classifies a friction beat with the offender as a, whichever way round the old pool had it', () => {
    const c = classify({ scene: { kind: 'friction.dishes', who: { a: 'Hurt', b: 'Did' }, data: { ending: 'snipe' } }, players: ['Hurt', 'Did'] });
    expect(c.roles.a).toBe('Did');
    expect(c.outcome).toBe('chores');
  });
});
