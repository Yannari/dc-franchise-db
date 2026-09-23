import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { schemeEligible } from '../js/pm/feelings.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\r\n]*/g, '');

function season(seed) {
  const cast = makeIslanders(22, seed);
  setPlayers(cast);
  const names = cast.map(p => p.name);
  return playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });
}

describe('relationships are one-way and layered, and reach the row', () => {
  it('every villa episode snapshots relationships and labels', () => {
    const { rows } = season(1);
    for (const r of rows.filter(x => x.moment !== 'reunion')) {
      // Everybody in the villa has at least one relationship on the row —
      // a count threshold would only measure how big the villa was that week.
      for (const n of r.pm.villa) {
        expect(Object.keys(r.pm.relationships).some(k => k.startsWith(`${n}→`)), `${n} ep${r.num}`).toBe(true);
      }
      expect(Array.isArray(r.pm.relLabels)).toBe(true);
    }
  });

  it('romance is not symmetric: most pairs differ by direction', () => {
    // Pooled over seasons: one season's episode 7 is one sample, and a guard
    // that measures one sample passes or fails on the seed (§11.5).
    // Six seasons read 49% on the 2026-09-23 night-one rebuild while twenty
    // read 55% both before and after it: the sample, not the engine. Twelve.
    let pairs = 0, differ = 0;
    for (let s = 1; s <= 12; s++) {
      const rel = season(s).rows[6].pm.relationships;
      for (const [k, [r]] of Object.entries(rel)) {
        const [a, b] = k.split('→');
        const back = rel[`${b}→${a}`];
        if (!back || a > b) continue;
        pairs++; if (Math.abs(r - back[0]) >= 1) differ++;
      }
    }
    expect(differ / pairs).toBeGreaterThan(0.5);
  });

  it('over ten seasons, the relationship shapes all appear', () => {
    const seen = new Set();
    for (let s = 1; s <= 10; s++) for (const r of season(s).rows) for (const [, , , text] of r.pm.relLabels) seen.add(text);
    for (const want of ['Hidden crush', 'One-way crush', 'Just friends', 'Coupled']) expect(seen, want).toContain(want);
  });

  it('faking and manipulation only ever come from scheme-eligible islanders', () => {
    for (let s = 1; s <= 10; s++) {
      const { rows, state } = season(s);
      for (const r of rows) {
        for (const [a, , , text] of r.pm.relLabels) if (text === 'Faking it') expect(schemeEligible(state.profiles[a]), a).toBe(true);
        for (const e of r.pm.events.filter(e => e.kind === 'love-bomb' || e.kind === 'gaslight')) {
          expect(schemeEligible(state.profiles[e.players[0]]), e.players[0]).toBe(true);
        }
      }
    }
  });

  it("no decision file reads another islander's true romance toward the decider", () => {
    // A decision may call romance(me, you) and believed(state, me, you) — never romance(you, me).
    for (const f of ['recoupling.js', 'casa.js', 'villa-vote.js']) {
      const src = strip(readFileSync(join(ROOT, 'js', 'pm', f), 'utf8'));
      expect(src, f).not.toMatch(/romance\(\s*c\s*,\s*p\s*\)|romance\(\s*p\s*,\s*o\s*\)/);
      expect(src, f).not.toMatch(/getPerceivedBond/);
    }
  });
});
