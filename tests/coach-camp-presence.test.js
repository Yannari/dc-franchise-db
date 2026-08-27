// @vitest-environment jsdom
//
// A coach is at camp. That sounds too obvious to test, and it is exactly what
// shipped broken: coaches were excluded from `gs.activePlayers` (correct — they
// never compete or vote) AND from `tribe.members` (wrong — that array doubles
// as "who is physically here"). Every camp screen read the second array, so a
// coach appeared in none of the 110 camp event types, none of the relationship
// summaries, and none of the prose the season generated about their own tribe.
//
// These tests pin the split: eligibility keeps excluding coaches, presence
// does not.
import { describe, expect, it, beforeEach } from 'vitest';
import * as core from '../js/core.js';
import { campRoster, coachVoteReason, addCoach } from '../js/coaches.js';
import { runHeadlessSeason } from './helpers/coach-season.js';

beforeEach(() => {
  core.setGs({ ...core.gs, coaches: [], coachTraining: {}, bonds: {}, tribes: [] });
});

describe('campRoster separates presence from eligibility', () => {
  it('adds the tribe’s coaches to the contestant list', () => {
    core.gs.tribes = [{ name: 'Moto', members: ['A', 'B'] }];
    addCoach({ name: 'Bowie', tribe: 'Moto' });
    expect(campRoster('Moto', ['A', 'B'])).toEqual(['A', 'B', 'Bowie']);
  });

  it('never adds a coach twice, even if one is already in the list', () => {
    core.gs.tribes = [{ name: 'Moto', members: ['A', 'Bowie'] }];
    addCoach({ name: 'Bowie', tribe: 'Moto' });
    expect(campRoster('Moto', ['A', 'Bowie'])).toEqual(['A', 'Bowie']);
  });

  it('leaves another tribe’s coach out', () => {
    core.gs.tribes = [{ name: 'Moto', members: ['A'] }, { name: 'Ravu', members: ['B'] }];
    addCoach({ name: 'Bowie', tribe: 'Ravu' });
    expect(campRoster('Moto', ['A'])).toEqual(['A']);
  });

  it('falls back to gs.tribes when no member list is passed', () => {
    core.gs.tribes = [{ name: 'Moto', members: ['A', 'B'] }];
    addCoach({ name: 'Bowie', tribe: 'Moto' });
    expect(campRoster('Moto')).toEqual(['A', 'B', 'Bowie']);
  });
});

describe('coachVoteReason explains the vote in the coach’s own vocabulary', () => {
  it('leads with favouritism when the voter was never trained', () => {
    addCoach({ name: 'Bowie', tribe: 'Moto' });
    core.gs.coachTraining = { Bowie: { A: { social: 1 } } };
    const r = coachVoteReason('Bowie', 'B');
    expect(r).toBeTruthy();
    expect(r.toLowerCase()).toContain('coach');
    expect(r).toContain('B');
  });

  it('always names the coach as a coach, whichever driver wins', () => {
    addCoach({ name: 'Bowie', tribe: 'Moto', stars: 5 });
    // No training at all — falls through to the cheap-cut reason.
    expect(coachVoteReason('Bowie', 'B').toLowerCase()).toContain('coach');
  });

  it('returns null for somebody who is not a coach', () => {
    expect(coachVoteReason('Nobody', 'B')).toBe(null);
  });

  it('is deterministic, so a replay quotes what the transcript quoted', () => {
    addCoach({ name: 'Bowie', tribe: 'Moto' });
    core.gs.coachTraining = { Bowie: { A: { social: 1 } } };
    expect(coachVoteReason('Bowie', 'B')).toBe(coachVoteReason('Bowie', 'B'));
  });
});

describe('a coach is visible in a real season', () => {
  it('appears in ordinary camp events, not only coach-specific ones', async () => {
    const { episodes, coachNames } = await runHeadlessSeason({
      twist: 'coaches', coachesPerTribe: 2, castSize: 16, mergeAt: 10,
    });
    const generic = [];
    for (const e of episodes) {
      for (const phases of Object.values(e.ep.campEvents || {})) {
        for (const phase of ['pre', 'post']) {
          for (const ev of (phases?.[phase] || [])) {
            if (!/^coach/.test(ev.type) && (ev.players || []).some(n => coachNames.includes(n))) {
              generic.push(ev.type);
            }
          }
        }
      }
    }
    expect(generic.length, 'a coach never turned up in a single ordinary camp event').toBeGreaterThan(0);
    expect(new Set(generic).size, 'a coach should reach a variety of event types').toBeGreaterThan(1);
  }, 240000);

  it('gets at most one passed-over notice per episode, naming every coach who skipped them', async () => {
    const { episodes } = await runHeadlessSeason({
      twist: 'coaches', coachesPerTribe: 2, castSize: 16, mergeAt: 10,
    });
    for (const e of episodes) {
      const seen = new Set();
      for (const phases of Object.values(e.ep.campEvents || {})) {
        for (const phase of ['pre', 'post']) {
          for (const ev of (phases?.[phase] || [])) {
            if (ev.type !== 'coachPassedOverNotices') continue;
            const contestant = ev.players[0];
            expect(seen.has(contestant),
              `${contestant} got two passed-over notices in episode ${e.num} — one per coach is the doubling that made the board unreadable`).toBe(false);
            seen.add(contestant);
          }
        }
      }
    }
  }, 240000);
});

