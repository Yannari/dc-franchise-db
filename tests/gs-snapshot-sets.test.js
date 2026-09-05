// ══════════════════════════════════════════════════════════════════════
// gs-snapshot-sets.test.js — a snapshot of the game state keeps its Sets
// ══════════════════════════════════════════════════════════════════════
//
// Reported from a played castle: re-running an episode threw
//
//     Uncaught TypeError: ({}) is not iterable
//         repairTrSets  js/tr/state.js
//         repairGsSets  js/core.js
//         _replayTraitorsEpisode  js/run-ui.js
//
// `JSON.parse(JSON.stringify(gs))` looks like a deep clone and quietly is not:
// a Set stringifies to `{}`, not to an array. So every snapshot taken that way
// — every CHECKPOINT, and the rollback state a re-run keeps in hand — lost the
// contents of its Sets and handed back a plain object where a Set belonged.
//
// Two failures came out of that one line. The data loss is the quiet one:
// `shieldedThisRound` came back empty from a replayed episode and nothing said
// so. The crash is the loud one: rebuilding a Set out of `{}` throws, so the
// rollback after a failed re-run died — and reported a TypeError instead of
// the reason the re-run had failed, which is the thing the user needed.
import { describe, it, expect } from 'vitest';
import { gs, setGs, snapshotGs, repairGsSets, prepGsForSave } from '../js/core.js';
import { repairTrSets, prepTrForSave } from '../js/tr/state.js';

const withSets = () => ({
  episode: 3,
  injuredThisEp: new Set(['Amy']),
  shotInDarkUsed: new Set(['Bowie', 'Zoey']),
  tr: { shieldedThisRound: new Set(['Cody', 'Jasmine']) },
});

describe('repairTrSets survives a state that lost its Sets', () => {
  it('rebuilds from an array', () => {
    const g = { tr: { shieldedThisRound: ['Cody'] } };
    repairTrSets(g);
    expect(g.tr.shieldedThisRound instanceof Set).toBe(true);
    expect([...g.tr.shieldedThisRound]).toEqual(['Cody']);
  });

  it('does not throw on the {} a stringified Set leaves behind', () => {
    // This is the reported crash, in one line.
    const g = { tr: { shieldedThisRound: JSON.parse(JSON.stringify(new Set(['Cody']))) } };
    expect(g.tr.shieldedThisRound).toEqual({});
    expect(() => repairTrSets(g)).not.toThrow();
    expect(g.tr.shieldedThisRound instanceof Set).toBe(true);
    expect(g.tr.shieldedThisRound.size, 'invented members out of an empty object').toBe(0);
  });

  it.each([[null], [undefined], [0], ['nope'], [{ a: 1 }]])
    ('does not throw on %p', v => {
      const g = { tr: { shieldedThisRound: v } };
      expect(() => repairTrSets(g)).not.toThrow();
      expect(g.tr.shieldedThisRound instanceof Set).toBe(true);
    });

  it('leaves a real Set alone', () => {
    const set = new Set(['Cody']);
    const g = { tr: { shieldedThisRound: set } };
    repairTrSets(g);
    expect(g.tr.shieldedThisRound).toBe(set);
  });
});

describe('snapshotGs', () => {
  it('round-trips every Set through JSON', () => {
    setGs(withSets());
    const copy = snapshotGs();
    // The COPY holds arrays — that is what a save wants, and what survives.
    expect(Array.isArray(copy.injuredThisEp)).toBe(true);
    expect(copy.tr.shieldedThisRound, 'the castle Set stringified to {}')
      .toEqual(['Cody', 'Jasmine']);
    // And restoring it gives real Sets back.
    repairGsSets(copy);
    expect(copy.tr.shieldedThisRound instanceof Set).toBe(true);
    expect([...copy.tr.shieldedThisRound].sort()).toEqual(['Cody', 'Jasmine']);
    expect([...copy.shotInDarkUsed].sort()).toEqual(['Bowie', 'Zoey']);
  });

  it('hands the LIVE state its Sets straight back', () => {
    // prepGsForSave flattens in place, so a snapshot that forgot to repair
    // would leave the running season holding arrays and the next `.has()`
    // would throw somewhere else entirely.
    setGs(withSets());
    snapshotGs();
    expect(gs.injuredThisEp instanceof Set, 'the live state was left flattened').toBe(true);
    expect(gs.tr.shieldedThisRound instanceof Set).toBe(true);
    expect([...gs.tr.shieldedThisRound].sort()).toEqual(['Cody', 'Jasmine']);
  });

  it('is what a rollback needs: restore, repair, no throw', () => {
    setGs(withSets());
    const before = snapshotGs();
    gs.tr.shieldedThisRound = new Set(['somebody else']);
    setGs(before);
    expect(() => repairGsSets(gs)).not.toThrow();
    expect([...gs.tr.shieldedThisRound].sort()).toEqual(['Cody', 'Jasmine']);
  });

  it('does not lose a Set the raw clone would have', () => {
    // The direct comparison, so the reason this helper exists is on the record.
    setGs(withSets());
    const raw = JSON.parse(JSON.stringify(gs));
    expect(raw.tr.shieldedThisRound, 'a raw clone somehow kept the Set').toEqual({});
    repairGsSets(gs);
    const safe = snapshotGs();
    expect(safe.tr.shieldedThisRound).toEqual(['Cody', 'Jasmine']);
  });
});

describe('nothing clones the state the unsafe way any more', () => {
  it('no source file stringifies gs without flattening it first', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const offenders = [];
    const walk = dir => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (!e.name.endsWith('.js')) continue;
        const src = fs.readFileSync(p, 'utf8');
        src.split('\n').forEach((line, i) => {
          if (!/JSON\.parse\(JSON\.stringify\(gs\)\)/.test(line)) return;
          // The two sanctioned spellings: inside snapshotGs itself, and the
          // save path, which brackets it with prep/repair by hand.
          const rel = path.relative(ROOT, p).replace(/\\/g, '/');
          if (rel === 'js/core.js' || rel === 'js/savestate.js'
            || rel === 'js/cast-ui.js') return;
          offenders.push(`${rel}:${i + 1}`);
        });
      }
    };
    walk(path.join(ROOT, 'js'));
    expect(offenders, 'these clone gs raw and will drop its Sets').toEqual([]);
  });
});
