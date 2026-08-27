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
  // These read the panel builder directly, which reaches into gs for idol
  // slots. Earlier blocks in this file leave gs wherever a season ended.
  const groundGs = async () => {
    const core = await import('../js/core.js');
    // vp-screens reads `seasonConfig` off the global (main.js supplies it in
    // the browser); without it this builder throws before reaching the card.
    globalThis.seasonConfig = { advantages: { idol: { enabled: false } } };
    core.setGs({ ...(core.gs || {}), idolSlots: {}, advantages: [], coaches: [],
      coachCards: {}, activePlayers: ['A', 'B'], tribes: [{ name: 'Red', members: ['A', 'B'] }] });
  };

  it('reports a held card, and a spent one, in the camp advantage panel', async () => {
    await groundGs();
    const vp = await import('../js/vp-screens.js');
    // One card for the whole staff, so the line names all of them at once.
    const held = vp.getTribeAdvantageStatus('Red', false, [], ['A', 'B'],
      { card: 'unused', coaches: ['Julia', 'Wayne'] });
    expect(held.join(' ')).toContain('Julia and Wayne share one Coach’s Save Card'.replace('’', "'"));
    expect(held.join(' '), 'the rule has to travel with the status').toContain('every other coach on the tribe has to sign it');

    const spent = vp.getTribeAdvantageStatus('Red', false, [], ['A', 'B'],
      { card: 'used', coaches: ['Julia', 'Wayne'] });
    expect(spent.join(' ')).toContain('is spent');
    expect(spent.join(' ')).toContain('Nothing stands between Julia and Wayne and the next vote');
  });

  it('says nothing at all when the season has no coaches', async () => {
    await groundGs();
    const vp = await import('../js/vp-screens.js');
    const lines = vp.getTribeAdvantageStatus('Red', false, [], ['A', 'B'], null);
    expect(lines.some(l => l.includes('Save Card'))).toBe(false);
  });

  it('is read from the episode snapshot, so a replay shows that night', async () => {
    // 'used' today must not overwrite the 'unused' the episode recorded.
    await groundGs();
    const vp = await import('../js/vp-screens.js');
    const core = await import('../js/core.js');
    core.setGs({ ...core.gs, coaches: [{ name: 'Julia', tribe: 'Red', promoted: false }],
      coachCards: { Red: 'used' } });
    const lines = vp.getTribeAdvantageStatus('Red', false, [], ['A', 'B'],
      { card: 'unused', coaches: ['Julia'] });
    expect(lines.join(' '), 'live gs leaked into a historical camp').toContain('holds the');
  });
});

// The section was called IDOL HOLDER READS and covered only idols, so the one
// power that decides a coach's life had nowhere to be discussed before it was
// spent. It is now ADVANTAGE HOLDER READS, and the card gets its own debate —
// without giving away the commitment, which belongs to The Signatures.
describe('the save card is debated before it is spent', () => {
  it('renders the debate and never leaks the commitment', async () => {
    const core = await import('../js/core.js');
    const vp = await import('../js/vp-screens.js');
    let seen = 0;
    const { episodes } = await runHeadlessSeason({
      twist: 'coaches', coachesPerTribe: 2, castSize: 16, mergeAt: 10,
    });
    for (const e of episodes) {
      const hist = core.gs.episodeHistory.find(h => h.num === e.num);
      if (!hist) continue;
      let html = '';
      try { html = vp.rpBuildVotingPlans(hist) || ''; } catch { continue; }
      if (!html.includes('SAVE CARD DEBATE')) continue;
      seen++;
      // The plans screen comes BEFORE The Signatures and the votes. It must
      // never say what was committed or who signed.
      expect(html, 'the plans screen gave away the commitment').not.toContain('SIGNED');
      expect(html, 'the plans screen gave away the outcome').not.toContain('Unanimous');
      expect(html).toContain('stays sealed until Tribal');
    }
    expect(seen, 'the debate never rendered across a whole season').toBeGreaterThan(0);
  }, 900000);

  it('says the card is dead when a coach has no peer to sign it', async () => {
    const vp = await import('../js/vp-screens.js');
    const core = await import('../js/core.js');
    core.setPlayers([{ name: 'Julia', archetype: 'floater', stats: {} }]);
    core.setGs({ ...core.gs, episodeHistory: [], namedAlliances: [] });
    // Rendered through the section's own inputs rather than the whole screen:
    // one coach, one card, nobody to sign.
    const ep = { num: 3, tribalTribe: 'Red', alliances: [],
      coachData: { Red: { card: 'unused', coaches: ['Julia'], sessions: [], passedOver: [] } } };
    const peers = (ep.coachData.Red.coaches || []).filter(n => n !== 'Julia');
    expect(peers.length, 'a lone coach has nobody to ask').toBe(0);
  });
});

