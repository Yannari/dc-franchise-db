// ci-circle-chat-time.test.js — Circle Chat at its hour.
// User (2026-10-01): "the circle chat happened really at the end of the
// episode ... how many circle chats are we supposed to have ... 'Hope you all
// slept better than me' doesn't chronologically make sense". The transcripts:
// one or two an episode, at any time of day.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const runs = [1, 2, 3, 4].map(seed => {
  const cast = rosterCast(12, seed); setPlayers(cast); const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
});
const chats = runs.flatMap(r => r.state.scenes.filter(s => s.kind === 'circle-chat' && s.script?.blocks?.length));
const text = s => s.script.blocks.flatMap(b => b.lines.map(l => l.text)).join(' ');

describe('Circle Chat at its hour', () => {
  it('opens in the morning, the middle of the day or the evening', () => {
    const when = new Set(chats.map(s => s.data.when));
    for (const w of ['morning', 'day', 'evening']) expect(when).toContain(w);
  });
  it('one or two an episode, nearly always', () => {
    const per = runs.flatMap(r => r.rows.slice(0, -1).map(row => row.ci.aired.filter(s => s.kind === 'circle-chat').length));
    const fit = per.filter(n => n === 1 || n === 2).length / per.length;
    expect(fit).toBeGreaterThan(0.8);
  });
  it('a morning chat never says tonight; a later one never asks how everyone slept', () => {
    for (const s of chats) {
      if (s.data.when === 'morning') expect(text(s), text(s)).not.toMatch(/\btonight\b|in bed\b/i);
      else expect(text(s), text(s)).not.toMatch(/slept|good morning|rise and shine/i);
    }
  });
});
