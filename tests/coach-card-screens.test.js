// ══════════════════════════════════════════════════════════════════════
// coach-card-screens.test.js — the card that fired and was never shown
// ══════════════════════════════════════════════════════════════════════
//
// Reported, reading a live season's own record: two cards sealed on episode 9
// and two coaches saved by them — "oh theres just no signatures screen".
//
// The viewer has two branches for a night with a vote. The ordinary one builds
// Tribal, then The Signatures, then The Votes. The multi-tribal one builds a
// Tribal and a Votes screen PER TRIBE and was written without the card: the
// screen was only ever pushed on the other branch. So on a three-tribe night
// the card committed, spent itself, saved a coach and named a replacement, and
// the viewer was told none of it — which is indistinguishable, from the sofa,
// from the mechanic not working at all. That is the bug class this repo keeps
// hitting: a system that runs and reaches no screen.
//
// The cards are also scoped per tribe here. Every record carries the tribe it
// belongs to, so Green's council does not show Blue's save.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
// Imported for its side effect: it puts every simulator module's exports on
// `window`, which is what js/main.js does in the browser and what the screen
// builders read. Chasing them one import at a time is a losing game.
import './helpers/coach-season.js';
import * as vpScreensMod from '../js/vp-screens.js';
import * as vpFinaleMod from '../js/vp-finale.js';


// the two screen modules the harness does not wire (it exists for engine tests)
for (const m of [vpScreensMod, vpFinaleMod]) {
  for (const [k, v] of Object.entries(m)) { try { globalThis[k] = v; } catch { /* live binding */ } }
}
import { seedGame } from './helpers/setup.js';

const NAMES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: 'floater' }));

/** A three-tribe night: Green and Blue each vote, and each has a coach with a card. */
function multiTribalEpisode() {
  seedGame(CAST, { episode: 9, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig });
  gs.tribes = [
    { name: 'Green', members: ['P1', 'P2', 'P3', 'P4'] },
    { name: 'Blue', members: ['P5', 'P6', 'P7', 'P8'] },
    { name: 'Red', members: ['P9', 'P10', 'P11', 'P12'] },
  ];
  gs.coaches = [{ name: 'Julia', tribe: 'Green', promoted: false, sessionsPerEp: 2, stars: 4.5 },
    { name: 'Bowie', tribe: 'Blue', promoted: false, sessionsPerEp: 2, stars: 4.5 }];

  const tribeResult = (tribe, members, coach, eliminated) => ({
    tribe, tribalPlayers: members, votes: { [eliminated]: 3 },
    log: members.map(v => ({ voter: v, voted: eliminated })),
    alliances: [], eliminated, isTie: false, tiedPlayers: [], idolPlays: [],
  });

  return {
    num: 9, challengeType: 'multi-tribal', isMultiTribal: true,
    campEvents: {}, idolPlays: [], idolFinds: [], idolMisplays: [],
    multiTribalResults: [
      tribeResult('Green', ['P1', 'P2', 'P3', 'P4'], 'Julia', 'P2'),
      tribeResult('Blue', ['P5', 'P6', 'P7', 'P8'], 'Bowie', 'P6'),
    ],
    multiTribalElims: ['P2', 'P6'],
    coachCardCommits: [
      { tribe: 'Green', calledBy: 'Julia', coach: 'Julia', covers: ['Julia'], votes: [], signed: true, refusedBy: null },
      { tribe: 'Blue', calledBy: 'Bowie', coach: 'Bowie', covers: ['Bowie'], votes: [], signed: true, refusedBy: null },
    ],
    coachSaves: [
      { coach: 'Julia', tribe: 'Green', calledBy: 'Julia', replacement: 'P2', votes: [] },
      { coach: 'Bowie', tribe: 'Blue', calledBy: 'Bowie', replacement: 'P6', votes: [] },
    ],
    coachCardNotPlayed: [], coachSaveRefusals: [],
  };
}

let screens;
// buildVPScreens fills the module's exported `vpScreens` rather than returning
// it on this path, so read it from the module after the call.
beforeEach(() => { vpScreensMod.buildVPScreens(multiTribalEpisode()); screens = vpScreensMod.vpScreens; });

const ids = () => screens.map(s => s.id);
const htmlOf = id => screens.find(s => s.id === id)?.html || '';

describe('the save card on a multi-tribal night', () => {
  it('gets a Signatures screen for each tribe that sealed one', () => {
    expect(ids()).toContain('cb-sigs-Green');
    expect(ids()).toContain('cb-sigs-Blue');
  });

  it('reads the signatures before that tribe reads its votes', () => {
    const order = ids();
    expect(order.indexOf('cb-sigs-Green')).toBeGreaterThan(order.indexOf('tribal-Green'));
    expect(order.indexOf('cb-sigs-Green')).toBeLessThan(order.indexOf('votes-Green'));
  });

  it('shows each council its own card and not the other tribe\'s', () => {
    expect(htmlOf('cb-sigs-Green')).toContain('Julia');
    expect(htmlOf('cb-sigs-Green')).not.toContain('Bowie');
    expect(htmlOf('votes-Green')).toContain('Julia');
    expect(htmlOf('votes-Green')).not.toContain('Bowie');
  });

  it('says on the votes screen that the card was used', () => {
    expect(htmlOf('votes-Green')).toContain("COACH'S SAVE CARD");
    // and who goes instead — the card is never free
    expect(htmlOf('votes-Green')).toContain('P2');
  });
});