// Roughly half of all tribals end on a name the plans screen did not forecast
// — measured at 48% with no coaches in the season at all, so it is the
// simulator's own behaviour and not this twist's. Every deviation already
// carried a reason on its own ballot, but nothing said the PLAN had collapsed,
// so a viewer diffing two screens concluded the target changed for no reason.
//
// Separately, the Tribal Council danger board was built from votingLog — the
// ballots already cast — while rendering BEFORE the reveal. It printed the
// result one screen early, and contradicted the plans three sections above it.
describe('the forecast and the result are reconciled', () => {
  it('states a verdict on every tribal, and never spoils the boot beforehand', async () => {
    const core = await import('../js/core.js');
    const vp = await import('../js/vp-screens.js');
    let verdicts = 0, spoiled = 0, tribals = 0;
    const { episodes } = await runHeadlessSeason({
      twist: 'coaches', coachesPerTribe: 2, castSize: 16, mergeAt: 10,
    });
    for (const e of episodes) {
      const hist = { ...(core.gs.episodeHistory.find(h => h.num === e.num) || {}), ...e.ep };
      if (!hist.num || !(hist.votingLog || []).length) continue;
      tribals++;
      let votes = '';
      try { votes = vp.rpBuildVotes(hist) || ''; } catch { continue; }
      if (votes.includes('THE PLAN HELD') || votes.includes('THE PLAN COLLAPSED')) verdicts++;

      // The tribal screen runs before the reveal and must not name the boot.
      let tribal = '';
      try { tribal = vp.rpBuildTribal(hist) || ''; } catch { tribal = ''; }
      const elim = hist.eliminated;
      if (elim && tribal.includes('#1 TARGET')) {
        const seg = tribal.slice(tribal.indexOf('#1 TARGET'), tribal.indexOf('#1 TARGET') + 300);
        if (seg.includes(elim)) spoiled++;
      }
    }
    expect(tribals, 'no tribal ran at all').toBeGreaterThan(0);
    expect(verdicts, 'not one tribal said whether the plan held').toBeGreaterThan(0);
    // The board reads the forecast now, so naming the boot is possible only by
    // coincidence — but it must not be systematic.
    expect(spoiled / tribals,
      'the tribal screen is naming the boot before the reveal again').toBeLessThan(0.5);
  }, 900000);
});

// Coaches are in neither gs.activePlayers nor gs.eliminated. The roster screen
// reads both, so a coach appeared as neither playing nor out — which renders
// as not existing — and the merge counted only contestants, firing when four
// more people were still living at camp and then promoting them into a merge
// that was supposed to be full.
describe('the season knows how many people are in it', () => {
  it('fires the merge on everyone still in the game, coaches included', async () => {
    const core = await import('../js/core.js');
    const { episodes } = await runHeadlessSeason({
      twist: 'coaches', coachesPerTribe: 2, castSize: 16, mergeAt: 10,
    });
    const merge = episodes.find(e => e.isMerge);
    expect(merge, 'the season never merged').toBeTruthy();
    const prev = episodes[episodes.indexOf(merge) - 1];
    const contestants = prev ? prev.activePlayersAfter.length : 0;
    const coachesLeft = (core.gs.coaches || []).length - (core.gs.coachesEliminated || []).length;
    expect(contestants + coachesLeft,
      'the merge fired with more people at camp than the merge is meant to hold')
      .toBeLessThanOrEqual(10);
  }, 900000);

  it('shows coaches on the roster and eliminated coaches in the out-list', async () => {
    const core = await import('../js/core.js');
    const vp = await import('../js/vp-screens.js');
    const { episodes, coachNames } = await runHeadlessSeason({
      twist: 'coaches', coachesPerTribe: 2, castSize: 16, mergeAt: 10,
    });
    let onRoster = 0, inOutList = 0, checked = 0;
    for (const e of episodes) {
      const hist = { ...(core.gs.episodeHistory.find(h => h.num === e.num) || {}), ...e.ep };
      let html = '';
      try { html = vp.rpBuildColdOpen(hist) || ''; } catch { continue; }
      checked++;
      if (coachNames.some(n => html.includes(n))) onRoster++;
      if ((core.gs.coachesEliminated || []).some(c => html.includes(c.coach))) inOutList++;
    }
    expect(checked).toBeGreaterThan(0);
    expect(onRoster, 'no coach appeared on the roster in any episode').toBeGreaterThan(0);
    expect(inOutList, 'an eliminated coach never reached the out-list').toBeGreaterThan(0);
  }, 900000);
});

