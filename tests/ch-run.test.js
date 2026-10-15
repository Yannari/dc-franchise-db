// ch-run.test.js — The Challenge is REACHABLE from the run tab. Every guard here
// is on the path the run tab takes: the flag, the queue, a reload, a re-run,
// what the hub says, what the screens print, and what the franchise keeps.
import { describe, expect, it } from 'vitest';
import { gs, setGs, players, setPlayers, seasonConfig, formatIsRunnable } from '../js/core.js';
import { isChallengeSeason, simulateChallengeEpisode, challengeEpisodesLeft, challengeCastProblem,
  lastChallengeRefusal, challengeCanRerun, rerunChallengeEpisode, challengeSeasonShape, challengeBackground,
  challengeEpisodeMap, challengeBilling, challengeDivisions } from '../js/ch-run.js';
import { setFranchiseLedger, activeSeasons, seasonKey } from '../js/franchise-meta.js';
import { getEpisodeEliminations, buildHubAftermath } from '../js/run-ui.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { episodeScenes } from '../js/ch/transcript.js';
import { challengeCast } from './helpers/ch-cast.js';

function freshSeason(n = 16, extra = {}, { ledger = true, seasonNumber = 1, castSeed = 3 } = {}) {
  Object.assign(seasonConfig, { format: 'the-challenge', seasonNumber, chSetup: {}, chFinalists: 6,
    chGenderBlind: false, twistSchedule: [], name: null, ...extra });
  setPlayers(challengeCast(n, castSeed).cast);
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ch: { seed: 909 }, seasonNumber });
  // A finished season writes the franchise ledger; each test starts from an empty one.
  if (ledger) setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
}
function playAll() {
  const aired = [];
  for (let i = 0; i < 40; i++) { const row = simulateChallengeEpisode(); if (!row) break; aired.push(row); }
  return aired;
}

describe('The Challenge can be started', () => {
  it('importing ch-run IS the wiring: the flag is set and the show reads as runnable', () => {
    expect(window._chRunnable).toBe(true);
    expect(formatIsRunnable({ format: 'the-challenge' })).toBe(true);
    freshSeason();
    expect(isChallengeSeason()).toBe(true);
  });

  it('refuses a cast too small for its final, and says why', () => {
    freshSeason(6);
    expect(challengeCastProblem()).toMatch(/more players than finalists/);
    expect(simulateChallengeEpisode()).toBe(null);
    expect(lastChallengeRefusal()).toMatch(/finalists/);
  });
});

describe('a season plays one episode per press', () => {
  it('airs every episode and the final, then stops, and names the champions', () => {
    freshSeason();
    const shape = challengeSeasonShape();
    const aired = playAll();
    expect(aired.length).toBeLessThanOrEqual(shape.length);
    expect(aired.map(r => r.num)).toEqual(aired.map((_, i) => i + 1));
    expect(aired.at(-1).ch.final.champions.length).toBe(2);
    expect(challengeEpisodesLeft()).toBe(0);
    expect(gs.phase).toBe('complete');
    expect(gs.chChampions).toEqual(aired.at(-1).ch.final.champions);
    // What is saved is rows, never the engine's state.
    expect(JSON.stringify(gs).length).toBeLessThan(6_000_000);
    expect(gs.ch.state).toBeUndefined();
    // The timeline shows the episodes the season played.
    expect(challengeEpisodeMap().map(t => t.ep)).toEqual(shape.map(d => d.ep));
  });

  it('a queue lost to a reload rebuilds the SAME season and keeps what aired', () => {
    freshSeason();
    const first = [simulateChallengeEpisode(), simulateChallengeEpisode()];
    delete gs._chQueue;
    const next = simulateChallengeEpisode();
    expect(next.num).toBe(3);
    freshSeason();
    const whole = playAll();
    expect(JSON.stringify(whole[2].exits)).toBe(JSON.stringify(next.exits));
    expect(first.map(r => r.num)).toEqual([1, 2]);
  });
});

describe('the site knows who left, and how', () => {
  it('an episode row names who left; the hub says it was the Arena, not the vote', () => {
    freshSeason();
    const aired = playAll();
    const ep = aired.find(r => r.ch.arena?.length);
    const duel = ep.ch.arena[0];
    expect(getEpisodeEliminations(ep)).toContain(duel.loser);
    // the one the house voted in made the call-out, and fought in that duel
    expect(ep.ch.votedIn).toContain(ep.ch.callouts[0].by);
    expect([duel.winner, duel.loser]).toContain(ep.ch.callouts[0].by);
    const hub = buildHubAftermath(ep);
    expect(hub.why).toMatch(new RegExp(`${duel.loser} was eliminated by ${duel.winner} in the Arena`));
    // never the default sentence, which would say the most-voted player went home
    expect(hub.why).not.toMatch(/highest valid total/);
    expect(hub.voteShape).toMatch(/ beat /);
    // the final names its champions
    expect(buildHubAftermath(aired.at(-1)).why).toMatch(/won the final/);
    // every door has its own verb: nobody who quit "was eliminated"
    for (const r of aired) for (const x of r.exits) if (x.channel === 'quit') expect(x.verb).toBe('quit');
  });
});

