// The Ridonculous Race's premiere meets its teams the way the show does (the user, 2026-10-19: "there's no real arrival
// and team presentation like in the transcript"): Don's welcome, every team introduced as it turns up, in its identity's
// words or in what the two of them are to each other, and only then the rules and the start.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr premiere', () => {
  let res, eps;
  beforeAll(() => {
    const { cast, teams } = raceCast(12, 9);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 9 });
    eps = airSeason(res);
  });

  it("opens on Don's welcome, then every team introduced once, then his rules", () => {
    const segs = eps[0].segments;
    expect(segs[0].kind).toBe('don-narrate');
    expect(segs[0].ending).toBe('welcome');
    const intros = segs.filter(s => s.kind === 'team-intro');
    expect(intros.map(s => s.teams[0]).sort()).toEqual([...res.state.order].sort());
    const last = segs.lastIndexOf(intros.at(-1));
    const opener = segs.findIndex(s => s.kind === 'don-opener');
    expect(opener).toBeGreaterThan(last);
    expect(segs.slice(1, last + 1).every(s => s.kind === 'team-intro')).toBe(true);
  });

  it('every introduction names both of them, in their identity or their relationship', () => {
    for (const s of eps[0].segments.filter(x => x.kind === 'team-intro')) {
      const t = res.state.teams[s.teams[0]];
      const text = s.lines.map(l => l.text).join(' ');
      expect(text, t.name).toContain(t.a);
      expect(text, t.name).toContain(t.b);
      expect(s.lines.some(l => l.by === 'Don')).toBe(true);
      // ...and the two of them in the confessional (a team that says nothing, the Goths, is shown, not interviewed)
      if (!/^pi\.goths$/.test(s.lineId)) expect(s.lines.some(l => l.kind === 'conf'), t.name).toBe(true);
      expect(s.lineId, t.name).toMatch(t.identity ? /^pi\./ : /^pr\./);
    }
  });

  it('only the premiere does it', () => {
    for (const ep of eps.slice(1)) expect(ep.segments.some(s => s.kind === 'team-intro' || s.ending === 'welcome')).toBe(false);
  });
});

describe('an identity introduction says what the two of them are', () => {
  it('a team that races as an identity also tells us it is exes, enemies, coworkers..., in a line of its own', async () => {
    const { REL_TAGS } = await import('../js/rr/script/lines/premiere-rel-tags.js');
    const { cast, teams } = raceCast(12, 4);
    const rels = ['exes', 'enemies', 'coworkers', 'married', 'siblings', 'bffs'];
    teams.forEach((t, i) => { t.rel = rels[i % rels.length]; });
    setPlayers(cast);
    const r = playRaceSeason({ teams, seed: 4 });
    const intros = airSeason(r)[0].segments.filter(s => s.kind === 'team-intro' && /^pi\./.test(s.lineId));
    expect(intros.length).toBeGreaterThan(3);
    for (const s of intros) {
      const t = r.state.teams[s.teams[0]];
      const tags = (REL_TAGS[t.rel] || []).map(x => x.replace(/\{\w+\}/g, ''));
      const text = s.lines.map(l => l.text).join(' ');
      const has = tags.some(x => text.includes(x.slice(0, 25)));
      expect(has, `${t.rel}: ${text}`).toBe(t.rel !== 'bffs' && t.identity !== 'goths');
    }
  });

  it('the tag lines keep the show rules: no vote words, no head counts', async () => {
    const { REL_TAGS } = await import('../js/rr/script/lines/premiere-rel-tags.js');
    for (const lines of Object.values(REL_TAGS)) for (const l of lines) {
      expect(l).not.toMatch(/\b(vote[sd]?|voting|jury|tribal|evict|nominat)/i);
      expect(l).not.toMatch(/\b(you|us|we) (two|three|four)\b|\bthe (three|four) of (us|you)\b/i);
    }
  });
});
