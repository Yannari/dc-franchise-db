// ci-season-read.test.js — bugs found by reading whole seasons (2026-10-01,
// user: "run seasons audit then fix bugs"). Each check is a class of bug a
// read turned up, measured over real-roster seasons.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { seasonText } from '../js/ci/transcript.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const runs = [11, 23, 37, 4, 9, 15].map(seed => {
  const cast = rosterCast(13, seed); setPlayers(cast); const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
});
const lines = (sc) => (sc.script?.blocks || []).flatMap(b => b.lines.map(l => ({ key: b.key, ...l })));

describe('a read of whole seasons', () => {
  it('the first ratings night claims no standing: nobody is "winning" before anyone has been rated', () => {
    const STANDING = /winning|the winner|runs this place|stays on top|than last time/i;
    for (const { state } of runs) {
      const first = state.scenes.find(s => s.kind === 'ratings' && s.aired);
      const said = lines(first).filter(l => STANDING.test(l.text || ''));
      expect(said.map(l => `${l.key}: ${l.text}`)).toEqual([]);
    }
  });
  it('a catfish walking into the finale is never told they look like their pictures', () => {
    for (const { state } of runs) for (const s of state.scenes.filter(x => x.kind === 'meet' && x.aired)) {
      for (const b of s.script.blocks.filter(x => x.key === 'meet.react')) {
        const about = b.on?.b;
        if (about && state.profiles[about]?.mode === 'catfish') {
          expect(b.lines.map(l => l.text).join(' ')).not.toMatch(/exactly like I pictured/);
        }
      }
    }
  });
  it('a nationality is never printed as a hometown', () => {
    for (const { state, rows, result } of runs) expect(seasonText(state, rows, result)).not.toMatch(/from (Swiss|British|French|German|Canadian|American|Mexican|Italian)\b/);
  });
  it('day one: no two players set up their profile with the same line', () => {
    for (const { state } of runs) {
      const prof = state.scenes.find(s => s.kind === 'profiles');
      const said = prof.script.blocks.filter(b => b.key.startsWith('profile.')).map(b => b.lines.map(l => l.text).join(' '));
      expect(said.length - new Set(said).size).toBe(0);
    }
  });
});

// A profile swap day is written after it is played: the scenes before the
// swap must still name the person who was behind each profile then, and a
// line typed for a swapped profile says who was typing.
import { setPlayers as _sp } from '../js/core.js';
describe('a profile swap', () => {
  it('the morning before the swap reads the owners; during it, the typist is named', () => {
    let checked = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const cast = rosterCast(13, seed); _sp(cast); const names = cast.map(p => p.name);
      const { state, rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed,
        options: { bookings: { social1: 'ci-profile-swap' } } });
      const swap = state.scenes.find(s => s.kind === 'swap');
      if (!swap) continue;
      checked++;
      const [A, B] = swap.data.handles;
      const [pa, pb] = swap.data.people;   // the owners before the swap
      // before: a stage direction under A's line names A's owner, never B's
      for (const s of state.scenes.filter(x => x.day === swap.day && x.id < swap.id && x.script)) {
        for (const b of s.script.blocks) {
          for (const l of b.lines) if (l.who === A) expect(l.person, `${s.kind} ${l.text}`).toBeUndefined();
          // a stage direction under A's own line is about A's owner, not the one who takes A over later
          const onlyA = b.lines.length && b.lines.every(l => l.who === A);
          if (onlyA && b.beat && !pa[0].startsWith(pb[0].split(' ')[0])) expect(b.beat, b.key).not.toContain(pb[0].split(' ')[0]);
        }
      }
      // during: A's lines are typed by B's owner, and say so
      const during = state.scenes.filter(x => x.id > swap.id && x.day === swap.day && x.script)
        .flatMap(s => s.script.blocks.flatMap(b => b.lines)).filter(l => l.who === A && l.kind !== 'stage');
      for (const l of during) expect(l.person).toBe(pb[0].split(' ')[0]);
      // and the screen draws that day's earlier scenes with the morning's people
      const row = rows.find(r => r.day === swap.day);
      const early = row.ci.aired.find(s => s.id < swap.id && s.who.includes(A));
      if (early) expect(early.people?.[A]).toEqual(pa);
    }
    expect(checked).toBeGreaterThan(2);
  });
});

// Round two of reading seasons.
import { styleMessage } from '../js/ci/voice.js';
import { placeOf } from '../js/ci/topics.js';
import { POOLS } from '../js/ci/lines/index.js';
describe('a second read', () => {
  it('a hashtag that opens a message is the message: kept by a voice that never uses one', () => {
    expect(styleMessage('{t:CircleFam} forever', { hashtags: 0, emoji: 0 }, () => 0.99)).toBe('{t:CircleFam} forever');
    expect(styleMessage('Good morning {t:Blessed}', { hashtags: 0, emoji: 0 }, () => 0.99)).toBe('Good morning');
  });
  it('the same words never air twice in a day, even from two pools', () => {
    for (const { rows } of runs) for (const row of rows) {
      const said = row.ci.aired.flatMap(s => (s.script?.blocks || []).flatMap(b => b.lines))
        .filter(l => l.kind !== 'host' && l.kind !== 'stage' && (l.text || '').length > 30).map(l => l.text);
      const twice = said.filter((t, i) => said.indexOf(t) !== i);
      expect(twice, `day ${row.day}`).toEqual([]);
    }
  });
  it('an owner who slipped still says the answer was theirs', () => {
    for (const e of POOLS['game.guess.owner'].filter(x => x.when?.off)) expect(e.turns[0].say || e.turns[0].react).toMatch(/mine|me\b/i);
  });
  it('a hometown prints as a place', () => {
    expect(placeOf('Sao paulo')).toBe('Sao Paulo');
    expect(placeOf('Rio de Janeiro')).toBe('Rio de Janeiro');
    expect(placeOf('Swiss')).toBe(null);
  });
});
