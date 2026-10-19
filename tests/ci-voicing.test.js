// @vitest-environment jsdom
// ci-voicing.test.js — The Circle voiced like Total Drama and Big Brother (vp-ci/voicing.js). The user, 2026-10-19:
// "do we have voice acting connected for the circle?" — the person in the apartment speaks every line, never the
// profile: a catfish sounds like themselves, a message is voiced as it was dictated to the Circle, and the Circle's
// own lines are the voice called "The Circle".
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { circleScreens } from '../js/vp-ci/steps.js';
import { ciEpisodeLines, spokenLine, lineId, ciVoiceSeason, CIRCLE_VOICE } from '../js/vp-ci/voicing.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const cast = rosterCast(13, 7); setPlayers(cast);
const names = cast.map(p => p.name);
const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed: 7 });
const hist = rows.map(r => ({ ...r, format: 'the-circle' }));
window.gs = { episodeHistory: hist };

describe('voicing The Circle', () => {
  it('says every line in a real person\'s voice, or the Circle\'s', () => {
    const lines = hist.flatMap(r => ciEpisodeLines(r));
    expect(lines.length).toBeGreaterThan(100);
    const people = new Set([...names, CIRCLE_VOICE]);
    for (const l of lines) expect(people.has(l.by), `${l.by}: ${l.text}`).toBe(true);
    expect(lines.some(l => l.by === CIRCLE_VOICE)).toBe(true);
  });

  it('voices a catfish as the person behind the profile, and a message as it was dictated', () => {
    let catfish = 0, dictated = 0;
    for (const row of hist) for (const sc of circleScreens(row)) for (const st of sc.steps) {
      const l = spokenLine(row, sc, st);
      if (!l || !st.who) continue;
      const p = (sc.rowView || row).ci.profiles[st.who];
      expect(l.by).toBe(p.people[0]);
      if (p.name && !p.people.includes(p.name)) catfish++;
      if (st.part === 'send' && st.spoken) { expect(l.text).toBe(st.spoken.trim()); dictated++; }
    }
    expect(dictated).toBeGreaterThan(10);
    expect(catfish).toBeGreaterThan(0);
  });

  it('finds every on-screen line in the episode\'s list, by the same id', () => {
    const row = hist[2];
    const ids = new Set(ciEpisodeLines(row).map(l => l.id));
    for (const sc of circleScreens(row)) for (const st of sc.steps) {
      const l = spokenLine(row, sc, st);
      if (l) expect(ids.has(lineId(l.by, l.text))).toBe(true);
    }
  });

  it('keeps its clips in its own folder, never Total Drama\'s or Big Brother\'s', () => {
    expect(ciVoiceSeason()).toMatch(/^ci-/);
  });
});
