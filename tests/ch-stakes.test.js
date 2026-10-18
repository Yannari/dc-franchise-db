// The stakes (js/ch/stakes.js) and Redemption House (js/ch/redemption.js): the bank, injuries, TJ's power
// rankings always on; the Red Skull (or ring) and Redemption House as season twists. Each one changes the game
// and every one of them reaches the screen.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { chStepScreens, chStepText } from '../js/vp-ch-ep/steps.js';
import { challengeCast } from './helpers/ch-cast.js';

describe('the stakes and Redemption House', () => {
  const seasons = [[9, 'skull'], [21, 'ring']].map(([seed, token]) => {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed, options: { finalPass: token, redemption: true } });
    airSeason(r.state);
    return { r, names, rows: challengeRows(r), token };
  });

  it('every player is placed once; nobody is left in Redemption House at the end', () => {
    for (const { r, names } of seasons) {
      for (const n of names) expect(r.placements[n], `${n} has no placement`).toBeTruthy();
      const goneNames = r.state.gone.map(g => g.name);
      expect(new Set(goneNames).size, 'a player is gone twice').toBe(goneNames.length);
      expect(r.state.redemption.residents).toEqual([]);
      // the places below the final are each used once
      const places = r.state.gone.map(g => g.place).sort((a, b) => a - b);
      expect(new Set(places).size).toBe(places.length);
    }
  });

  it('Redemption House sends people back in, and the ones who lose there never come back', () => {
    for (const { r } of seasons) {
      const H = r.state.redemption;
      expect(H.returned.length).toBeGreaterThan(2);
      for (const n of H.out) {
        const g = r.state.gone.find(x => x.name === n);
        const later = r.state.scenes.filter(s => s.ep > g.ep && s.who.includes(n));
        expect(later.map(s => s.kind), `${n} is in a scene after going home`).toEqual([]);
      }
      // a resident is never in the villa: every scene they are in while waiting is at Redemption House
      for (const e of r.state.episodes) {
        const arrive = r.state.scenes.filter(s => s.ep === e.ep && s.kind === 'redemption-arrive');
        for (const a of arrive) {
          const n = a.who[0];
          const back = r.state.scenes.find(s => s.kind === 'redemption-return' && s.who[0] === n && s.id > a.id);
          const out = r.state.gone.find(g => g.name === n);
          const until = back ? back.id : out ? Infinity : Infinity;
          const between = r.state.scenes.filter(s => s.id > a.id && s.id < until && s.who.includes(n) && (!out || s.ep <= out.ep));
          for (const s of between) expect(s.spot, `${n} in ${s.kind} while in Redemption House`).toBe('redemption');
        }
      }
    }
  });

  it('nobody runs the final without a skull, unless their division would have fewer than two', () => {
    for (const { r } of seasons) {
      const cut = r.state.finalEp.cut;
      for (const n of cut) expect(r.state.skulls[n] || 0).toBe(0);
      const divs = ['m', 'f'];
      for (const d of divs) {
        const fin = r.state.final.finalists.filter(n => r.state.division[n] === d);
        const without = fin.filter(n => !r.state.skulls[n]);
        expect(fin.length).toBeGreaterThanOrEqual(2);
        if (without.length) expect(fin.filter(n => r.state.skulls[n]).length).toBeLessThan(2);
      }
    }
  });

  it('the bank pays the daily winners and the Arena takes half; champions bank the prize', () => {
    for (const { r } of seasons) {
      const paid = r.state.episodes.filter(e => e.daily?.purse).length;
      expect(paid).toBeGreaterThan(10);
      const took = r.state.episodes.flatMap(e => e.arena).filter(d => d.took > 0);
      expect(took.length).toBeGreaterThan(3);
      for (const c of r.state.champions) expect(r.state.bank[c]).toBeGreaterThanOrEqual(250000);
    }
  });

  it('every movement of the bank is on its episode\'s row with its reason, and they add up', () => {
    // the Intel's Money tab reads row.ch.money (the user, 2026-10-18: "how do I see the money of each week")
    for (const { r, rows } of seasons) {
      let checked = 0;
      for (const row of rows) {
        const I = row.ch?.intel;
        if (!I?.start?.rec || !I?.end?.rec || row.ch.final) continue;
        expect(Array.isArray(row.ch.money)).toBe(true);
        for (const m of row.ch.money) expect(['daily', 'arena-win', 'arena-took', 'arena-lost'], m.why).toContain(m.why);
        // somebody back from Redemption House mid-episode was not in the opening snapshot
        for (const n of I.end.players.filter(x => I.start.rec[x])) {
          const sum = row.ch.money.filter(m => m.name === n).reduce((s, m) => s + m.delta, 0);
          expect((I.start.rec[n].bank || 0) + sum, `${n} in episode ${row.num}`).toBe(I.end.rec[n].bank);
          checked++;
        }
      }
      expect(checked).toBeGreaterThan(50);
      // the champions' prize is on the final's row
      const fin = rows.find(x => x.ch?.final);
      for (const c of r.state.champions) expect(fin.ch.money.some(m => m.name === c && m.why === 'champion')).toBe(true);
    }
  });

  it('every new scene kind writes and airs, and no step prints an unfilled slot', () => {
    const kinds = new Set();
    for (const { r, rows } of seasons) {
      for (const e of [...r.state.episodes, r.state.finalEp]) for (const a of e?.aired || []) if (/^(bank|injury|power|pass|redemption|ranking|money)/.test(a.kind) && a.script?.lines?.length) kinds.add(a.kind);
      for (const row of rows) {
        expect(() => chStepScreens(row)).not.toThrow();
        expect(chStepText(row), `ep ${row.num}`).not.toMatch(/\{\w+\}|undefined|NaN|\[object/);
      }
    }
    for (const k of ['bank-taken', 'power-rankings', 'pass-earned', 'pass-cut', 'redemption-arrive', 'redemption-duel', 'redemption-return'])
      expect([...kinds], `${k} never aired`).toContain(k);
  });
});
