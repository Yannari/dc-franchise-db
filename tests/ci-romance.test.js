// ci-romance.test.js — crushes, jealousy and the morning after.
// User (2026-09-30): "do we have possible romance here". The engine had
// attraction, flirts, performed flirts and a visit kiss; nothing showed who
// fancied whom, and a flirt in front of a crush cost nothing.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason, SPARK_AT } from '../js/ci/season.js';
import { JEALOUS_AT } from '../js/ci/party.js';
import { sidebarHtml } from '../js/vp-ci/sidebar.js';
import { circleScreens } from '../js/vp-ci/steps.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const seasons = [1, 2, 3, 4, 5].map(seed => {
  const cast = rosterCast(12, seed); setPlayers(cast); const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
});
const scenes = seasons.flatMap(r => r.state.scenes.map(sc => ({ sc, state: r.state })));

describe('jealousy at the party', () => {
  const parties = scenes.filter(x => x.sc.kind === 'party');
  it('happens at most once a night, and at most parties', () => {
    expect(parties.every(x => (x.sc.data.jealous || []).length <= 1)).toBe(true);
    expect(parties.filter(x => x.sc.data.jealous?.length).length / parties.length).toBeGreaterThan(0.5);
  });
  it('is about a flirt that aired, and the watcher is not in it', () => {
    for (const { sc, state } of parties.filter(x => x.sc.data.jealous?.length)) {
      const [j] = sc.data.jealous;
      expect([j.of, j.rival]).not.toContain(j.by);
      // the flirt aired (its two speakers are the crush and the rival)...
      const flirts = sc.script.blocks.filter(b => b.key === 'party.flirt')
        .map(b => [...new Set(b.lines.map(l => l.who).filter(Boolean))].sort().join('|'));
      expect(flirts).toContain([j.of, j.rival].sort().join('|'));
      // ...and the watcher says so, aloud, about the two of them
      const said = sc.script.blocks.find(b => b.key === 'party.jealous');
      expect(said.lines[0].who).toBe(j.by);
      expect(said.lines.map(l => l.text).join(' ')).toMatch(new RegExp(state.profiles[j.of].shown.name + '|' + state.profiles[j.rival].shown.name));
    }
  });
  it('needs a real crush', () => expect(JEALOUS_AT).toBeGreaterThanOrEqual(4));
});

describe('the morning after', () => {
  it('a jealous chat goes to the crush, the day after the party, about the rival', () => {
    const chats = scenes.filter(x => x.sc.kind === 'chat' && x.sc.data.intent === 'jealous');
    expect(chats.length).toBeGreaterThan(5);
    for (const { sc, state } of chats) {
      const [from, to] = sc.who;
      const j = state.jealous.find(e => e.by === from && e.of === to && e.day === sc.day - 1);
      expect(j, `${from} -> ${to} day ${sc.day}`).toBeTruthy();
      expect(sc.data.rival).toBe(j.rival);
    }
  });
  it('ends every way, and the lines name the rival', () => {
    const chats = scenes.filter(x => x.sc.kind === 'chat' && x.sc.data.intent === 'jealous');
    expect(new Set(chats.map(x => x.sc.data.ending)).size).toBe(3);
    const aired = chats.filter(x => x.sc.aired);
    expect(aired.length).toBeGreaterThan(2);
    for (const { sc, state } of aired) {
      const b = sc.script.blocks.find(x => x.key.startsWith('chat.jealous.'));
      expect(b.lines.map(l => l.text).join(' ').toLowerCase()).toContain(state.profiles[sc.data.rival].shown.name.toLowerCase());
    }
  });
});

describe('sparks in the sidebar', () => {
  it('the room as the day began names crushes and pairs who like each other', () => {
    const rows = seasons.flatMap(r => r.rows);
    const withSparks = rows.filter(r => r.ci.start?.sparks?.length);
    expect(withSparks.length / rows.length).toBeGreaterThan(0.4);
    const r = withSparks.find(x => circleScreens(x).length);
    const html = sidebarHtml(r, circleScreens(r), 0, 0);
    expect(html).toMatch(/SPARKS/);
    expect(SPARK_AT).toBeGreaterThan(3);
  });
});