describe('the screens and the text backlog say the same thing', () => {
  it('big moments get a screen, villa life between them is one, and the backlog prints the same lines', () => {
    freshSeason();
    const aired = playAll();
    for (const r of [aired[0], aired.at(-1)]) {
      const scenes = episodeScenes(r);
      expect(scenes.length).toBeGreaterThan(3);
      const screens = buildVPScreens(r);
      const html = screens.map(s => s.html).join('');
      const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      for (const s of scenes) for (const l of s.lines) expect(html, l.text).toContain(esc(l.text));
      // Big Brother's House Life rule: never two Villa Life screens in a row in one section.
      for (let i = 1; i < screens.length; i++) {
        const same = screens[i].id.split('-')[1] === screens[i - 1].id.split('-')[1];
        if (same) expect(screens[i].label === 'Villa Life' && screens[i - 1].label === 'Villa Life', `ep ${r.num} screen ${i}`).toBe(false);
      }
      for (const k of ['daily', 'ceremony', 'callout', 'arena']) {
        if (scenes.some(s => s.kind === k)) expect(screens.some(sc => sc.label === scenes.find(s => s.kind === k).title), k).toBe(true);
      }
      if (!r.ch.final) expect(screens.length).toBeLessThan(scenes.length);
      const text = generateSummaryText(r);
      for (const s of scenes) for (const l of s.lines) expect(text).toContain(l.text);
      expect(text).not.toMatch(/undefined|\{\w+\}/);
    }
  });

  it('every screen sits in one of the show\'s own sections, never Total Drama\'s Camp, and no title gives the ending away', async () => {
    // jsdom has no matchMedia; the viewer asks it about motion at import.
    window.matchMedia ||= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
    const { _vpPhaseForScreen } = await import('../js/vp-ui.js');
    freshSeason();
    const aired = playAll();
    const labels = new Set();
    for (const r of aired) for (const sc of buildVPScreens(r)) {
      const phase = _vpPhaseForScreen(sc.id);
      expect(phase.id, `${sc.id} in ep ${r.num}`).not.toBe('camp');
      labels.add(phase.label);
      // The list is on screen before the scene is watched.
      expect(sc.label, sc.id).not.toMatch(/\b(quits?|breakup|champions?|eliminat\w*|disqualif\w*|medical|wins?|won|lost)\b/i);
    }
    expect([...labels]).toEqual(expect.arrayContaining(['Previously', 'Day 1 · The Daily', 'Day 2 · The Vote', 'Day 3 · The Arena', 'The Final']));
  });
});

describe('re-running an episode', () => {
  it('keeps every earlier episode and plays the chosen one again', () => {
    freshSeason();
    const aired = playAll();
    expect(challengeCanRerun()).toBe(true);
    const before = JSON.stringify(aired.slice(0, 2).map(r => r.exits));
    // Episodes re-dealt until one comes out different: a re-run is a new roll, not a re-air.
    let differs = false;
    for (let k = 0; k < 6 && !differs; k++) {
      expect(rerunChallengeEpisode(3)).toBe(true);
      expect(gs.episodeHistory.map(r => r.num)).toEqual([1, 2]);
      const again = simulateChallengeEpisode();
      expect(again.num).toBe(3);
      differs = JSON.stringify(again.ch.aired) !== JSON.stringify(aired[2].ch.aired);
    }
    expect(differs).toBe(true);
    expect(JSON.stringify(gs.episodeHistory.slice(0, 2).map(r => r.exits))).toBe(before);
  });
});

describe('the franchise remembers the season', () => {
  it('writes its record when the final airs, and the next season reads it', () => {
    freshSeason();
    const aired = playAll();
    const rec = activeSeasons()[seasonKey('the-challenge', 1)];
    expect(rec, 'no ledger record').toBeTruthy();
    expect(rec.format).toBe('the-challenge');
    const champs = aired.at(-1).ch.final.champions;
    for (const c of champs) expect(rec.players[c].winner).toBe(true);
    expect(Object.keys(rec.players).sort()).toEqual(players.map(p => p.name).sort());
    // relationships both ways, and somebody made friends and somebody a rival
    const ps = Object.values(rec.players);
    expect(ps.some(p => p.allies.length)).toBe(true);
    expect(ps.some(p => p.rivals.length)).toBe(true);
    for (const [n, p] of Object.entries(rec.players)) for (const a of p.allies) expect(rec.players[a].allies).toContain(n);
    // Season 2 with the same cast: nobody is a rookie now, and they come from The Challenge.
    freshSeason(16, {}, { ledger: false, seasonNumber: 2 });
    const bg = challengeBackground();
    for (const n of players.map(p => p.name)) {
      expect(bg[n].rookie, n).toBe(false);
      expect(bg[n].origin, n).toBe('the-challenge');
    }
  });

  it('a player the ledger has never seen is billed a rookie, unless the author says otherwise', () => {
    freshSeason(16, { chSetup: {} });
    const name = players[0].name;
    expect(challengeBackground()[name].rookie).toBe(true);
    seasonConfig.chSetup = { [name]: { rookie: false } };
    expect(challengeBackground()[name].rookie).toBe(false);
    // The usual cast form stores it on the player, and the form wins.
    seasonConfig.chSetup = {};
    players[0].chBilling = 'vet';
    expect(challengeBackground()[name].rookie).toBe(false);
    expect(challengeBilling(players[0])).toBe('Vet');
    delete players[0].chBilling;
    expect(challengeBilling(players[0])).toBe('Rookie');
  });

  it('a non-binary player plays in the division picked on the cast form', () => {
    freshSeason();
    players[0].gender = 'nb';
    players[0].chDivision = 'f';
    expect(challengeDivisions()[players[0].name]).toBe('f');
  });
});
