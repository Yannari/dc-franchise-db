// Every spoken line of the two season modes carries the five voice families (the user, 2026-10-17: "a lot of dialogues
// with voices"). lines/pairs*.js, lines/teams.js, lines/pair-life.js and lines/team-life.js: a new entry there ships with
// its voices (inline v, or a voices/*.js overlay keyed by the final turn index).
import { describe, expect, it } from 'vitest';
import { POOLS } from '../js/ch/script/lines/index.js';
import pairs from '../js/ch/script/lines/pairs.js';
import pairVote from '../js/ch/script/lines/pairs-vote.js';
import pairMore from '../js/ch/script/lines/pairs-more.js';
import teams from '../js/ch/script/lines/teams.js';
import pairLife from '../js/ch/script/lines/pair-life.js';
import teamLife from '../js/ch/script/lines/team-life.js';

const FAMILIES = ['sharp', 'dry', 'loud', 'soft', 'odd'];
const TOKEN = /\{(\w+)(?:\.\w+)?\}/g;

describe('the season modes are voiced', () => {
  const byId = {};
  for (const list of Object.values(POOLS)) for (const e of list) byId[e.id] = e;
  const files = { pairs, pairVote, pairMore, teams, pairLife, teamLife };
  it('every spoken turn has all five families, and no variant names a slot its line does not', () => {
    const short = [], extra = [];
    for (const [f, mod] of Object.entries(files)) for (const list of Object.values(mod)) for (const e0 of list) {
      const e = byId[e0.id] || e0;
      e.turns.forEach((t, i) => {
        if (t.beat || !t.by || t.by === 'tj') return;
        const missing = FAMILIES.filter(k => ![t.v?.[k]].flat().filter(Boolean).length);
        if (missing.length) short.push(`${f} ${e.id}[${i}] ${missing.join(',')}`);
        const base = new Set([...String(t.say || t.conf).matchAll(TOKEN)].map(m => m[1]));
        for (const k of FAMILIES) for (const line of [t.v?.[k]].flat().filter(Boolean))
          for (const m of line.matchAll(TOKEN)) if (!base.has(m[1])) extra.push(`${e.id}[${i}] ${k}: {${m[1]}}`);
      });
    }
    expect(short, short.slice(0, 10).join('\n')).toEqual([]);
    // a team's name is plural as often as not ("The Vets"): never "{team}'s" (read 2026-10-17: "The Vets's going after...")
    const possessive = [];
    for (const mod of Object.values(files)) for (const list of Object.values(mod)) for (const e0 of list) for (const t of (byId[e0.id] || e0).turns)
      for (const line of [t.say || t.conf || '', ...Object.values(t.v || {}).flat()]) if (/\{(team|oppteam|from|to)\}'s\b/.test(line)) possessive.push(`${e0.id}: ${line}`);
    expect(possessive, possessive.join('\n')).toEqual([]);
    expect(extra, extra.slice(0, 10).join('\n')).toEqual([]);
  });
});
