import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { POOLS, pickScript, renderScript, knowsAbout, scriptText } from '../js/pm/script.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

function season(seed) {
  const cast = makeIslanders(22, seed);
  setPlayers(cast);
  const names = cast.map(p => p.name);
  return playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });
}
const outcome = ({ rows }) => rows.map(r => [r.pm.couples.map(c => [...c].sort().join('+')).sort().join(' '),
  r.exits.map(e => `${e.name}:${e.verb}`).join(' ')].join(' | '));

describe('an event becomes a scene', () => {
  it('the same seed writes the same words', () => {
    const one = season(3).rows[4].pm.events.map(e => scriptText(e.script));
    const two = season(3).rows[4].pm.events.map(e => scriptText(e.script));
    expect(one).toEqual(two);
  });

  it('every scene is rendered: no placeholder survives, the speaker is a name', () => {
    const { rows } = season(4);
    for (const e of rows.flatMap(r => r.pm.events)) {
      const all = [e.script, e.hut?.script].filter(Boolean);
      for (const s of all) {
        expect(scriptText(s), `${e.kind} ${s.id}`).not.toMatch(/\{[abc]/);
        for (const l of s.lines) expect(l.who, s.id).toBeTruthy();
      }
    }
  });

  it('the words never change a result: a different pool plays the same season', () => {
    const before = outcome(season(5));
    const saved = POOLS.chat;
    POOLS.chat = [...saved, ...Array.from({ length: 9 }, (_, i) => ({ id: `chat.t${i}`, stage: `{a} and {b}, take ${i}.` }))];
    try { expect(outcome(season(5))).toEqual(before); } finally { POOLS.chat = saved; }
  });

  it('a filter that matches nothing falls back to an entry with no conditions', () => {
    const pool = [{ id: 'x.1', when: { mood: 'jealous' }, stage: 'jealous' }, { id: 'x.2', stage: 'plain' }];
    const state = { ep: 1, seed: 1, secrets: [] };
    expect(pickScript(state, pool, ['A', 'B'], { mood: 'secure' }).id).toBe('x.2');
  });

  it('fills names and pronouns, never guesses a gender', () => {
    setPlayers([{ name: 'Ana', gender: 'f' }, { name: 'Ben', gender: 'm' }, { name: 'Cal' }]);
    const s = renderScript({ id: 't', stage: '{a} looks at {b.obj}.', turns: [['c', "{a.PosAdj} call, not {c.pos}."]] },
      ['Ana', 'Ben', 'Cal']);
    expect(s.stage).toBe('Ana looks at him.');
    expect(s.lines[0]).toEqual({ who: 'Cal', text: 'Her call, not theirs.' });
  });
});

describe('a speaker only says what they could know', () => {
  const state = { secrets: [{ who: 'X', partner: 'P', with: 'Y', witnesses: ['W'], known: false }] };
  it('a witness knows, a stranger does not', () => {
    expect(knowsAbout(state, 'W', 'X')).toBe(true);
    expect(knowsAbout(state, 'S', 'X')).toBe(false);
    expect(knowsAbout(state, 'P', 'X')).toBe(false);
  });
  it('the partner knows once told, and everybody once it was shown to the villa', () => {
    state.secrets[0].known = true;
    expect(knowsAbout(state, 'P', 'X')).toBe(true);
    expect(knowsAbout(state, 'S', 'X')).toBe(false);
    state.secrets[0].public = true;
    expect(knowsAbout(state, 'S', 'X')).toBe(true);
  });
  it('every gossip scene in a season was spoken by somebody who knew', () => {
    for (let s = 1; s <= 4; s++) for (const r of season(s).rows) {
      for (const e of r.pm.events.filter(x => x.kind === 'gossip')) {
        // Every gossip entry needs `knows`; the unwritten placeholder is what
        // renders when the speaker did not know, so it must never appear.
        expect(e.script.id, e.players.join(',')).not.toBe('gossip.0');
      }
    }
  });
});

describe('a line that mentions an earlier moment only runs when it happened', () => {
  // Re-checked from the rows, not trusted from the picker (user, on "Thanks
  // for yesterday": "fix what? whats the context and is this even true?").
  const LOW = ['heartbroken', 'stressed', 'lonely', 'jealous'];
  const COMFORT = ['friendship', 'advice', 'solidarity', 'chat', 'deep-chat'];
  const both = (e, a, b) => e.players.includes(a) && e.players.includes(b);
  it('"thanks for yesterday" follows a real yesterday, and a repeat row follows a real row', () => {
    let thanks = 0, repeats = 0;
    for (let s = 1; s <= 8; s++) {
      const { rows } = season(s);
      const all = rows.flatMap(r => r.pm.events);
      for (const e of all) {
        const [a, b] = e.players;
        if (e.script.id.startsWith('friendship.36')) {
          thanks++;
          expect(all.some(x => x.ep === e.ep - 1 && COMFORT.includes(x.kind) && both(x, a, b) && LOW.includes(x.moods?.[a])),
            `${a} thanks ${b} in ep ${e.ep}`).toBe(true);
        }
        if (e.script.id.startsWith('argument.30')) {
          repeats++;
          expect(all.some(x => x.ep < e.ep && x.kind === 'argument' && both(x, a, b)), `${a} and ${b} ep ${e.ep}`).toBe(true);
        }
      }
    }
    expect(thanks + repeats).toBeGreaterThan(0);   // the guard must see the lines it guards
  });
});
