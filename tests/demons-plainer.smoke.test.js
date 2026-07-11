// Smoke test: Demon's Plainer runs cleanly in all three schedule-adaptive modes
// and produces valid win-condition + VP data.
import { describe, it, expect, beforeEach } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { setGs } from '../js/core.js';
import { gs, seasonConfig } from '../js/core.js';
import { simulateDemonsPlainer } from '../js/chal/demons-plainer.js';
import { rpBuildDemonsPlainerTitle, rpBuildDemonsPlainerShelter, rpBuildDemonsPlainerCoaster, rpBuildDemonsPlainerResults } from '../js/chal/demons-plainer-vp.js';
import { _textDemonsPlainer } from '../js/chal/demons-plainer.js';

const CAST = [
  { name: 'Alessio', archetype: 'chaos-agent' }, { name: 'Marissa', archetype: 'hero' },
  { name: 'Isabel', archetype: 'social-butterfly' }, { name: 'Ted', archetype: 'wildcard' },
  { name: 'Amelie', archetype: 'villain' }, { name: 'Diego', archetype: 'loyal-soldier' },
  { name: 'Spencer', archetype: 'mastermind' }, { name: 'Hannah', archetype: 'floater' },
  { name: 'Benji', archetype: 'underdog' }, { name: 'Jade', archetype: 'perceptive-player' },
];
const BLUE = ['Alessio', 'Marissa', 'Isabel', 'Ted', 'Amelie'];
const RED = ['Diego', 'Spencer', 'Hannah', 'Benji', 'Jade'];

function preMergeSetup(episodeHistory) {
  seedGame(CAST, {
    isMerged: false, phase: 'pre-merge', episode: 1,
    episodeHistory,
    tribes: [
      { name: 'Blue Team', color: '#3a7bd6', members: [...BLUE] },
      { name: 'Red Team', color: '#e0342b', members: [...RED] },
    ],
    survival: {}, popularity: {},
  });
}
function postMergeSetup() {
  seedGame(CAST, {
    isMerged: true, phase: 'merge', episode: 8,
    episodeHistory: new Array(7).fill({}),
    tribes: [{ name: 'Merge', color: '#888', members: [...BLUE, ...RED] }],
    survival: {}, popularity: {},
  });
}

function runText(ep) {
  const out = [];
  _textDemonsPlainer(ep, (s) => out.push(s), (h) => out.push('## ' + h));
  return out.join('\n');
}

