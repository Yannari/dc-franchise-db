// Veterans whatever the team is (the user, 2026-11-03: "how can i make them reference their show while their
// relationship is not reality tv"): a racer's past shows are a fact about them (rr/past.js), their lines name the show.
import { describe, it, expect } from 'vitest';
import { setPlayers } from '../js/core.js';
import { pastOf, pastOfTeam, metOn, pastEdge } from '../js/rr/past.js';
import { relLabel } from '../js/rr/story/previously.js';
import { playRaceSeason } from '../js/rr/season.js';
import { airSeason } from '../js/rr/episode.js';
import { raceCast } from './helpers/rr-cast.js';

// a career as franchise-meta.js careerFor gives it
const season = (format, seasonNum, placement, extra = {}) => ({ format, seasonNum, placement, winner: false, finalist: false, ...extra });
const careers = {
  Chase: { seasons: [season('total-drama', 9, 3, { finalist: true })], showmances: [{ partner: 'Nichelle' }], rivals: {}, allies: {} },
  Nichelle: { seasons: [season('total-drama', 9, 6)], showmances: [{ partner: 'Chase' }], rivals: {}, allies: {} },
  Lorraine: { seasons: [season('the-circle', 1, 2)], showmances: [], rivals: {}, allies: {} },
  Zella: { seasons: [season('big-brother', 1, 1, { winner: true })], showmances: [], rivals: {}, allies: {} },
};
const career = n => careers[n] || null;

describe('rr: a racer\'s past shows', () => {
  it('reads the show, the best they did, and what two were to each other there', () => {
    const c = pastOf('Chase', career), n = pastOf('Nichelle', career);
    expect(c.show).toBe('Total Drama');
    expect(c.best).toBe('final');
    expect(pastOf('Zella', career).best).toBe('won');
    expect(pastOf('Nobody', career)).toBeNull();
    expect(metOn(c, n, 'Nichelle')).toBe('showmance');
    expect(pastEdge(c, n)).toBe('ahead');
    expect(metOn(c, pastOf('Lorraine', career), 'Lorraine')).toBeNull();
    expect(pastOfTeam('Lorraine', 'Jace', career)).toEqual({ Lorraine: pastOf('Lorraine', career) });
  });

  it('Don says where they are back from, whatever they are to each other', () => {
    setPlayers([{ name: 'Chase', gender: 'm', stats: {} }, { name: 'Nichelle', gender: 'f', stats: {} }]);
    const past = pastOfTeam('Chase', 'Nichelle', career);
    expect(relLabel({ a: 'Chase', b: 'Nichelle', rel: 'married', past })).toBe('a married couple from Total Drama');
    expect(relLabel({ a: 'Chase', b: 'Nichelle', rel: 'reality-vets', past })).toBe('Total Drama veterans');
    expect(relLabel({ a: 'Chase', b: 'Nichelle', rel: 'married' })).toBe('a married couple');
  });
});

describe('rr: veterans on the race', () => {
  it('a vet names their show in the premiere and on the road, and a newcomer never does', () => {
    const named = [], newbies = [];
    for (let seed = 1; seed <= 6; seed++) {
      const { cast, teams } = raceCast(10, seed);
      setPlayers(cast);
      // three teams with a past: two from one season of Total Drama (a couple there), a vet with a newcomer, a winner
      const t = teams.slice(0, 3);
      t[0].rel = 'married';
      t[0].past = pastOfTeam(t[0].a, t[0].b, n => (n === t[0].a ? careers.Chase : careers.Nichelle) && { ...(n === t[0].a ? careers.Chase : careers.Nichelle), showmances: [{ partner: n === t[0].a ? t[0].b : t[0].a }] });
      t[1].past = pastOfTeam(t[1].a, t[1].b, n => (n === t[1].a ? careers.Lorraine : null));
      t[2].past = pastOfTeam(t[2].a, t[2].b, n => (n === t[2].a ? careers.Zella : null));
      for (const x of t) x.identity = null;
      const res = playRaceSeason({ teams, seed });
      for (const ep of airSeason(res)) for (const seg of ep.segments || []) for (const l of seg.lines || []) {
        if (/[{}]/.test(l.text)) throw new Error(`${seg.lineId}: ${l.text}`);
        if (/\b(Total Drama|The Circle|Big Brother)\b/.test(l.text)) {
          named.push(l.text);
          const tm = Object.values(res.state.teams).find(x => x.a === l.by || x.b === l.by);
          // (only somebody who was on a show says they were: a partner can name the other's)
          if (tm && !tm.past) newbies.push(`${seg.lineId}: ${l.by}: ${l.text}`);
        }
      }
    }
    expect(named.length).toBeGreaterThan(6);
    expect(newbies).toEqual([]);
  }, 300000);
});
