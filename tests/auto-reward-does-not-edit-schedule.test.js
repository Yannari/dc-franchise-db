// ══════════════════════════════════════════════════════════════════════
// auto-reward-does-not-edit-schedule.test.js — simulating is not authoring
// ══════════════════════════════════════════════════════════════════════
//
// Reported with two screenshots of the same Format Designer timeline, before
// and after simulating one episode:
//
//   before   Ep.3  Tusks and Ladders · Elimination Swap
//            Ep.4  One Million Bucks, B.C.
//            Ep.5  The Am-AH-Zon Race · Tribe Expansion
//
//   after    Ep.3  Tusks and Ladders · Elimination Swap · Reward Challenge
//            Ep.4  (empty)
//            Ep.5  One Million Bucks, B.C.
//            Ep.6  The Am-AH-Zon Race · Tribe Expansion
//
// Two symptoms, one cause. The auto reward challenge was `push`ed onto
// `cfg.twistSchedule` — the AUTHOR'S schedule, the one the designer draws and
// localStorage persists — so every episode played permanently grew a card
// nobody placed. And because the timeline's projection maps twists onto
// projected episodes, that extra entry renumbered everything after it.
//
// A decision about tonight is not an edit to the season.
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seasonConfig, defaultConfig } from '../js/core.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const episode = fs.readFileSync(path.join(ROOT, 'js/episode.js'), 'utf8');

describe('the played season does not edit the written one', () => {
  it('never pushes onto the author schedule', () => {
    // The single line that caused it. Anything that writes here again puts the
    // phantom cards back.
    const code = episode.split('\n')
      .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
    expect(code, 'episode.js writes to the author schedule again')
      .not.toMatch(/twistSchedule\s*(\|\|\s*\[\]\s*)?\)?\s*\.push\(/);
    expect(code).not.toMatch(/cfg\.twistSchedule\s*=/);
  });

  it('still assembles the auto reward for the episode being played', () => {
    // The reward has to reach `_rawScheduled`, which is what the twist check
    // reads — it just must not survive the tick.
    // A generous window: this block grew when the authored-episode offset
    // landed beside it, and a fixed slice quietly stopped reaching the line it
    // was asserting on.
    const block = episode.slice(episode.indexOf('AUTO REWARD'),
      episode.indexOf('AUTO REWARD') + 3000);
    expect(block).toContain("type: 'reward-challenge'");
    expect(block).toContain('_rawScheduled');
    expect(block, 'the gate conditions were dropped').toContain('autoRewardChallenges');
    expect(block).toContain("foodWater === 'enabled'");
    expect(block).toMatch(/activePlayers\.length > 4/);
  });
});

// The assembly itself, lifted out so the decision can be run rather than read.
function rawScheduled(cfg, gsLike, epNum) {
  const scheduled = (cfg.twistSchedule || []).filter(t => t && Number(t.episode) === epNum);
  const auto = cfg.autoRewardChallenges && cfg.foodWater === 'enabled'
    && gsLike.activePlayers.length > 4
    && !scheduled.some(t => t.type === 'reward-challenge');
  return auto
    ? [...scheduled, { episode: epNum, type: 'reward-challenge', id: 'auto-reward-' + epNum }]
    : scheduled;
}

describe('what the twist check receives', () => {
  let cfg;
  const gsLike = { activePlayers: Array.from({ length: 12 }, (_, i) => 'P' + i) };

  beforeEach(() => {
    cfg = { ...defaultConfig(), autoRewardChallenges: true, foodWater: 'enabled',
      twistSchedule: [
        { episode: 3, type: 'tusks-and-ladders', id: 'a' },
        { episode: 3, type: 'elimination-swap', id: 'b' },
        { episode: 4, type: 'million-bucks-bc', id: 'c' },
      ] };
  });

  it('adds the reward for tonight', () => {
    const got = rawScheduled(cfg, gsLike, 3);
    expect(got.map(t => t.type)).toContain('reward-challenge');
    expect(got).toHaveLength(3);
  });

  it('leaves the author schedule exactly as it was', () => {
    const before = JSON.stringify(cfg.twistSchedule);
    rawScheduled(cfg, gsLike, 3);
    rawScheduled(cfg, gsLike, 4);
    expect(JSON.stringify(cfg.twistSchedule),
      'simulating rewrote the season the author wrote').toBe(before);
    expect(cfg.twistSchedule).toHaveLength(3);
  });

  it('does not double up on an episode the author already gave one', () => {
    cfg.twistSchedule.push({ episode: 5, type: 'reward-challenge', id: 'mine' });
    const got = rawScheduled(cfg, gsLike, 5);
    expect(got.filter(t => t.type === 'reward-challenge')).toHaveLength(1);
    expect(got[0].id, "the author's own entry was replaced").toBe('mine');
  });

  it('stops at the final four, and when the setting is off', () => {
    expect(rawScheduled(cfg, { activePlayers: ['a', 'b', 'c', 'd'] }, 3)
      .some(t => t.type === 'reward-challenge')).toBe(false);
    expect(rawScheduled({ ...cfg, autoRewardChallenges: false }, gsLike, 3)
      .some(t => t.type === 'reward-challenge')).toBe(false);
    expect(rawScheduled({ ...cfg, foodWater: 'off' }, gsLike, 3)
      .some(t => t.type === 'reward-challenge')).toBe(false);
  });

  it('is the same answer every time it is asked', () => {
    // The old code was order-dependent: the first call wrote the entry and the
    // second found it already there.
    const a = rawScheduled(cfg, gsLike, 3).map(t => t.type).join(',');
    const b = rawScheduled(cfg, gsLike, 3).map(t => t.type).join(',');
    expect(b).toBe(a);
  });
});