describe("Demon's Plainer — schedule-adaptive", () => {
  beforeEach(() => { seasonConfig.romance = true; });

  it('EPISODE 1: runs shelter + coaster, tribe wins immunity (no individual)', () => {
    preMergeSetup([]); // length 0 => ep1
    // reproduce the real episode: ep.campEvents is already a per-tribe {pre,post} object
    const ep = { num: 1, campEvents: { 'Blue Team': { pre: [], post: [] }, 'Red Team': { pre: [], post: [] } } };
    simulateDemonsPlainer(ep);
    // camp events must remain a keyed object (not clobbered into an array) and stay injectable
    expect(Array.isArray(ep.campEvents)).toBe(false);
    expect(ep.campEvents['Blue Team'].pre).toBeInstanceOf(Array);
    const dp = ep.demonsPlainer;
    expect(dp.mode).toBe('ep1');
    expect(dp.shelter).toBeTruthy();
    expect(dp.shelter.tribeData.length).toBe(2);
    // shelter awarded a tarp winner
    expect(dp.shelter.winner).toBeTruthy();
    // pre-merge: tribe winner/loser set, NO individual immunity
    expect(ep.immunityWinner).toBeFalsy();
    expect(ep.winner).toBeTruthy();
    expect(ep.loser).toBeTruthy();
    expect(ep.winner.name).not.toBe(ep.loser.name);
    expect(ep.tribalPlayers.length).toBe(ep.loser.members.length);
    // every active player has a numeric score
    Object.values(ep.chalMemberScores).forEach(v => expect(Number.isFinite(v)).toBe(true));
    // VP + text render without throwing
    expect(rpBuildDemonsPlainerTitle(ep)).toContain('DEMON');
    expect(rpBuildDemonsPlainerShelter(ep)).toContain('Shelter');
    expect(rpBuildDemonsPlainerCoaster(ep)).toContain('Plainer');
    expect(rpBuildDemonsPlainerResults(ep).length).toBeGreaterThan(50);
    expect(runText(ep)).toContain('SHELTER SCRAMBLE');
  });

  it('PRE-MERGE (not ep1): coaster only, no shelter', () => {
    preMergeSetup([{}, {}]); // length 2 => not ep1
    const ep = { num: 3 };
    simulateDemonsPlainer(ep);
    const dp = ep.demonsPlainer;
    expect(dp.mode).toBe('premerge');
    expect(dp.shelter).toBeNull();
    expect(ep.immunityWinner).toBeFalsy();
    expect(ep.winner.name).not.toBe(ep.loser.name);
    // shelter VP screen is skipped in this mode
    expect(rpBuildDemonsPlainerShelter(ep)).toBe('');
    // coaster ride cards are grouped by team (both tribe headers present)
    const coasterHtml = rpBuildDemonsPlainerCoaster(ep);
    expect(coasterHtml).toContain('Blue Team');
    expect(coasterHtml).toContain('Red Team');
    expect(coasterHtml).toContain('SORTS:');
    expect(runText(ep)).not.toContain('SHELTER SCRAMBLE');
    expect(runText(ep)).toContain("DEMON'S PLAINER");
  });

  it('POST-MERGE: coaster only, individual immunity', () => {
    postMergeSetup();
    const ep = { num: 8 };
    simulateDemonsPlainer(ep);
    const dp = ep.demonsPlainer;
    expect(dp.mode).toBe('postmerge');
    expect(dp.shelter).toBeNull();
    // individual immunity winner is an active player
    expect(dp.immunityWinner).toBeTruthy();
    expect(ep.immunityWinner).toBe(dp.immunityWinner);
    expect([...BLUE, ...RED]).toContain(ep.immunityWinner);
    expect(ep.tribalPlayers.length).toBe(10);
    // winner is the top scorer
    const top = ep.chalPlacements[0];
    expect(top).toBe(ep.immunityWinner);
    expect(rpBuildDemonsPlainerResults(ep)).toContain('IMMUNITY');
  });

  it('shelter adapts to the season venue (no carnival props leak in a plane season)', () => {
    seasonConfig.setting = 'world-tour';
    preMergeSetup([]); // ep1 with shelter
    const ep = { num: 1, campEvents: { 'Blue Team': { pre: [], post: [] }, 'Red Team': { pre: [], post: [] } } };
    simulateDemonsPlainer(ep);
    const allText = ep.demonsPlainer.shelter.tribeData
      .flatMap(t => t.events.map(e => e.text))
      .concat(ep.demonsPlainer.shelter.introText)
      .join(' \n ');
    // carnival-locked props must NOT appear in a world-tour shelter
    expect(allText).not.toMatch(/carnival|midway|Ferris.wheel|carousel|ride booth|fun ?house|dead ride|ticket-booth|cotton candy/i);
    // and the clumsy phrasing is gone everywhere
    expect(allText).not.toMatch(/owl explodes/i);
    seasonConfig.setting = undefined; // reset for other tests
  });

  it('shelter uses carnival props when the venue IS a carnival', () => {
    seasonConfig.setting = 'carnival';
    let hitCarnival = false;
    // run several times; the venue-locked beats are randomly selected
    for (let i = 0; i < 40 && !hitCarnival; i++) {
      preMergeSetup([]);
      const ep = { num: 1, campEvents: { 'Blue Team': { pre: [], post: [] }, 'Red Team': { pre: [], post: [] } } };
      simulateDemonsPlainer(ep);
      const txt = ep.demonsPlainer.shelter.tribeData.flatMap(t => t.events.map(e => e.text)).join(' ');
      if (/Ferris-wheel|carousel|ride booth|funhouse|carnival|ticket-booth/i.test(txt)) hitCarnival = true;
    }
    expect(hitCarnival).toBe(true);
    seasonConfig.setting = undefined;
  });

  it('flag order has 6 distinct colors', () => {
    postMergeSetup();
    const ep = { num: 8 };
    simulateDemonsPlainer(ep);
    const flags = ep.demonsPlainer.flagOrder;
    expect(flags.length).toBe(6);
    expect(new Set(flags).size).toBe(6);
  });
});