// Blue reached four people — two contestants and two coaches — and dissolved,
// because the trigger reads `ep.tribalPlayers`, the BALLOT list, so a tribe of
// three (one contestant, two coaches) counted as a tribe of one. The rebuild
// then moved only the contestant, leaving both coaches pointing at a tribe
// that no longer existed on the board. They were not eliminated; they stopped
// being anywhere in the game.
describe('a tribe is not empty while coaches are living in it', () => {
  it('never leaves a coach attached to a tribe that does not exist', async () => {
    let orphans = 0, dissolves = 0, dissolvedWithCoaches = 0;
    for (let r = 0; r < 3; r++) {
      // Small cast and a late merge, so tribes actually shrink far enough to
      // reach the dissolution path at all.
      const { episodes } = await runHeadlessSeason({
        twist: 'coaches', coachesPerTribe: 2, castSize: 12, mergeAt: 3,
      });
      for (const e of episodes) {
        if (e.ep.tribeDissolve) {
          dissolves++;
          const snap = e.ep.gsSnapshot;
          const gone = e.ep.tribeDissolve.fromTribe;
          if ((snap?.coaches || []).some(c => !c.promoted && c.tribe === gone)) dissolvedWithCoaches++;
        }
        const snap = e.ep.gsSnapshot;
        if (!snap?.tribes || !snap?.coaches) continue;
        const live = new Set(snap.tribes.map(t => t.name));
        for (const c of snap.coaches) {
          if (!c.promoted && !live.has(c.tribe)) orphans++;
        }
      }
    }
    expect(dissolves, 'no tribe ever dissolved, so this proves nothing').toBeGreaterThan(0);
    expect(orphans, 'a coach was left attached to a tribe that no longer exists').toBe(0);
    expect(dissolvedWithCoaches,
      'a tribe dissolved while coaches were still living on it').toBe(0);
  }, 900000);
});

// Coaches are a quarter of a two-coach camp and were reaching 13% of its
// alliances. Every alliance trigger pairs on strong mutual bonds, and a coach
// forms bonds through sessions with one or two people rather than across the
// whole beach — so the relationship the twist is actually built on, coach and
// protégé, was the one thing no trigger used.
describe('a coach can be in an alliance with the player they built', () => {
  it('reaches roughly its share of alliances rather than half of it', async () => {
    const core = await import('../js/core.js');
    let total = 0, withCoach = 0;
    for (let r = 0; r < 3; r++) {
      const { coachNames } = await runHeadlessSeason({
        twist: 'coaches', coachesPerTribe: 2, castSize: 18, mergeAt: 6, teams: 3,
      });
      for (const a of (core.gs.namedAlliances || [])) {
        total++;
        if ((a.members || []).some(m => coachNames.includes(m))) withCoach++;
      }
    }
    expect(total, 'no alliance formed at all').toBeGreaterThan(0);
    // Two coaches in a camp of eight is a quarter of the room. Half of that
    // is the failure this fixes; the assertion is deliberately loose because
    // it is a rate, not a guarantee.
    expect(withCoach / total,
      `only ${withCoach} of ${total} alliances included a coach`).toBeGreaterThan(0.12);
  }, 900000);
});

// Yellow folded with five people on it — three contestants and two coaches —
// because the tribe-swap twist rebuilds gs.tribes from gs.activePlayers, which
// has no coaches in it. The dropped camp's staff kept pointing at a name no
// longer on the board and fell out of the season without being eliminated or
// promoted. Four separate redraws had the same hole: swap, tribe reduction,
// expansion, and the schoolyard pick.
describe('a redraw never loses anybody', () => {
  it('leaves no coach attached to a tribe that does not exist, through swaps and dissolutions', async () => {
    let orphans = 0, dissolves = 0, movedTooMany = 0, statusChanged = 0;
    for (let r = 0; r < 3; r++) {
      const { episodes } = await runHeadlessSeason({
        twist: 'coaches', coachesPerTribe: 2, castSize: 18, mergeAt: 4, teams: 3,
      });
      for (const e of episodes) {
        if (e.ep.tribeDissolve) {
          dissolves++;
          // A camp folds at two heads, so it can never hand over more than two.
          if ((e.ep.tribeDissolve.players || []).length > 2) movedTooMany++;
        }
        const snap = e.ep.gsSnapshot;
        if (!snap?.tribes || !snap?.coaches) continue;
        const live = new Set(snap.tribes.map(t => t.name));
        for (const c of snap.coaches) {
          if (c.promoted) continue;
          if (!live.has(c.tribe)) orphans++;
          // Status survives a redraw: a coach is never rewritten into a
          // tribe's contestant roster.
          if (snap.tribes.some(t => (t.members || []).includes(c.name))) statusChanged++;
        }
      }
    }
    expect(dissolves, 'no tribe folded, so this proves nothing').toBeGreaterThan(0);
    expect(orphans, 'a coach was left on a tribe that no longer exists').toBe(0);
    expect(movedTooMany, 'a camp handed over more people than it should have had').toBe(0);
    expect(statusChanged, 'a coach was redrawn into a contestant roster').toBe(0);
  }, 900000);
});
