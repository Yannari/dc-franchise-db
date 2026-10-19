// The Ridonculous Race: "previously on", from what actually aired (dialogue plan, Task 10).
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { previouslyFor, RECAP_KINDS, teamRef, teamTag } from '../js/rr/story/previously.js';
import { getPlace } from '../js/rr/places.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr previously', () => {
  let res, eps;
  beforeAll(() => {
    const { cast, teams } = raceCast(10, 7);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 7 });
    eps = airSeason(res);
  });

  it('the first episode has none; every later one opens on it', () => {
    expect(eps[0].previously).toBeNull();
    for (const ep of eps.slice(1)) expect(ep.previously, `leg ${ep.n}`).toBeTruthy();
  });

  it('recaps only moments that aired last time, at most four (a storyline moment or two, the winner, the exit), Don speaking', () => {
    for (let i = 1; i < eps.length; i++) {
      const p = eps[i].previously;
      const airedLast = new Set(eps[i - 1].segments.map(s => s.scene).filter(x => x != null));
      expect(p.scenes.length).toBeGreaterThan(0);
      expect(p.scenes.length).toBeLessThanOrEqual(4);
      for (const id of p.scenes) expect(airedLast.has(id), `leg ${eps[i].n} recaps #${id}`).toBe(true);
      expect(p.lines.filter(l => !l.clip).every(l => l.by === 'Don')).toBe(true);
      for (const l of p.lines) expect(l.text).not.toMatch(/[{}]|undefined/);
    }
  });

  it("names last episode's exit when there was one", () => {
    for (let i = 1; i < eps.length; i++) {
      const out = res.legs[i - 1].eliminated;
      if (!out.length) continue;
      expect(eps[i].previously.lines.map(l => l.text).join(' ')).toContain(teamRef(res.state, out[0]).replace(/^the /, ''));
    }
  });

  it('Don tells it the way the show does: the leg in a line, the winners, who went home, "but that was then"', () => {
    for (let i = 1; i < eps.length; i++) {
      const p = eps[i].previously, texts = p.lines.filter(l => !l.clip).map(l => l.text);
      const leg = res.legs[i - 1], place = getPlace(leg.place);
      expect(texts[0], `leg ${eps[i].n}`).toMatch(/^Last time on The Ridonculous Race/);
      expect(texts[0], `leg ${eps[i].n}`).toContain(place.recap || place.name);
      expect(texts.at(-1)).toBe('But that was then, and this is The Ridonculous Race!');
      const t = res.state.teams[leg.order[0]];
      expect(texts.some(x => x.includes(t.a) && x.includes(t.b)), `leg ${eps[i].n}: the winners by name`).toBe(true);
      const out = leg.eliminated[0];
      if (out) expect(texts.some(x => x.includes(teamRef(res.state, out).replace(/^the /, ''))), `leg ${eps[i].n}: the exit`).toBe(true);
      for (const x of texts) expect(x[0], x).toBe(x[0].toUpperCase());
    }
  });

  it('the winners are named the way the show names them: "best friends Carrie and Devin", "the Goths, Crimson and Ennui"', () => {
    for (const id of Object.keys(res.state.teams)) {
      const tag = teamTag(res.state, id), t = res.state.teams[id];
      expect(tag).toContain(t.a);
      expect(tag).toContain(t.b);
      expect(tag).not.toMatch(/undefined|null|parent-child|grandparent-grandchild|newly-dating|once-engaged|reality-vets|on-off/);
    }
  });

  it('a team is named the way a host says it: "the Goths", "Alec and Spud", never a bare label', () => {
    const labels = Object.values(res.state.teams).filter(t => t.identity).map(t => t.name);
    for (const ep of eps.slice(1)) for (const l of ep.previously.lines.filter(x => !x.clip)) {
      for (const name of labels) {
        const bare = new RegExp(`(^|[^e] )${name}\b|^${name}\b`);
        expect(l.text.replace(new RegExp(`[Tt]he ${name}`, 'g'), ''), `${l.text}`).not.toMatch(bare);
      }
      expect(l.text).not.toMatch(/ & /);
    }
  });

  it('never recaps the same kind of moment for the same team twice', () => {
    for (const ep of eps.slice(1)) {
      const seen = new Set();
      for (const id of ep.previously.scenes) {
        const sc = res.state.scenes.find(s => s.id === id);
        const k = `${sc.kind}|${sc.data.team}`;
        expect(seen.has(k), k).toBe(false);
        seen.add(k);
      }
    }
  });

  it('one moment of each kind in a recap (three sabotages in a row is a list, not a story)', () => {
    for (const ep of eps.slice(1)) {
      const beats = ep.previously.kinds.filter(k => !['don-place', 'don-elim', 'don-arrives', 'don-fakeout'].includes(k))
        .map(k => (res.state.scenes.find(s => s.kind === k)?.family === 8 ? 'sabotage' : k));
      expect(new Set(beats).size, `leg ${ep.n}: ${beats}`).toBe(beats.length);
    }
  });

  it('replays what was really said: a clip of each moment, word for word, right after Don sets it up', () => {
    let withClips = 0;
    for (let i = 1; i < eps.length; i++) {
      const p = eps[i].previously;
      const said = new Set(eps[i - 1].segments.flatMap(s => s.lines || []).filter(l => l.kind !== 'beat').map(l => `${l.by}|${l.text}`));
      const clips = p.lines.filter(l => l.clip);
      if (clips.length >= 2) withClips++;
      for (const l of clips) expect(said.has(`${l.by}|${l.text}`), `leg ${eps[i].n}: ${l.by}: ${l.text}`).toBe(true);
      expect(p.lines[0].clip, 'Don opens').toBeFalsy();
      expect(p.lines.at(-1).clip, 'Don closes').toBeFalsy();
      // a clip follows Don's line about it, two at most in a row
      let run = 0;
      for (const l of p.lines) { run = l.clip ? run + 1 : 0; expect(run).toBeLessThanOrEqual(2); }
    }
    expect(withClips / (eps.length - 1)).toBeGreaterThanOrEqual(0.8);
  });

  it('only recaps kinds it has words for', () => {
    for (const ep of eps.slice(1)) for (const k of ep.previously.kinds) expect(RECAP_KINDS).toContain(k);
  });
});
