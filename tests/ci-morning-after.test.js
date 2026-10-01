// ci-morning-after.test.js — talking over what just happened (chat.js
// debriefTopic, conversation.js defend + debrief). User, 2026-10-01: a
// goodbye warning moved every belief and no chat that day mentioned it; the
// strategic side of the game was barely on screen.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { S } from '../js/ci/state.js';
import { PER_TOPIC } from '../js/ci/chat.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const seasons = [1, 2, 3, 4, 5, 6, 7, 8].map(seed => {
  const cast = rosterCast(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed }).state;
});
const chats = seasons.flatMap(state => state.scenes.filter(s => s.kind === 'chat').map(sc => ({ state, sc })));
const seenBoth = (s, a, b) => s.seenBy.includes(a) && s.seenBy.includes(b);

describe('the morning after a goodbye warning', () => {
  it('the building talks about it the same day, nearly every time', () => {
    let warned = 0, talked = 0;
    for (const state of seasons) for (const g of state.scenes.filter(s => s.kind === 'goodbye' && s.data.warning)) {
      warned++;
      const about = g.data.warning.about;
      if (state.scenes.some(c => c.kind === 'chat' && c.day === g.day
        && ((c.data.intent === 'defend' && c.who[0] === about) || (c.data.topic === 'warning' && c.data.about === about)))) talked++;
    }
    expect(warned).toBeGreaterThan(10);
    expect(talked / warned).toBeGreaterThan(0.8);
  });
  it('only the accused defends, only to someone who saw the video, and it names who made the warning', () => {
    const defends = chats.filter(x => x.sc.data.intent === 'defend');
    expect(defends.length).toBeGreaterThan(0);
    for (const { state, sc } of defends) {
      const g = state.scenes.find(s => s.kind === 'goodbye' && s.day === sc.day && s.data.warning?.about === sc.who[0]);
      expect(g).toBeTruthy();
      expect(g.seenBy).toContain(sc.who[1]);
      expect(sc.data.about).toBe(g.who[0]);
    }
  });
});

describe('comparing notes', () => {
  const debriefs = chats.filter(x => x.sc.data.intent === 'debrief');
  it('is about something both of them saw, and never about either of them', () => {
    expect(debriefs.length).toBeGreaterThan(20);
    for (const { state, sc } of debriefs) {
      const [a, b] = sc.who;
      expect([a, b]).not.toContain(sc.data.about);
      const source = sc.data.topic === 'ratings'
        ? state.scenes.find(s => s.kind === 'ratings' && s.day === sc.day - 1)
        : state.scenes.find(s => s.day === sc.day && (sc.data.topic === 'warning'
          ? s.kind === 'goodbye' && s.data.warning?.about === sc.data.about
          : s.kind === 'blocking' && s.data.target === sc.data.about));
      expect(source, `${sc.data.topic} ${sc.data.about}`).toBeTruthy();
      expect(seenBoth(source, a, b)).toBe(true);
    }
  });
  it(`gives one topic at most ${PER_TOPIC} chats a day`, () => {
    const per = {};
    for (const { state, sc } of debriefs) {
      const k = `${state.seed}:${sc.day}:${sc.data.topic}:${sc.data.about}`;
      per[k] = (per[k] || 0) + 1;
    }
    expect(Math.max(...Object.values(per))).toBeLessThanOrEqual(PER_TOPIC);
  });
  it('moves what they believe (a warm chat about a warning or the ratings changes a belief)', () => {
    const warm = debriefs.filter(x => x.sc.data.ending === 'warm' && x.sc.data.topic !== 'blocked');
    for (const { state, sc } of warm) {
      expect(state.beliefLog.some(l => l.scene === sc.id) || sc.data.kind !== 'catfish' && sc.data.topic === 'warning').toBe(true);
    }
  });
});

describe('strategists strategize; the chill stay chill', () => {
  it('game talk grows with the strategic stat', () => {
    const STRAT = new Set(['ally', 'pitch', 'probe', 'pump', 'compare', 'plant', 'credit', 'defend', 'debrief']);
    const by = [[0, 0], [0, 0]];
    for (const { state, sc } of chats) {
      const i = S(state, sc.who[0], 'strategic') >= 7 ? 1 : S(state, sc.who[0], 'strategic') <= 4 ? 0 : -1;
      if (i < 0) continue;
      by[i][0]++; if (STRAT.has(sc.data.intent)) by[i][1]++;
    }
    const [low, high] = by.map(([n, s]) => s / n);
    expect(high).toBeGreaterThan(low * 2.5);
    expect(low).toBeLessThan(0.2);
    expect(high).toBeGreaterThan(0.4);
  });
});
