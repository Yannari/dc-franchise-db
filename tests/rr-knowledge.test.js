// The Ridonculous Race: what each team knows and believes (engine plan, Task 10).
import { describe, it, expect } from 'vitest';
import { see, perceivedRank, believe, beliefOf } from '../js/rr/knowledge.js';
import { raceState } from './helpers/rr-cast.js';

describe('rr knowledge', () => {
  it('see() records both sides, each from its own point of view', () => {
    const st = raceState(4, 1); st.leg = 3;
    const [a, b] = st.order;
    see(st, a, b, 3, 120, 'lagoon', true);
    expect(st.seen[a][b]).toEqual({ leg: 3, t: 120, where: 'lagoon', ahead: true });
    expect(st.seen[b][a]).toEqual({ leg: 3, t: 120, where: 'lagoon', ahead: false });
  });

  it('a team that has seen everyone behind it believes it is first; one that has seen nobody sits at 0.5', () => {
    const st = raceState(4, 1); st.leg = 2;
    const [a, b, c, d] = st.order;
    for (const o of [b, c, d]) see(st, a, o, 2, 50, 'x', true);
    expect(perceivedRank(st, a)).toBe(0);
    const fresh = raceState(4, 2); fresh.leg = 2;
    expect(perceivedRank(fresh, fresh.order[0])).toBe(0.5);
    // last leg's sightings don't count this leg
    st.leg = 3;
    expect(perceivedRank(st, a)).toBe(0.5);
  });

  it('a belief belongs to who heard it, and a lie is kept as untrue', () => {
    const st = raceState(4, 1);
    const t = st.teams[st.order[0]];
    believe(st, [t.a], { about: 'flight', claim: 'next', value: '9:40', truth: false, leg: 1, source: 'lie' });
    expect(beliefOf(st, t.a, 'flight', 'next').value).toBe('9:40');
    expect(beliefOf(st, t.a, 'flight', 'next').truth).toBe(false);
    expect(beliefOf(st, t.b, 'flight', 'next')).toBeNull();
  });
});
