// Kristal-talKs on a Perfect Match boot asks about the islander's own story
// (the user, 2026-10-30: "is she still in love with Dante? Her couple, her
// fight, her friendship, her triangle, her drama", and "the answers are barely
// related to the question"). js/exit-interview/pm-story.js reads it off the
// aired rows; js/kristal-exit-pm.js asks it, each question with its own answers.
import { describe, it, expect, beforeAll } from 'vitest';
import { gs, setGs, setPlayers, seasonConfig, players } from '../js/core.js';
import { simulatePerfectMatchEpisode } from '../js/pm-run.js';
import { composeExit, pronounsFor } from '../js/kristal-exit.js';
import * as L from '../js/kristal-exit-lines.js';
import { makeIslanders } from './helpers/pm-cast.js';

let interviews = [];
beforeAll(() => {
  Object.assign(seasonConfig, { format: 'perfect-match', seasonNumber: 3, pmSetup: {}, twistSchedule: [], pmRoleCounts: {} });
  setPlayers(makeIslanders(22, 5));
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], pm: { seed: 3004 } });
  for (let i = 0; i < 60; i++) if (!simulatePerfectMatchEpisode()) break;
  const used = new Set(), earlier = [];
  for (const rec of (gs.exitInterviews || []).filter(r => r.show === 'perfect-match')) {
    const ep = { id: `k-${rec.id}`, record: rec, guestName: rec.guest, season: { format: 'perfect-match' },
      pronouns: pronounsFor(players.find(p => p.name === rec.guest)?.gender) };
    const t = composeExit(ep, { words: { round: 'Day' }, earlier, used });
    earlier.push({ ...ep, ...t });
    interviews.push({ rec, t });
  }
});

describe('Kristal asks a Perfect Match islander about their own story', () => {
  it('every boot has a story, and is asked about it instead of the general opener', () => {
    const boots = interviews.filter(x => x.rec.kind !== 'finalist');
    expect(boots.length).toBeGreaterThan(5);
    for (const { rec, t } of boots) {
      expect(rec.story, rec.guest).toBeTruthy();
      const pm = t.exchanges.filter(x => x.topic.startsWith('pm-'));
      expect(pm.length, `${rec.guest}: ${t.exchanges.map(x => x.topic)}`).toBeGreaterThan(0);
      expect(t.exchanges.some(x => x.topic === 'the-exit'), rec.guest).toBe(false);
    }
  });
  it('a question names somebody from their story, and the answer is about the same person', () => {
    for (const { rec, t } of interviews) {
      const s = rec.story;
      if (!s) continue;
      const theirs = new Set([s.partner?.who, s.ex?.who, s.crush, s.fight?.who, s.bestFriend, s.turnedOn?.by, s.turnedOn?.for,
        s.robbed?.by, s.robbed?.took, s.stole?.took, s.stole?.from, s.cheatedOn?.by, s.endedBy, s.unfair?.with].filter(Boolean));
      for (const x of t.exchanges.filter(x => x.topic.startsWith('pm-') && x.who)) {
        expect(theirs.has(x.who), `${rec.guest} ${x.topic}: ${x.who}`).toBe(true);
        expect(x.q.includes(x.who) || x.a.includes(x.who), `${rec.guest} ${x.topic}: ${x.q} / ${x.a}`).toBe(true);
      }
    }
  });
  it('a partner they left behind is on the record (Perfect Match couples are not franchise showmances)', () => {
    const withPartner = interviews.filter(x => x.rec.story?.partner);
    expect(withPartner.length).toBeGreaterThan(0);
    for (const { rec } of withPartner) expect(rec.partner, rec.guest).toBe(rec.story.partner.who);
  });
  it('a finalist is asked about the final they stood in, never about a partner left behind', () => {
    // Sean won with Freya and was asked "Will you wait for Freya?" (the user, 2026-10-31).
    const finalists = interviews.filter(x => x.rec.kind === 'finalist');
    expect(finalists.length).toBeGreaterThan(3);
    for (const { rec, t } of finalists) {
      const said = t.exchanges.map(x => `${x.q} ${x.a}`).join(' | ');
      expect(said.match(/.{0,80}(wait for|still in there|walked out|left on your own|left together).{0,40}/i)?.[0] ?? null, rec.guest).toBe(null);
      expect(t.exchanges.some(x => x.topic === 'pm-final'), `${rec.guest}: ${t.exchanges.map(x => x.topic)}`).toBe(true);
      if (rec.placement === 1) expect(said, rec.guest).toMatch(/\bwon\b|chose you/i);
      // Nobody in the final misses the partner beside them, or is welcomed to "the club nobody wanted to join".
      const p = rec.story?.partner?.who;
      if (p) expect(t.exchanges.some(x => x.topic === 'named' && x.who === p && /miss|goodbye|wish had come|want .* to know/i.test(x.q)), `${rec.guest} misses ${p}: ${JSON.stringify(t.exchanges.filter(x => x.who === p).map(x => [x.topic, x.stance, x.q, x.a]))}`).toBe(false);
      expect(said, rec.guest).not.toMatch(L.OUT_ONLY);
    }
    // A couple's place, not an islander's rank: both members of a couple share it, and there is a second.
    const places = new Map(finalists.map(x => [x.rec.guest, x.rec.placement]));
    for (const { rec } of finalists) { const p = rec.story?.partner?.who; if (p && places.has(p)) expect(places.get(p), `${rec.guest} and ${p}`).toBe(rec.placement); }
    expect([...places.values()]).toContain(2);
  });
});