// A coach casts no ballot and is not therefore powerless. Their leverage is
// what the twist says it is — the training they handed out and the standing
// that came with it — spent through the same pitch pipeline every contestant
// uses. Without this a coach watches their own elimination without opening
// their mouth, which is the thing the twist was accused of being.
describe('a coach can argue, without ever voting', () => {
  it('pitches, and can move a ballot, while never appearing as a voter', async () => {
    let pitches = [], votedByCoach = 0;
    for (let r = 0; r < 3 && pitches.length < 3; r++) {
      const { episodes, coachNames } = await runHeadlessSeason({
        twist: 'coaches', coachesPerTribe: 2, castSize: 16, mergeAt: 10,
      });
      // Only while they are still coaches. Promotion at the merge makes them
      // full players, and a promoted coach voting is the twist working.
      let merged = false;
      for (const e of episodes) {
        if (e.isMerge) merged = true;
        pitches.push(...(e.ep.votePitches || []).filter(p => p.coachPitch));
        if (!merged) {
          votedByCoach += (e.votingLog || []).filter(v => coachNames.includes(v.voter)).length;
        }
      }
    }
    expect(pitches.length, 'a coach never opened their mouth across three seasons').toBeGreaterThan(0);
    expect(votedByCoach, 'a coach cast a ballot — the one thing the twist forbids').toBe(0);
  }, 600000);

  it('never argues for the elimination of its own protégé while anyone else is available', async () => {
    for (let r = 0; r < 2; r++) {
      const { episodes } = await runHeadlessSeason({
        twist: 'coaches', coachesPerTribe: 2, castSize: 16, mergeAt: 10,
      });
      for (const e of episodes) {
        for (const p of (e.ep.votePitches || []).filter(x => x.coachPitch)) {
          const proteges = p.coachProteges || [];
          if (!proteges.includes(p.pitchTarget)) continue;
          // Only legitimate when the coach has trained everybody available.
          const others = (e.ep.tribalPlayers || []).filter(n => n !== p.pitcher && !proteges.includes(n));
          expect(others.length,
            `${p.pitcher} pitched their own protégé ${p.pitchTarget} with ${others.join(', ')} available`).toBe(0);
        }
      }
    }
  }, 600000);
});

// Twelve of the thirteen coach event types were the training ledger in
// different hats. These are about BEING a coach: the fame, the missing ballot,
// the card in the room, and a merge nobody else is playing for.
describe('coaches are campers, and also coaches', () => {
  it('produces status beats that are not about the sessions', async () => {
    const seen = new Set();
    for (let r = 0; r < 2; r++) {
      const { episodes } = await runHeadlessSeason({
        twist: 'coaches', coachesPerTribe: 2, castSize: 16, mergeAt: 10,
      });
      for (const e of episodes) {
        for (const phases of Object.values(e.ep.campEvents || {})) {
          for (const ph of ['pre', 'post']) {
            for (const ev of (phases?.[ph] || [])) {
              if (/^coach(Starstruck|Unimpressed|PullsRank|ShineWearsOff|NoBallotWeightless|SaysTheUnsayable|CardFlinch|CardFlush|IdleAdvantage|PlayingForTheMerge|OwnSeason)$/.test(ev.type)) {
                seen.add(ev.type);
                expect(ev.players?.length, `${ev.type} named nobody`).toBeGreaterThan(0);
                expect(ev.badgeText, `${ev.type} has no badge`).toBeTruthy();
              }
            }
          }
        }
      }
    }
    expect(seen.size, 'no status beat fired at all in two seasons').toBeGreaterThan(3);
  }, 600000);

  it('reacts to fame at all — aweOf produced no event before this', async () => {
    const { coachStatusEvents } = await import('../js/coach-status-events.js');
    const core = await import('../js/core.js');
    core.setPlayers([
      { name: 'Bowie', archetype: 'hero', stats: { physical:5,endurance:5,mental:5,social:8,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 } },
      { name: 'Ana', archetype: 'underdog', stats: { physical:5,endurance:5,mental:3,social:5,strategic:2,loyalty:8,boldness:2,intuition:2,temperament:5 } },
      { name: 'Bo', archetype: 'villain', stats: { physical:5,endurance:5,mental:8,social:5,strategic:9,loyalty:2,boldness:9,intuition:8,temperament:5 } },
    ]);
    core.setGs({ ...core.gs, coaches: [], coachTraining: {}, bonds: {}, advantages: [],
      tribes: [{ name: 'Red', members: ['Ana', 'Bo'] }], episode: 5 });
    const { addCoach } = await import('../js/coaches.js');
    addCoach({ name: 'Bowie', tribe: 'Red', stars: 5 });

    // Deterministic, and the SECOND call is the weighted pin — sweep it across
    // the whole range or every iteration lands in the same bucket.
    const seenTypes = new Set();
    for (let k = 0; k < 80; k++) {
      let n = 0;
      const roll = () => { const v = (0.011 + k * 0.0123 + n * 0.37) % 1; n++; return v; };
      coachStatusEvents({ num: 5 }, { name: 'Red', members: ['Ana', 'Bo'] }, roll)
        .forEach(e => seenTypes.add(e.type));
    }
    expect(seenTypes.size, 'the weighted picker only ever reaches one beat').toBeGreaterThan(1);
  });
});

