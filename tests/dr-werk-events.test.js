// ══════════════════════════════════════════════════════════════════════
// dr-werk-events.test.js — the contract the pool has to keep
// ══════════════════════════════════════════════════════════════════════
//
// This file exists to be run by whoever writes the lines. Every rule in the
// header of js/dr/data/werk-events.js is checked here, so filling the pool is
// a job with a green light at the end of it rather than a guess.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { WERK_EVENTS, WERK_IDS, SLOTS, unwrittenWerkEvents } from '../js/dr/data/werk-events.js';
import { showWords } from '../js/shows.js';

/**
 * Are two lines the same beat reworded?
 *
 * Measured on the WHOLE line rather than its opening, and that distinction is
 * the whole point. The first version compared the first eighteen characters
 * and demanded all four differ, which is right for an ordinary scene and wrong
 * for a ritual: three of the winner's lines open with "Condragulations"
 * because that is the word the show says every single week, and the guard
 * called correct prose a failure.
 *
 * Shared vocabulary across a whole line is the real signal for a reworded
 * sentence, and a shared catchphrase at the front is not.
 */
function tooSimilar(x, y) {
  const words = t => new Set(String(t).toLowerCase().match(/[a-z']+/g) || []);
  const a = words(x);
  const b = words(y);
  if (!a.size || !b.size) return false;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size) > 0.6;
}

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag },
  ...over,
});

describe('the schema', () => {
  it('every event is complete and uniquely named', () => {
    expect(WERK_EVENTS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(WERK_IDS).size).toBe(WERK_IDS.length);
    for (const e of WERK_EVENTS) {
      expect(e.id, 'an event with no id').toBeTruthy();
      expect(SLOTS, `${e.id} sits in no known slot`).toContain(e.slot);
      // `group` is three or four of them: {a} and {b} are the two it is about
      // and {c}/{d} are the rest of the room, who are often just there.
      expect(['solo', 'pair', 'group'], `${e.id} has cast "${e.cast}"`).toContain(e.cast);
      expect(e.note, `${e.id} has no note for the writer`).toBeTruthy();
      expect(typeof e.when, `${e.id} has no eligibility test`).toBe('function');
      expect(Array.isArray(e.lines), `${e.id} lines is not an array`).toBe(true);
      expect(Array.isArray(e.arcs), `${e.id} arcs is not an array`).toBe(true);
    }
  });

  it('NOTHING IS COSMETIC: every event changes something', () => {
    // The project's oldest broken rule. An event with no consequence is a
    // scene the viewer is shown that the season does not remember.
    for (const e of WERK_EVENTS) {
      const changes = (e.effects?.bond ? 1 : 0)
        + Object.keys(e.effects?.pop || {}).length
        + (e.effects?.state ? 1 : 0);
      expect(changes, `${e.id} has no consequence`).toBeGreaterThan(0);
    }
  });

  it('a solo event never moves a bond, because there is nobody to move it with', () => {
    for (const e of WERK_EVENTS.filter(x => x.cast === 'solo')) {
      expect(e.effects.bond, `${e.id} is solo but moves a bond`).toBeFalsy();
      expect(e.effects.pop?.b, `${e.id} is solo but pays {b}`).toBeUndefined();
    }
  });

  it('every slot has enough events to fill a season without repeating itself', () => {
    // ~45 werk room draws a season across four slots. A slot with a handful of
    // events shows the same scene every week, which is the repetition ceiling
    // the Traitors pool hit — and it hit it with plenty written, because the
    // filters had shrunk what was eligible.
    for (const slot of SLOTS) {
      const n = WERK_EVENTS.filter(e => e.slot === slot).length;
      expect(n, `slot "${slot}" has only ${n} events`).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('the lines', () => {
  const written = WERK_EVENTS.filter(e => e.lines.length);

  it('there are exemplars to write against', () => {
    expect(written.length, 'nothing is written at all').toBeGreaterThanOrEqual(4);
  });

  it('a written event has at least four genuinely different variants', () => {
    for (const e of written) {
      expect(e.lines.length, `${e.id} has ${e.lines.length} variants`).toBeGreaterThanOrEqual(4);
      expect(new Set(e.lines).size, `${e.id} repeats a line verbatim`).toBe(e.lines.length);
      // Four rewordings of one sentence is not four variants.
      for (let i = 0; i < e.lines.length; i++) {
        for (let k = i + 1; k < e.lines.length; k++) {
          expect(tooSimilar(e.lines[i], e.lines[k]),
            `${e.id}: variants ${i + 1} and ${k + 1} are the same beat reworded`).toBe(false);
        }
      }
    }
  });

  it('uses {a} and {b} correctly, and never a name', () => {
    for (const e of written) {
      for (const l of e.lines) {
        expect(l, `${e.id} never names its subject`).toMatch(/\{a\}/);
        if (e.cast === 'solo') {
          // The Traitors failure exactly: a {b} in a solo pool makes the line
          // ineligible forever and the pool silently shrinks.
          expect(l, `${e.id} is solo but the line uses {b}`).not.toMatch(/\{b\}/);
        }
        /* {c} AND {d} ARE THE REST OF THE GROUP and exist only in a group
           scene — a solo or pair pool naming them renders an empty string
           mid-sentence, which is the same silent-shrink failure as {b} in a
           solo pool. */
        if (e.cast !== 'group') {
          expect(l, `${e.id} is ${e.cast} but names a third queen`).not.toMatch(/\{[cd]\}/);
        }
        const bad = l.match(/\{(?!a\}|b\}|c\}|d\})[^}]*\}/);
        expect(bad, `${e.id} uses an unknown placeholder ${bad?.[0]}`).toBeNull();
      }
    }
  });

  it('speaks this show and not another one', () => {
    // The recurring bug class the whole registry exists for: one show's
    // vocabulary printed over another's.
    const FOREIGN = /\b(houseguest|houseguests|castaway|castaways|tribe|tribal council|eviction|evicted|nominee|nominated|veto|head of household|traitor|faithful|banish\w*|murder\w*|the circle)\b/i;
    for (const e of written) {
      for (const l of e.lines) {
        const hit = l.match(FOREIGN);
        expect(hit, `${e.id} says "${hit?.[0]}", which belongs to another show`).toBeNull();
      }
    }
  });

  it('uses the drag vocabulary where it uses any', () => {
    const w = showWords('drag-race');
    expect(w.player).toBe('queen');
    // If a line names the contest at all it has to call it the right thing.
    for (const e of written) {
      for (const l of e.lines) {
        expect(l, `${e.id} calls it a competition`).not.toMatch(/\bcompetition\b/i);
      }
    }
  });

  it('never quotes a stat by name', () => {
    const NUMBERS = /\b(design|runway|lipsync|acting|comedy|singing|dance) (is|of|at) \d/i;
    for (const e of written) {
      for (const l of e.lines) {
        expect(l.match(NUMBERS), `${e.id} quotes a stat`).toBeNull();
      }
    }
  });

  it('writes prose, not a caption', () => {
    for (const e of written) {
      for (const l of e.lines) {
        expect(l.length, `${e.id} has a one-liner where a scene should be`).toBeGreaterThan(80);
      }
    }
  });
});

