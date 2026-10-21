// A Botch or Watch moment knows which partner is doing it (the user, 2026-10-21, at the waterfall dive: "sami was the
// one jumping why is bowie the one who needs help"): the watcher was cast as {a}, and the place lines (and the engine:
// the watcher's nerves are B's) have {a} doing it and {b} watching. One rule now: {a} is in it, {b} watches.
import { describe, it, expect } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { rolesOf } from '../js/rr/script/roles.js';
import { POOLS } from '../js/rr/script/lines/index.js';

describe('rr: watching the Botch', () => {
  it('casts the partner doing the Botch as a and the one watching as b', () => {
    let seen = 0;
    for (let seed = 2; seed <= 20 && seen < 4; seed++) {
      const { cast, teams } = raceCast(10, seed);
      setPlayers(cast);
      const st = playRaceSeason({ teams, seed }).state;
      for (const sc of st.scenes.filter(s => s.kind === 'watching-botch')) {
        const r = rolesOf(sc, st)?.roles;
        if (!r) continue;
        seen++;
        expect(r.a, `seed ${seed}`).toBe(sc.data.snap.botcher);
        expect(r.b, `seed ${seed}`).not.toBe(sc.data.snap.botcher);
      }
    }
    expect(seen).toBeGreaterThan(0);
  }, 240000);

  it('never has {a} watching in a watching line, or {a} cheering {b} on', () => {
    const bad = [];
    for (const [key, es] of Object.entries(POOLS)) {
      if (!key.startsWith('watching-botch')) continue;
      for (const e of es) for (const t of e.turns || []) {
        const s = t.beat || t.say || t.conf || '';
        if (t.beat && /\{a\} (watches|stands|sits|leans|stares|kneels)\b/.test(s)) bad.push(`${e.id}: ${s}`);
        if (t.by === 'a' && /(Come on|Psst\.|Look at) \{b[.}]/.test(s)) bad.push(`${e.id}: ${s}`);
        if (t.beat && /walks over to \{a\}|looks at \{a\}/.test(s)) bad.push(`${e.id}: ${s}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
