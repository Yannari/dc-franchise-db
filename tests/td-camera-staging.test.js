// @vitest-environment jsdom
// The TD stepped viewer's camera, where scenes are staged, the day's weather, and the talk written
// over a moment the engine only narrated (2026-10-07).
//
// Guards: a zoom that frames somebody who is not in the conversation, or crops past the set's edge;
// a scene moved from a private place to a public one (or the other way); a staging that changes on
// replay; a place a line names being swapped out from under it; a challenge moment left as a bare
// narrator's sentence; a weather that changes on replay.
import { describe, it, expect } from 'vitest';
import { shotOf, weatherOf } from '../js/vp-td-ep/stage.js';
import { stageSpot } from '../js/vp-td-ep/steps.js';
import { scriptLooseEvents } from '../js/td/script/write.js';
import { ACCESS_PROFILES } from '../js/camp-access.js';
import * as core from '../js/core.js';

const toks = [
  { n: 'Gwen', u: .3, v: .7, h: 30 }, { n: 'Trent', u: .45, v: .72, h: 30 },
  { n: 'Owen', u: .8, v: .6, h: 18, bg: true }, { n: 'Chris', u: .9, v: .7, h: 26, host: true },
];
const scene = { k: 'scene', focus: ['Gwen', 'Trent'], places: {} };

describe('the camera', () => {
  it('closes in on the conversation, leaning toward who talks, and never past the set', () => {
    const s = shotOf({}, { scene, step: { k: 'say', by: 'Gwen', text: 'Hi' } }, toks);
    expect(s.k).toBeGreaterThan(1.1);
    expect(s.who.sort()).toEqual(['Gwen', 'Trent']);
    expect(s.x).toBeLessThanOrEqual(0); expect(s.x).toBeGreaterThanOrEqual(1 - s.k);
    expect(s.y).toBeLessThanOrEqual(0); expect(s.y).toBeGreaterThanOrEqual(1 - s.k);
    const t = shotOf({}, { scene, step: { k: 'say', by: 'Trent', text: 'Hey' } }, toks);
    expect(t.x).toBeLessThan(s.x);   // the frame moves right, toward Trent
  });

  it('stays wide on a scene opening, a title, a confessional and the host at a ceremony', () => {
    expect(shotOf({}, { scene, step: { k: 'scene' } }, toks).k).toBe(1);
    expect(shotOf({}, { scene, step: { k: 'title' } }, toks).k).toBe(1);
    expect(shotOf({}, { scene, conf: { by: 'Gwen' }, step: { k: 'conf', by: 'Gwen' } }, toks).k).toBe(1);
    expect(shotOf({}, { scene: { ...scene, ceremony: true }, step: { k: 'say', by: 'Chris', host: true } }, toks).k).toBe(1);
  });
});

describe('staging', () => {
  const privacy = Object.fromEntries(ACCESS_PROFILES['hosted-camp'].map(l => [l.id, l.privacy]));
  const kindOf = { 'cabin-inside': 'cabins', beach: 'forest-trail', cliff: 'forest-trail', washroom: 'communal-grounds' };
  const evs = ['life.wakeup', 'romance.flirt', 'drama.clash', 'hosted.slop', 'friend.bond', 'deal.side', 'plot.lie']
    .flatMap(kind => ['morning', 'camp-work', 'return', 'scramble'].map(w => [{ scene: { kind }, players: ['Gwen', 'Trent'], lines: [{ text: 'Hey.' }] }, w]));

  it('moves a scene only to a place as private as the one the engine chose, the same way every time', () => {
    for (const spot of ['cabins', 'communal-grounds', 'forest-trail', 'dock']) for (const [ev, w] of evs) {
      const to = stageSpot('hosted-camp', spot, ev, w);
      expect(stageSpot('hosted-camp', spot, ev, w)).toBe(to);
      const p0 = privacy[spot], p1 = privacy[to] ?? privacy[kindOf[to] || to];
      expect(Math.abs(p1 - p0), `${spot} -> ${to}`).toBeLessThanOrEqual(0.36);
    }
  });

  it('never moves a scene whose lines name its place', () => {
    const ev = { scene: { kind: 'romance.flirt' }, players: ['Gwen', 'Trent'], lines: [{ text: 'Meet me at the dock.' }] };
    expect(stageSpot('hosted-camp', 'dock', ev, 'scramble')).toBe('dock');
  });

  it('uses the whole camp', () => {
    const seen = new Set();
    for (const spot of ['cabins', 'communal-grounds', 'forest-trail', 'dock']) for (const [ev, w] of evs) seen.add(stageSpot('hosted-camp', spot, ev, w));
    for (const p of ['cabin-inside', 'beach', 'cliff', 'mess-hall', 'washroom', 'campfire']) expect(seen.has(p), p).toBe(true);
  });
});

describe('the day', () => {
  it('has one weather per episode at a venue, the same on every replay', () => {
    expect(weatherOf('hosted-camp', 4)).toBe(weatherOf('hosted-camp', 4));
    expect(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => weatherOf('hosted-camp', n))).size).toBeGreaterThan(2);
  });
});

describe('a moment the engine only narrated', () => {
  it('keeps the sentence as the insight, then the people in it talk', () => {
    core.setGs({ episode: 2, activePlayers: ['Gwen', 'Trent', 'Owen'], bonds: {}, namedAlliances: [], showmances: [] });
    const ep = { num: 3, tribesAtStart: [{ name: 'Bass', members: ['Gwen', 'Trent', 'Owen'] }], campEvents: { Bass: { pre: [], post: [
      { text: 'Gwen pulled Trent out of the icy water during the crossing.', players: ['Gwen', 'Trent'], badgeText: 'RESCUE', badgeClass: 'gold' },
      { text: 'Owen bends over between phases, hands on his knees.', players: ['Owen'], tag: 'challenge' },
    ] } } };
    scriptLooseEvents(ep);
    const [a, b] = ep.campEvents.Bass.post;
    expect(a.lines[0]).toMatchObject({ kind: 'beat', text: 'Gwen pulled Trent out of the icy water during the crossing.' });
    expect(a.lines.slice(1).some(l => l.kind === 'say')).toBe(true);
    expect(a.scene.kind).toBe('aside.warm');
    expect(b.scene.kind).toBe('aside.strain');
    expect(b.players.length).toBe(2);   // the person closest to Owen, who saw it
    expect(b.lines.slice(1).every(l => !l.by || ['Owen', ...b.players].includes(l.by))).toBe(true);
  });
});
