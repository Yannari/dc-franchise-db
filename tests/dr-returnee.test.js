// ══════════════════════════════════════════════════════════════════════
// dr-returnee.test.js — a queen the show sent home comes back
// ══════════════════════════════════════════════════════════════════════
//
// The Returning Queen twist. Unlike the smackdown, which gives the
// eliminated cast one night and changes no placement, this one puts
// somebody back INTO the competition — so the assertions are about the
// chart rather than about the prose: she has to be in the room, on the
// record, and beatable, or she is a story about a queen the season does not
// actually have.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

function cast(n = 12, seed = 3) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
    archetype: 'hero', age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

const play = (seed, config = {}) =>
  playDragSeason({ cast: cast(12, 3), seed, config: { drDoubleShantay: false, ...config } });

describe('the returning queen', () => {
  it('puts a queen who was eliminated back in the room', () => {
    const out = play(7, { drSchedule: [{ episode: 6, returnee: true }] });
    const row = out.rows.find(r => r.dr?.returned);
    expect(row, 'nobody came back').toBeTruthy();
    const who = row.dr.returned.name;

    /* SHE WAS GONE BEFORE IT. The whole twist is that the show reverses an
       elimination — if she was still competing this is a no-op with a
       paragraph on it. */
    const before = out.rows.filter(r => r.num < row.num);
    const sentHome = before.flatMap(r => (r.exits || []).map(x => x.name));
    expect(sentHome, `${who} was never eliminated`).toContain(who);

    // AND SHE IS IN THE ROOM AFTERWARDS, not merely mentioned in it.
    expect(row.dr.living, `${who} is not in the room she walked into`).toContain(who);
  });

  it('honours the queen the author picked', () => {
    /* Booked late enough that the pick is certainly out by then. The engine
       falls back to a random eliminated queen when the pick is still
       competing, and `honoured` records which of the two happened — so this
       asserts the flag as well as the name, or a fallback that happened to
       land on the right queen would pass. */
    const first = play(7, { drSchedule: [{ episode: 6, returnee: true }] });
    const early = first.rows[0]?.exits?.[0]?.name;
    expect(early, 'nobody went home in the premiere').toBeTruthy();

    const out = play(7, {
      drSchedule: [{ episode: 6, returnee: true, returneeName: early }],
    });
    const row = out.rows.find(r => r.dr?.returned);
    expect(row.dr.returned.name).toBe(early);
    expect(row.dr.returned.honoured, 'the pick was not honoured').toBe(true);
    expect(row.dr.returned.asked).toBe(early);
  });

  it('falls back rather than doing nothing when the pick is still in', () => {
    /* A season is booked before it is played, so the queen chosen for
       episode six may still be competing when episode six arrives. Doing
       nothing would be a twist that silently did not happen — the loudest
       version of this project's quietest bug. */
    const out = play(7, {
      drSchedule: [{ episode: 2, returnee: true, returneeName: 'Q1' }],
    });
    const row = out.rows.find(r => r.dr?.returned);
    expect(row, 'the twist did nothing at all').toBeTruthy();
    if (row.dr.returned.name !== 'Q1') {
      expect(row.dr.returned.honoured, 'a fallback claimed to be honoured').toBe(false);
      expect(row.dr.returned.asked).toBe('Q1');
    }
  });

  it('runs one episode longer, because the room got bigger', () => {
    const base = play(7);
    const withReturn = play(7, { drSchedule: [{ episode: 6, returnee: true }] });
    expect(withReturn.rows.length, 'a returning queen did not add an episode')
      .toBe(base.rows.length + 1);
    // And the season still lands on a finale-sized room.
    expect(withReturn.state.living.length).toBe(base.state.living.length);
  });

  it('lets her be eliminated again, and place on the chart', () => {
    const out = play(7, { drSchedule: [{ episode: 5, returnee: true }] });
    const who = out.rows.find(r => r.dr?.returned)?.dr.returned.name;
    /* SHE IS A COMPETITOR, NOT A GUEST. She either reaches the finale or
       goes home a second time; what she must not be is present in the room
       and absent from the result. */
    const finalists = out.state.living || [];
    const wentAgain = out.rows.some(r => (r.exits || []).some(x => x.name === who)
      && r.num > out.rows.find(x => x.dr?.returned).num);
    expect(finalists.includes(who) || wentAgain,
      `${who} came back and then simply stopped existing`).toBe(true);
  });
});