describe('eligibility', () => {
  const facts = over => ({
    a: mk('Ada'), b: mk('Bee'), bond: 0, canScheme: false, sameTeam: false,
    lastCall: 'SAFE', winsA: 0, winsB: 0, safesA: 0, phase: 0.5, episode: 3,
    roomSize: 8, someoneLeft: true, lostAFriend: false, lostAnEnemy: false,
    ...over,
  });

  it('no eligibility test throws, on any shape of week', () => {
    const shapes = [
      facts({}),
      facts({ bond: -9, canScheme: true, lastCall: 'BTM', phase: 0.1, roomSize: 13 }),
      facts({ bond: 9, winsA: 4, winsB: 3, safesA: 6, phase: 0.95, roomSize: 4 }),
      facts({ a: mk('Ada', { comedy: 10, design: 10, runway: 10 }), lostAFriend: true }),
      facts({ a: mk('Ada', { comedy: 1, design: 1, runway: 1 }), lostAnEnemy: true }),
    ];
    for (const e of WERK_EVENTS) {
      for (const f of shapes) {
        expect(() => e.when(f), `${e.id} threw on a legal week`).not.toThrow();
      }
    }
  });

  it('an ordinary night has plenty eligible in every slot', () => {
    // THE NUMBER THAT ACTUALLY DECIDES REPETITION. A pool of forty-five that
    // filters to three on a normal night reads worse than a pool of twenty
    // that all apply, which is what the Traitors post-mortem found.
    const ordinary = facts({});
    for (const slot of SLOTS) {
      const n = WERK_EVENTS.filter(e => e.slot === slot && e.when(ordinary)).length;
      expect(n, `slot "${slot}" offers only ${n} events on an ordinary night`)
        .toBeGreaterThanOrEqual(4);
    }
  });
});

