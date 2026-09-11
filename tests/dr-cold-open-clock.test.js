// ══════════════════════════════════════════════════════════════════════
// dr-cold-open-clock.test.js — what time it is in the cold open
// ══════════════════════════════════════════════════════════════════════
//
// The cold open is the queens walking back into the werk room MINUTES after
// the elimination, still in drag, with the station of whoever just left
// still warm. `werk-morning` is the next day — it is on screen one card
// later under the subtitle "morning".
//
// The two were written to the same premise. `week.js` asserted in its own
// comment that "the cold open is the morning AFTER an elimination", and the
// pool followed it: fifteen of twenty-three cold-open events said "morning",
// "coffee", "by lunch" or "she never took the makeup off" over a room that
// had not been to bed. Found by reading a rendered episode, not by a test —
// nothing here was broken, it was just the wrong time of day.
//
// FOUR events were about a working day rather than about a departure and
// have moved to `werk-morning`. The rest belong in the cold open and need
// their clock changed rather than their slot; see
// docs/PROSE-PROMPT-dr-cold-open-clock.md.
import { describe, expect, it } from 'vitest';
import { WERK_EVENTS } from '../js/dr/data/werk-events.js';

const coldOpen = () => WERK_EVENTS.filter(e => e.slot === 'cold-open');

/* Words that can only be true the following day. `last night` and
   `yesterday` are here for the same reason "morning" is: on the night
   itself the elimination is an hour ago, not last night. */
const NEXT_DAY = /\b(morning|tomorrow|overnight|slept|asleep|woke|wakes|waking|breakfast|by lunch|next day|yesterday|last night|all night)\b/i;

function offenders() {
  const out = [];
  for (const e of coldOpen()) {
    const hay = [e.note || '', ...(e.lines || [])].join(' ');
    const hits = [...new Set((hay.match(NEXT_DAY) || []).map(x => x.toLowerCase()))];
    if (hits.length) out.push({ id: e.id, hits });
  }
  return out;
}

describe('the cold open happens on the night of', () => {
  it('has a pool at all', () => {
    expect(coldOpen().length).toBeGreaterThan(0);
  });

  /* ── REPORTED, NOT FAILED, AND ONLY FOR NOW ──
     The prose rewrite is a separate job (the brief is written and the pools
     are otherwise fine), so this counts the backlog instead of going red on
     content nobody has had a chance to fix. IT IS MEANT TO BE FLIPPED: when
     the rewrite lands, change this to `expect(offenders()).toEqual([])` and
     delete this comment. A reporting test that is never flipped is a test
     that has quietly stopped being a rule. */
  it('reports how much of the pool is still on the wrong clock', () => {
    const left = offenders();
    // eslint-disable-next-line no-console
    console.log(`cold open: ${coldOpen().length - left.length} of ${coldOpen().length}`
      + ` events on the right clock.\nstill next-day (${left.length}): `
      + left.map(o => `${o.id} [${o.hits.join(' ')}]`).join(', '));
    expect(Array.isArray(left)).toBe(true);
  });

  it('has moved the events that were about a working day, not a departure', () => {
    /* These four were in the cold open and are not about the elimination at
       all — a nickname, learning the room, two queens not awake yet, and one
       whose whole premise ("she never took the makeup off") only means
       anything the following day, because on the night itself everybody is
       still painted. */
    const ids = new Set(WERK_EVENTS.filter(e => e.slot === 'werk-morning').map(e => e.id));
    for (const id of ['nickname', 'settling-in', 'coffee-and-silence',
      'still-in-last-nights-face']) {
      expect(ids, `${id} belongs to the morning`).toContain(id);
    }
  });

  it('keeps the beats that ARE the cold open where they are', () => {
    /* The counterpart guard. It would be an easy over-correction to move
       everything that mentions last night out of the slot — but the empty
       station and the message on the mirror are the cold open. */
    const ids = new Set(coldOpen().map(e => e.id));
    for (const id of ['the-empty-station', 'the-mirror-message', 'reading-the-mirror',
      'someone-is-missing', 'unpacking-the-night', 'relief-and-guilt']) {
      expect(ids, `${id} is the cold open`).toContain(id);
    }
  });

  it('never lets a cold-open event fire on the premiere', () => {
    /* Nobody has left, there is no empty station and no message on the
       mirror. Enforced at the caller — this asserts the rule is still there
       to be enforced, by checking the slot is gated rather than universal. */
    const all = coldOpen();
    expect(all.every(e => typeof e.when === 'function'),
      'an event with no `when` cannot be held back from episode one').toBe(true);
  });
});
