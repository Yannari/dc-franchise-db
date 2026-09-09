// ══════════════════════════════════════════════════════════════════════
// dr-maxi-prose.test.js — the contract for the two maxi prose pools
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { MAXI_EVENTS, MAXI_EVENT_IDS, unwrittenMaxiEvents } from '../js/dr/data/maxi-events.js';
import {
  MAXI_PERFORMANCE, PERFORMANCE_FAMILIES, performanceFor, unwrittenPerformanceTiers,
} from '../js/dr/data/maxi-performance.js';
import { CHAL_MODULES } from '../js/dr/maxi.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

function tooSimilar(x, y) {
  const words = s => new Set(String(s).toLowerCase().match(/[a-z']+/g) || []);
  const a = words(x);
  const b = words(y);
  if (!a.size || !b.size) return false;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size) > 0.6;
}

const TIERS = ['extraordinary', 'strong', 'competent', 'struggling', 'collapse'];

describe('the event pool', () => {
  it('is complete and uniquely named', () => {
    expect(new Set(MAXI_EVENT_IDS).size).toBe(MAXI_EVENT_IDS.length);
    for (const e of MAXI_EVENTS) {
      expect(e.id, 'an event with no id').toBeTruthy();
      expect(e.from, `${e.id} does not say which challenge it comes from`).toBeTruthy();
      expect(['solo', 'pair'], `${e.id} has cast "${e.cast}"`).toContain(e.cast);
      expect(e.note, `${e.id} has no note for the writer`).toBeTruthy();
      expect(Array.isArray(e.lines), `${e.id} lines is not an array`).toBe(true);
    }
  });

  it('COVERS EVERY EVENT THE ENGINE ACTUALLY FIRES', () => {
    // The point of the file. An event the modules emit with no prose here
    // falls back to silence, which is how a challenge ends up reading generic
    // even after all this work.
    const FIRED = ['assassin', 'bad-verse', 'bombed', 'booth', 'carried', 'contest',
      'did-her-dirty', 'did-her-proud', 'double-act', 'dressed-herself-better', 'dump',
      'dying', 'glue-gun', 'help', 'invisible', 'live-vocal', 'picked-on',
      'pulled-the-punch', 'read-landed', 'read-missed', 'reunion', 'roasted-the-panel',
      'sabotage', 'showstopper', 'shunned', 'spotlight-hog', 'stole-a-bit',
      'stunt-failed', 'stunt-landed', 'verse-of-the-week', 'walkthrough',
      'wardrobe-malfunction', 'wrong-talent',
      // added when the acting family and the Snatch Game host were built
      'host-played-along', 'left-to-hang', 'dropped-a-line', 'stepped-on-her',
      'one-note', 'ignored-the-note', 'took-a-bad-note', 'found-the-angle',
      'tagline-died', 'froze', 'ran-with-it',
      // added when the last four generic types got their own mechanics
      'used-the-set', 'blank-frame', 'blew-the-formation', 'nailed-the-solo',
      'lost-in-rehearsal', 'cracked-a-note', 'forgot-the-lyric', 'sang-it-out',
      'repeated-herself',
      // added when the Rumix and the music video stopped being the girl group
      'booth-rescue', 'booth-lost-it', 'lifted-a-bar', 'no-verse', 'quotable-bar',
      'cast-forward', 'director-loved-her', 'director-wrote-her-off',
      'lost-in-the-background',
      // and the social layer both of them shipped without
      'workshopped', 'read-her-verse', 'upstaged-her', 'covered-for-her'];
    const missing = FIRED.filter(id => !MAXI_EVENT_IDS.includes(id));
    expect(missing, `these fire in the engine and have no prose: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('the performance pool', () => {
  it('has a family for every challenge module, plus a fallback', () => {
    expect(PERFORMANCE_FAMILIES).toContain('generic');
    for (const f of MAXI_PERFORMANCE) {
      expect(f.label, `${f.family} has no label`).toBeTruthy();
      expect(Array.isArray(f.serves), `${f.family} does not say what it serves`).toBe(true);
      expect(f.tiers.map(x => x.id), f.family).toEqual(TIERS);
      for (const x of f.tiers) {
        expect(x.note, `${f.family}/${x.id} has no note`).toBeTruthy();
        expect(Array.isArray(x.lines)).toBe(true);
      }
    }
  });

  it('every module that exists has somewhere to write for', () => {
    // CHAL_MODULES maps 15 ids onto 9 modules; each of those needs a voice, or
    // that challenge silently borrows another one's.
    const families = new Set(PERFORMANCE_FAMILIES);
    for (const id of Object.keys(CHAL_MODULES)) {
      const f = MAXI_PERFORMANCE.find(x => x.serves.includes(id));
      expect(f, `challenge "${id}" belongs to no performance family`).toBeTruthy();
    }
    expect(families.size).toBeGreaterThanOrEqual(9);
  });

  it('falls back rather than throwing on an unknown family', () => {
    expect(performanceFor('nonsense').family).toBe('generic');
    expect(performanceFor('snatch-game').family).toBe('snatch-game');
  });
});

describe('the lines', () => {
  const written = [
    ...MAXI_EVENTS.filter(e => e.lines.length).map(e => ({ id: e.id, cast: e.cast, lines: e.lines })),
    ...MAXI_PERFORMANCE.flatMap(f => f.tiers.filter(x => x.lines.length)
      .map(x => ({ id: `${f.family}/${x.id}`, cast: 'solo', lines: x.lines }))),
  ];

  it('there are exemplars to write against', () => {
    expect(written.length).toBeGreaterThanOrEqual(3);
  });

  it('four genuinely different variants each', () => {
    for (const w of written) {
      expect(w.lines.length, `${w.id} has ${w.lines.length}`).toBeGreaterThanOrEqual(4);
      expect(new Set(w.lines).size, `${w.id} repeats a line`).toBe(w.lines.length);
      for (let i = 0; i < w.lines.length; i++) {
        for (let k = i + 1; k < w.lines.length; k++) {
          expect(tooSimilar(w.lines[i], w.lines[k]),
            `${w.id}: variants ${i + 1} and ${k + 1} are the same beat reworded`).toBe(false);
        }
      }
    }
  });

  it('uses the placeholders correctly', () => {
    for (const w of written) {
      for (const l of w.lines) {
        if (w.cast === 'solo') expect(l, `${w.id} is solo but uses {b}`).not.toMatch(/\{b\}/);
        const bad = l.match(/\{(?!a\}|b\})[^}]*\}/);
        expect(bad, `${w.id} uses unknown placeholder ${bad?.[0]}`).toBeNull();
      }
    }
  });

  it('speaks this show and no other', () => {
    for (const w of written) {
      for (const l of w.lines) {
        const bad = foreignWordsIn(l, 'drag-race');
        expect(bad, `${w.id} says "${bad[0]}"`).toEqual([]);
      }
    }
  });

  it('writes prose, not a caption', () => {
    for (const w of written) {
      for (const l of w.lines) {
        expect(l.length, `${w.id} has a one-liner`).toBeGreaterThan(80);
      }
    }
  });
});

describe('what is left to write', () => {
  it('reports the gap rather than hiding it', () => {
    const ev = unwrittenMaxiEvents();
    const perf = unwrittenPerformanceTiers();
    const evTotal = MAXI_EVENTS.length;
    const perfTotal = MAXI_PERFORMANCE.reduce((n, f) => n + f.tiers.length, 0);
    // eslint-disable-next-line no-console
    console.log(`maxi events: ${evTotal - ev.length} of ${evTotal} written.`
      + `\n  still to write (${ev.length}): ${ev.join(', ')}`
      + `\nmaxi performance: ${perfTotal - perf.length} of ${perfTotal} tiers written.`
      + `\n  still to write (${perf.length}): ${perf.join(', ')}`);
    expect(Array.isArray(ev)).toBe(true);
  });
});