describe('what is left to write', () => {
  it('reports the gap rather than hiding it', () => {
    const left = unwrittenWerkEvents();
    // eslint-disable-next-line no-console
    console.log(`werk room: ${WERK_EVENTS.length - left.length} of ${WERK_EVENTS.length} events written.`
      + `\nstill to write (${left.length}): ${left.join(', ')}`);
    expect(Array.isArray(left)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// The track record is a social fact, not just a chart
// ══════════════════════════════════════════════════════════════════════
describe('what the record does to the room', () => {
  const RECORD_FACTS = /lastCall|winsA|winsB|safesA|bottoms|neverTop|neverBottom|sinceTop|lipSynced/;
  const recordDriven = () => WERK_EVENTS.filter(e => RECORD_FACTS.test(String(e.when || '')));

  it('has a real family of them, on all three states', () => {
    const ids = recordDriven().map(e => e.id).join(' ');
    expect(recordDriven().length, 'the chart is a scoreboard nobody reacts to')
      .toBeGreaterThanOrEqual(12);
    // Frontrunner, coasting, and the bottom are the three states a season
    // puts a queen in, and each has to cost her something socially.
    expect(ids).toMatch(/frontrunner/);
    expect(ids).toMatch(/coasting|safe/);
    expect(ids).toMatch(/bottom/);
  });

  it('every one of them costs somebody something', () => {
    for (const e of recordDriven()) {
      const f = e.effects || {};
      const changes = (f.bond ? 1 : 0) + Object.keys(f.pop || {}).length + (f.state ? 1 : 0);
      expect(changes, `${e.id} is cosmetic`).toBeGreaterThan(0);
    }
  });

  /* BTM AND BTM2 ARE DIFFERENT NIGHTS. `bottom-hangover`'s note says she
     survived the lip sync while its gate read `lastCall === 'BTM'` — which,
     after the call was split, means the queens who were saved BEFORE the song
     and never sang at all. The prose and the trigger described different
     events for two whole plans. */
  it('reads BTM2 for a lip sync survived, not BTM', () => {
    const hangover = WERK_EVENTS.find(e => e.id === 'bottom-hangover');
    expect(String(hangover.when)).toContain('BTM2');
    // And any event whose prose talks about lip syncing must not gate on the
    // call that means she did not.
    for (const e of WERK_EVENTS) {
      const prose = `${e.note || ''} ${(e.lines || []).join(' ')}`.toLowerCase();
      if (!/survived the lip sync|won her lip sync/.test(prose)) continue;
      expect(String(e.when), `${e.id} says lip sync but gates on BTM`)
        .not.toMatch(/===\s*'BTM'/);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// The premiere has no morning after
// ══════════════════════════════════════════════════════════════════════
describe('the cold open', () => {
  function play(seed, config = {}) {
    const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
      'loyalty', 'boldness', 'intuition', 'temperament'];
    const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
    const cast = Array.from({ length: 12 }, (_, i) => ({
      name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
      archetype: 'hero', age: 22 + i,
      stats: Object.fromEntries(STATS.map(k => [k, r()])),
      drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
    }));
    return playDragSeason({ cast, seed, config });
  }

  /* The cold open is the morning AFTER an elimination — the empty station,
     the lipstick message, the room going back over last night. On episode one
     nobody has left, nobody has slept, and the queens are still coming
     through the door. The entrances are the opening. */
  it('does not exist on the premiere, of either kind', () => {
    for (const config of [{}, { drPremiere: 'split' }, { drPremiere: 'porkchop' }]) {
      const { rows } = play(4, config);
      const cold = (rows[0].dr.scenes || []).filter(s => s.step === 'cold-open');
      expect(cold.length, `${JSON.stringify(config)} opened episode 1 on a cold open`).toBe(0);
      // And every later episode still has one.
      const later = (rows[1]?.dr?.scenes || []).filter(s => s.step === 'cold-open');
      expect(later.length, 'the cold open vanished from episode 2').toBeGreaterThan(0);
    }
  });

  /* AND NOBODY MOURNS A QUEEN WHO DID NOT LEAVE. A double shantay and a
     split-premiere half both end with nobody going home, and the next
     morning's pool would still hand out the empty station and "she survived
     and someone else did not". */
  it('never claims an exit after a night nobody left', () => {
    const CLAIMS_EXIT = new Set(['the-empty-station', 'the-mirror-message',
      'one-less-friend', 'relief-and-guilt', 'counting-the-chairs']);
    /* THE NO-ELIMINATION WEEK IS BOOKED, NOT WAITED FOR. This used to play
       forty seasons and hope one of them produced a double shantay, which
       made the test's own coverage a property of the RNG stream: a change
       to how many werk room scenes are drawn shifts every downstream roll,
       and the day that happened all forty seasons came back with nobody
       spared and the guard reported "nothing was tested".
       drSchedule pins one, so the case is reached in every season. */
    let checked = 0;
    for (let s = 0; s < 40; s++) {
      const { rows } = play(s, { drSchedule: [{ episode: 3, noElimination: true }] });
      for (let i = 1; i < rows.length; i++) {
        if ((rows[i - 1].exits || []).length) continue;
        checked++;
        for (const sc of rows[i].dr.scenes || []) {
          const id = String(sc.kind || '').replace(/^werk:/, '');
          expect(CLAIMS_EXIT.has(id),
            `episode ${rows[i].num} ran "${id}" after a night nobody left`).toBe(false);
        }
      }
    }
    // The case has to be REACHED or this passes by never running.
    expect(checked, 'no no-elimination week occurred in 40 seasons').toBeGreaterThan(0);
  });
});
