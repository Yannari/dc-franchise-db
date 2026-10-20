// A season draws its twists. Found 2026-10-20: the Boomerang, its pick-a-team version, the Yield and the Zip-It were
// built and tested one by one, but nothing put them on a leg: five seasons, sixty-five legs, not one twist. And the
// Zip-It's task was never run by a leg at all.
import { describe, it, expect } from 'vitest';
import { buildSchedule } from '../js/rr/schedule.js';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const DRAWN = ['boomerang', 'yield', 'zip-it', 'boomerang-vote'];

describe('rr twists in a season', () => {
  it('draws a Boomerang, a Yield, a Zip-It and a pick-a-team Boomerang, never on the first leg or the last two', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const legs = buildSchedule({ teams: 12, seed });
      const tw = legs.map(l => l.twist);
      for (const k of DRAWN) expect(tw.filter(x => x === k).length, `seed ${seed} ${k}: ${tw}`).toBeGreaterThan(0);
      expect(tw[0]).toBeNull();
      expect(tw.at(-1)).toBeNull();
      expect(tw.at(-2)).toBeNull();
      tw.forEach((x, i) => { if (x && i) expect(tw[i - 1], `seed ${seed}: ${tw}`).not.toBe(x); });
      // the pick-a-team Boomerang is a late-season twist: the teams have a record to judge by
      expect(tw.indexOf('boomerang-vote')).toBeGreaterThanOrEqual(Math.floor(legs.length / 2) - 1);
    }
  });

  it('keeps the same legs, kinds and money as a season drawn before twists were', () => {
    const a = buildSchedule({ teams: 12, seed: 7 });
    const b = buildSchedule({ teams: 12, seed: 7, options: { surprises: false } });
    expect(a.map(l => [l.kind, l.money, l.reward])).toEqual(b.map(l => [l.kind, l.money, l.reward]));
  });

  it('with surprises off, only the twists pinned on the Season Timeline happen', () => {
    const legs = buildSchedule({ teams: 12, seed: 3, options: { surprises: false, twistPins: { 4: 'yield' } } });
    expect(legs.map(l => l.twist).filter(Boolean)).toEqual(['yield']);
    expect(legs[3].twist).toBe('yield');
  });

  it('a pinned twist counts toward the season, and a leg pinned to none has none', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const legs = buildSchedule({ teams: 12, seed, options: { twistPins: { 3: 'zip-it', 6: 'none' } } });
      expect(legs[2].twist).toBe('zip-it');
      expect(legs[5].twist).toBeNull();
      expect(legs.filter(l => l.twist === 'zip-it')).toHaveLength(1);
    }
  });

  it('airs the twists: the Boomerang used and served, the Yield, the Zip-It tried, and Don reading each rule', () => {
    const seen = {};
    let zipSkipped = 0;
    for (const seed of [41, 42, 43]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed });
      for (const ep of airSeason(res)) for (const s of ep.segments) seen[s.kind] = (seen[s.kind] || 0) + 1;
      // a team that wins the Zip-It runs none of the leg's tasks after it
      res.legs.forEach(leg => {
        if (leg.twist !== 'zip-it') return;
        const won = leg.scenes.find(s => s.kind === 'zip-it' && s.data?.ending === 'takes-it');
        if (!won) return;
        const id = won.data.team;
        const zipAt = leg.log.find(l => l.id === id && l.stretch === 'zip');
        const after = leg.log.filter(l => l.id === id && l.from >= zipAt.to && leg.stretchKinds[l.stretch] !== 'travel' && leg.stretchKinds[l.stretch] !== 'mat');
        expect(after, `seed ${seed} leg ${leg.n}`).toEqual([]);
        zipSkipped++;
      });
    }
    for (const k of ['boomerang-found', 'boomerang-decide', 'boomerang-hit', 'boomerang-vote', 'yield', 'zip-it', 'don-rule']) {
      expect(seen[k] || 0, `${k} aired: ${JSON.stringify(seen)}`).toBeGreaterThan(0);
    }
    expect(zipSkipped).toBeGreaterThan(0);
  }, 400000);

  // the 2026-10-20 screenshots: the Magicians stood at the board while the team they'd Boomeranged swore to find out
  // who did it. A twist names the other team, but it isn't there: it passed the board long ago (or hasn't reached it)
  it("shows only the team the twist happens to, never the team it names", () => {
    const shown = [];
    let n = 0;
    for (const seed of [41, 42]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      for (const ep of airSeason(playRaceSeason({ teams, seed }))) for (const s of ep.segments) {
        if (!['boomerang-hit', 'boomerang-decide', 'yield', 'zip-it'].includes(s.kind) || s.ending === 'standoff') continue;
        n++;
        if (s.teams.length !== 1) shown.push(`seed ${seed} leg ${ep.n} ${s.kind}/${s.ending}: ${s.teams.join(', ')}`);
      }
    }
    expect(n).toBeGreaterThan(4);
    expect(shown).toEqual([]);
  }, 400000);

  // the 2026-10-20 read (seed 41): the teams wrote their cards before Don had said what the cards were for (he read the
  // rule at the board, hours later); the team every card named said "Somebody Boomeranged us. I'm going to find out
  // who"; and at the Zip-It, Don explained the Boomerang and the Yield
  it('says each rule before it happens and in its own words', () => {
    const wrong = [];
    let picks = 0, zips = 0, hits = 0;
    for (const seed of [41, 42, 43]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed });
      airSeason(res).forEach((ep, i) => {
        const leg = res.legs[i];
        const segs = ep.segments;
        const at = k => segs.findIndex(s => s.kind === k);
        const text = s => s.lines.map(l => l.text).join(' ');
        if (leg.twist === 'boomerang-vote') {
          picks++;
          const rule = at('don-rule'), pick = at('boomerang-vote'), open = at('don-opener');
          if (!(open < pick)) wrong.push(`seed ${seed} leg ${leg.n}: the cards before Don's opener`);
          if (rule >= 0 && !(rule < pick)) wrong.push(`seed ${seed} leg ${leg.n}: the cards before the rule`);
        }
        for (const s of segs) {
          if (s.kind === 'don-rule' && leg.twist === 'zip-it') {
            zips++;
            if (!/Zip-It/.test(text(s)) || /Boomerang|Yield/.test(text(s))) wrong.push(`seed ${seed} leg ${leg.n} zip rule: ${text(s)}`);
          }
          if (s.kind === 'don-rule' && leg.twist !== 'zip-it' && /Zip-It/.test(text(s))) wrong.push(`seed ${seed} leg ${leg.n} ${leg.twist} rule: ${text(s)}`);
          if (s.kind === 'boomerang-hit' && leg.twist === 'boomerang-vote') {
            hits++;
            if (/somebody|find out|who did|who would/i.test(text(s))) wrong.push(`seed ${seed} leg ${leg.n} picked: ${text(s)}`);
          }
        }
      });
    }
    expect(picks).toBeGreaterThan(0);
    expect(zips).toBeGreaterThan(0);
    expect(hits).toBeGreaterThan(0);
    expect(wrong).toEqual([]);
  }, 400000);
});
