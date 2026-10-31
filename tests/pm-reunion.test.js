// The Perfect Match reunion (pm/reunion.js, pm/talk/reunion.js). The user,
// 2026-10-31: "we need a better reunion, 16 clicks is absolutely nothing. I need
// well written, at least 80 frames covering the whole season: drama, romance,
// are they still together, what happened, are you still friends, run by Dior.
// Every player has a dialogue, but the most important islanders have more
// screen time."
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { buildPerfectMatchSeasonDocument } from '../js/pm/export.js';
import { importance } from '../js/pm/reunion.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const seasons = [1, 2, 3, 4, 5].map(seed => {
  const cast = makeIslanders(22, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  const { rows, state } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });
  const row = rows.find(r => r.moment === 'reunion');
  const lines = row.pm.events.flatMap(e => (e.script?.lines || []).filter(l => l.who && !l.action));
  const per = Object.fromEntries(names.map(n => [n, lines.filter(l => l.who === n).length]));
  return { seed, names, rows, row, state, lines, per, imp: importance(state) };
});

describe('the reunion', () => {
  it('runs at least 80 lines, and every islander in the cast speaks at least twice', () => {
    for (const s of seasons) {
      expect(s.lines.length, `seed ${s.seed}`).toBeGreaterThanOrEqual(80);
      for (const n of s.names) expect(s.per[n], `seed ${s.seed}: ${n}`).toBeGreaterThanOrEqual(2);
    }
  });
  it('gives the islanders who carried the season the most screen time', () => {
    for (const s of seasons) {
      const by = [...s.names].sort((x, y) => s.imp[y] - s.imp[x]);
      const avg = ns => ns.reduce((t, n) => t + s.per[n], 0) / ns.length;
      expect(avg(by.slice(0, 5)), `seed ${s.seed}`).toBeGreaterThan(avg(by.slice(-5)) * 1.5);
    }
  });
  it('writes every scene, and never plays the same one twice in a night', () => {
    for (const s of seasons) {
      const ids = s.row.pm.events.map(e => String(e.script?.id || '').replace(/:.*/, ''));
      for (const [i, id] of ids.entries()) expect(id, `seed ${s.seed}: ${s.row.pm.events[i].kind}`).not.toMatch(/\.0$/);
      const dup = ids.filter((id, i) => ids.indexOf(id) !== i && !id.startsWith('ru-host'));
      expect(dup, `seed ${s.seed}`).toEqual([]);
    }
  });
  it('covers the season: the winners, the couples, and the people they fell out with', () => {
    for (const s of seasons) {
      const kinds = new Set(s.row.pm.events.map(e => e.kind));
      for (const k of ['ru-open', 'ru-winners', 'ru-couple', 'ru-public', 'ru-quick', 'ru-close']) expect(kinds.has(k), `seed ${s.seed}: ${k}`).toBe(true);
      expect(['ru-steal', 'ru-casa', 'ru-exes', 'ru-feud', 'ru-friends'].filter(k => kinds.has(k)).length, `seed ${s.seed}`).toBeGreaterThanOrEqual(3);
    }
  });
  it('says the same thing about a couple everywhere: the studio, the close and the export', () => {
    for (const s of seasons) {
      const rec = s.row.pm.reunion;
      expect(rec?.couples?.length, `seed ${s.seed}`).toBeGreaterThan(0);
      const fateOf = (a, b) => rec.couples.find(c => [c.a, c.b].includes(a) && [c.a, c.b].includes(b))?.fate;
      for (const e of s.row.pm.events.filter(e => ['ru-winners', 'ru-couple', 'ru-close'].includes(e.kind) && e.players.length === 2)) {
        expect(e.extra.fate, `seed ${s.seed}: ${e.kind} ${e.players}`).toBe(fateOf(...e.players));
      }
      const doc = buildPerfectMatchSeasonDocument(s.rows, { seasonNumber: 1 });
      for (const c of rec.couples) {
        const p = doc.placements.find(x => x.name === c.a);
        if (p?.showmance !== c.b) continue;
        expect(p.showmanceEnded, `seed ${s.seed}: ${c.a} and ${c.b} ${c.fate}`).toBe(c.fate === 'split' || c.fate === 'friends' ? 'broken' : 'intact');
      }
    }
  });
});