// A coach could be the unanimous target of a tribal and never say one word
// about it: every confessional source draws from voting blocs and a coach is
// in none of them. And the lookup has to come from the EPISODE — `coachesOf`
// filters on !promoted, so replaying any episode after the merge finds no
// coaches at all and renders a past tribal as though none had been there.
describe('coaches speak at their own tribal', () => {
  it('gives the hunted coach and the lobbying coach a confessional', async () => {
    const core = await import('../js/core.js');
    const vp = await import('../js/vp-screens.js');
    let targeted = 0, lobby = 0;
    for (let r = 0; r < 2 && targeted === 0; r++) {
      const { episodes } = await runHeadlessSeason({
        twist: 'coaches', coachesPerTribe: 2, castSize: 16, mergeAt: 10,
      });
      for (const e of episodes) {
        const hist = core.gs.episodeHistory.find(h => h.num === e.num);
        if (!hist) continue;
        let html = '';
        try { html = vp.rpBuildVotingPlans(hist) || ''; } catch { continue; }
        if (html.includes('Coach · targeted')) targeted++;
        if (html.includes('Coach · no vote')) lobby++;
      }
    }
    expect(targeted + lobby,
      'no coach said anything at any tribal across two seasons').toBeGreaterThan(0);
  }, 900000);
});

// The card decides a life at tribal and the camp screen is the only place a
// viewer can learn whether it is still out there — exactly the job the idol
// line does two rows above it.
describe('the save card is tracked where the idol is tracked', () => {
  it('reports a held card, and a spent one, in the camp advantage panel', async () => {
    const vp = await import('../js/vp-screens.js');
    const held = vp.getTribeAdvantageStatus('Red', false, [], ['A', 'B'], { Julia: 'unused' });
    expect(held.join(' ')).toContain("Julia still holds a Coach's Save Card");
    expect(held.join(' '), 'the rule has to travel with the status').toContain('every other coach on the tribe signs it');

    const spent = vp.getTribeAdvantageStatus('Red', false, [], ['A', 'B'], { Julia: 'used' });
    expect(spent.join(' ')).toContain('has been spent');
    expect(spent.join(' ')).toContain('nothing standing between Julia and the next vote');
  });

  it('says nothing at all when the season has no coaches', async () => {
    const vp = await import('../js/vp-screens.js');
    const lines = vp.getTribeAdvantageStatus('Red', false, [], ['A', 'B'], null);
    expect(lines.some(l => l.includes('Save Card'))).toBe(false);
  });

  it('is read from the episode snapshot, so a replay shows that night', async () => {
    // 'used' today must not overwrite the 'unused' the episode recorded.
    const vp = await import('../js/vp-screens.js');
    const core = await import('../js/core.js');
    core.setGs({ ...core.gs, coaches: [{ name: 'Julia', tribe: 'Red', saveCard: 'used', promoted: false }] });
    const lines = vp.getTribeAdvantageStatus('Red', false, [], ['A', 'B'], { Julia: 'unused' });
    expect(lines.join(' '), 'live gs leaked into a historical camp').toContain('still holds');
  });
});
