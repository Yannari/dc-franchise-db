// ci-blocking-suspense.test.js — the Hangout keeps its secret; the blocking
// drags it out; the flashback says why.
// User (2026-10-01): "the blocking should be more suspenseful ... the message
// before the blocking should be longer and we should be revealed as a
// flashback how and why they stopped on that specific person". And: "always
// respect the show" — the Hangout cuts before the name.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { blockText } from '../js/ci/transcript.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const seasons = [1, 2, 3, 4].map(seed => {
  const cast = rosterCast(12, seed); setPlayers(cast); const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed }).state;
});
const scenes = kind => seasons.flatMap(state => state.scenes.filter(s => s.kind === kind && s.script?.blocks?.length).map(sc => ({ sc, state })));
const DECISION = /^hangout\.(agree|trade|yield|trio\.|solo\.decide)/;
const nameIn = (state, h, text) => text.toLowerCase().includes(String(state.profiles[h].shown.name).toLowerCase());

describe('the Hangout keeps its secret', () => {
  it('never airs the decision, and ends sealed', () => {
    for (const { sc } of scenes('hangout')) {
      expect(sc.script.blocks.some(b => DECISION.test(b.key))).toBe(false);
      expect(sc.script.blocks.at(-1).key === 'hangout.pact' ? sc.script.blocks.at(-2).key : sc.script.blocks.at(-1).key).toMatch(/^hangout\.(solo\.)?sealed$/);
    }
  });
  it('puts two names on the table when there is a second, so the debate does not give it away', () => {
    const two = scenes('hangout').filter(x => x.sc.data.runnerUp);
    expect(two.length).toBeGreaterThan(5);
    for (const { sc } of two) {
      const cut = sc.script.blocks.filter(b => /view\.\w+\.cut$/.test(b.key)).length;
      expect(cut).toBe(2);
      expect(sc.data.runnerUp.handle).not.toBe(sc.data.target);
    }
  });
});

describe('the announcement drags it out', () => {
  const typed = () => scenes('blocking').filter(x => x.sc.data.channel === 'influencers' && !x.sc.data.secret && !x.sc.data.inPerson);
  it('an opener and a clue true to the reason come before the name, and say no name', () => {
    expect(typed().length).toBeGreaterThan(5);
    for (const { sc, state } of typed()) {
      const keys = sc.script.blocks.map(b => b.key);
      const named = keys.findIndex(k => k.startsWith('block.announce.'));
      const open = keys.findIndex(k => k.startsWith('block.build.open'));
      const clue = keys.findIndex(k => k.startsWith('block.build.clue.'));
      expect(open).toBeGreaterThanOrEqual(0);
      expect(open).toBeLessThan(clue);
      expect(clue).toBeLessThan(named);
      expect(keys[clue]).toBe(`block.build.clue.${['fake', 'threat', 'grudge', 'noBond', 'offer'].includes(sc.data.reason) ? sc.data.reason : 'noBond'}`);
      for (const b of sc.script.blocks.slice(0, named)) {
        // what is said and sent (a waiting target's own label is not naming them)
        expect(nameIn(state, sc.data.target, b.lines.map(l => l.text).join(' ')), `${b.key} names the target early`).toBe(false);
      }
    }
  });
  it('the one the clue could fit panics first (never an Influencer, never the target); the target waits on the dots', () => {
    for (const { sc, state } of typed()) {
      const fear = sc.script.blocks.find(b => /^block\.fear\.(?!dots)/.test(b.key));
      if (fear) {
        const who = fear.lines[0].who;
        expect(who).not.toBe(sc.data.target);
        expect(sc.data.by).not.toContain(who);
      }
      const dots = sc.script.blocks.find(b => b.key === 'block.fear.dots');
      expect(dots.lines[0].who).toBe(sc.data.target);
    }
  });
});

describe('the flashback', () => {
  it('follows the name: the Hangout decision, marked as earlier, in the backlog too', () => {
    for (const { sc, state } of scenes('blocking').filter(x => x.sc.data.channel === 'influencers' && !x.sc.data.secret && !x.sc.data.inPerson)) {
      const keys = sc.script.blocks.map(b => b.key);
      const named = keys.findIndex(k => k.startsWith('block.announce.'));
      const fb = sc.script.blocks.findIndex(b => b.phase === 'flashback-open');
      expect(fb).toBeGreaterThan(named);
      expect(sc.script.blocks.slice(fb).some(b => DECISION.test(b.key))).toBe(true);
      expect(blockText(state, sc.script.blocks[fb])[0]).toBe('  — EARLIER, IN THE HANGOUT —');
    }
  });
});
