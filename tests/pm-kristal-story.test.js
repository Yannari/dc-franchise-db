// Kristal-talKs on a Perfect Match boot asks about the islander's own story
// (the user, 2026-10-30: "is she still in love with Dante? Her couple, her
// fight, her friendship, her triangle, her drama", and "the answers are barely
// related to the question"). js/exit-interview/pm-story.js reads it off the
// aired rows; js/kristal-exit-pm.js asks it, each question with its own answers.
import { describe, it, expect, beforeAll } from 'vitest';
import { gs, setGs, setPlayers, seasonConfig, players } from '../js/core.js';
import { simulatePerfectMatchEpisode } from '../js/pm-run.js';
import { composeExit, pronounsFor } from '../js/kristal-exit.js';
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
});
