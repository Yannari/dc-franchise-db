// rr-run.test.js — The Ridonculous Race is REACHABLE from the run tab: the flag, the teams read off the cast cards,
// one leg per press, a reload, what the hub reads, and what the franchise keeps.
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers, seasonConfig, formatIsRunnable } from '../js/core.js';
import { SHOWS } from '../js/shows.js';
import { isRaceSeason, raceTeams, raceCastProblem, simulateRaceEpisode, raceEpisodesLeft, lastRaceRefusal,
  raceSeasonShape, raceEpisodeMap, raceVoteShape } from '../js/rr-run.js';
import { setFranchiseLedger, activeSeasons } from '../js/franchise-meta.js';
import { raceCast } from './helpers/rr-cast.js';

// a cast built the way the Casting Room builds it: two cards that name each other, the team's fields on its cards
function cards(nTeams = 8, seed = 5) {
  const { cast, teams } = raceCast(nTeams, seed);
  const byName = Object.fromEntries(cast.map(p => [p.name, { ...p }]));
  for (const t of teams) {
    byName[t.a].rrPartner = t.b; byName[t.b].rrPartner = t.a;
    byName[t.a].rrRel = t.rel;
    if (t.identity) byName[t.b].rrIdentity = t.identity;
  }
  return { list: Object.values(byName), teams };
}
function freshSeason(nTeams = 8, { seasonNumber = 1, ledger = true } = {}) {
  Object.assign(seasonConfig, { format: 'ridonculous-race', seasonNumber, twistSchedule: [], name: null, rrTeams: null });
  const { list, teams } = cards(nTeams);
  setPlayers(list);
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], rr: { seed: 404 }, seasonNumber });
  if (ledger) setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
  return teams;
}
function playAll() {
  const aired = [];
  for (let i = 0; i < 40; i++) { const row = simulateRaceEpisode(); if (!row) break; aired.push(row); }
  return aired;
}

describe('The Ridonculous Race is registered and can be started', () => {
  it('has its registry entry: prefix rr, Don hosting, the calendar, its words', () => {
    const s = SHOWS['ridonculous-race'];
    expect(s.prefix).toBe('rr');
    expect(s.words.round).toBe('Leg');
    expect(s.words.host).toBe('Don');
    expect(s.airSlots?.length).toBeGreaterThan(0);
    expect(typeof s.airNight).toBe('number');
  });

  it('importing rr-run IS the wiring: the flag is set and the show reads as runnable', () => {
    expect(window._rrRunnable).toBe(true);
    expect(formatIsRunnable({ format: 'ridonculous-race' })).toBe(true);
    freshSeason();
    expect(isRaceSeason()).toBe(true);
  });
});

describe('the teams come off the cast cards', () => {
  it('two cards that name each other are a team, with the relationship and identity either card carries', () => {
    const teams = freshSeason();
    const got = raceTeams();
    expect(got.length).toBe(teams.length);
    for (const t of teams) {
      const g = got.find(x => [x.a, x.b].sort().join() === [t.a, t.b].sort().join());
      expect(g, `${t.a} & ${t.b}`).toBeTruthy();
      expect(g.rel).toBe(t.rel);
      expect(g.identity).toBe(t.identity);
    }
    expect(raceCastProblem()).toBe(null);
  });

  it('refuses a cast with somebody unpaired, or too few teams, and says why', () => {
    freshSeason(8);
    const { list } = cards(8);
    delete list[0].rrPartner;
    setPlayers(list);
    expect(raceCastProblem()).toMatch(/partner/);
    expect(simulateRaceEpisode()).toBe(null);
    expect(lastRaceRefusal()).toMatch(/partner/);
    freshSeason(4);
    expect(raceCastProblem()).toMatch(/six teams/);
  });
});

describe('a season plays one leg per press', () => {
  it('airs every leg and the final, then stops, and names the winners', () => {
    freshSeason(8);
    const shape = raceSeasonShape();
    const aired = playAll();
    expect(aired.length).toBe(shape.length);
    expect(aired.map(r => r.num)).toEqual(aired.map((_, i) => i + 1));
    expect(aired.at(-1).rr.final).toBeTruthy();
    expect(aired.at(-1).winner).toBeTruthy();
    expect(raceEpisodesLeft()).toBe(0);
    expect(gs.phase).toBe('complete');
    // every leg carries what aired, and its words
    for (const r of aired) expect(r.rr.aired.segments.some(s => s.lines?.length), `leg ${r.num}`).toBe(true);
    // what is saved is rows, never the engine's state
    expect(gs.rr.state).toBeUndefined();
    expect(JSON.stringify(gs).length).toBeLessThan(8_000_000);
    expect(raceEpisodeMap().map(t => t.ep)).toEqual(shape.map(d => d.n));
  });

  it('an elimination leg names who left, both of them, and the hub says it in race words', () => {
    freshSeason(8);
    const aired = playAll();
    const elim = aired.find(r => r.rr.kind === 'elim' && r.exits.length);
    expect(elim.exits.length).toBe(2);
    expect(raceVoteShape(elim)).toMatch(/first|won/i);
    expect(raceVoteShape(elim)).not.toMatch(/vote|tribal|immunity/i);
  });

  it('a queue lost to a reload rebuilds the SAME season and keeps what aired', () => {
    freshSeason(8);
    const first = [simulateRaceEpisode(), simulateRaceEpisode()];
    delete gs._rrQueue;
    const next = simulateRaceEpisode();
    expect(next.num).toBe(3);
    freshSeason(8);
    const whole = playAll();
    expect(JSON.stringify(whole[2].rr.order)).toBe(JSON.stringify(next.rr.order));
    expect(first.map(r => r.num)).toEqual([1, 2]);
  });
});

describe('the franchise keeps it', () => {
  it('the last leg writes the season to the ledger', () => {
    freshSeason(8, { seasonNumber: 3 });
    playAll();
    const keys = Object.keys(activeSeasons() || {});
    expect(keys.some(k => /^rr-3$/.test(k)), keys.join(',')).toBe(true);
  });
});

describe('the site shows a leg', () => {
  it('the hub says who won the leg and who went home, in race words; the eliminated are both of them', async () => {
    const { getEpisodeEliminations, buildHubAftermath } = await import('../js/run-ui.js');
    freshSeason(8);
    const aired = playAll();
    const elim = aired.find(r => r.rr.kind === 'elim' && r.exits.length);
    for (const x of elim.exits) expect(getEpisodeEliminations(elim)).toContain(x.name);
    const why = buildHubAftermath(elim).why;
    expect(why).toMatch(/eliminated|went home|sent home|on the road|medevac|quit/);
    expect(why).not.toMatch(/vote|ballot|tribal/i);
    expect(buildHubAftermath(aired.at(-1)).why).toMatch(/won The Ridonculous Race/);
  });

  it("the Visual Player shows the leg as chapters of the stepped viewer, ending at the Chill Zone; the backlog is the leg's transcript", async () => {
    const { buildVPScreens } = await import('../js/vp-screens.js');
    const { generateSummaryText } = await import('../js/text-backlog.js');
    const { racePlayed } = await import('../js/rr-run.js');
    const { episodeScreens, flatSteps } = await import('../js/vp-rr-ep/steps.js');
    try { localStorage.removeItem('rr-vp'); } catch { /* none */ }
    freshSeason(8);
    const aired = playAll();
    const r = aired[2];
    const screens = buildVPScreens(r);
    expect(screens.length).toBeGreaterThanOrEqual(4);
    expect(screens.every(x => /^rr-c\d+$/.test(x.id))).toBe(true);
    expect(screens[0].label).toBe('Previously');
    expect(screens.at(-1).label).toBe('The Chill Zone');
    expect(screens.map(x => x.label)).not.toContain('Transcript');
    expect(screens[0].html).toContain('rrxSwitchViewer');
    // the race played again here is the one the row aired, and every step of the leg is in exactly one chapter
    const played = racePlayed();
    expect(played.res.legs[r.num - 1].order).toEqual(r.rr.order.map(o => o.team));
    const reg = window._rrx[`rr${r.num}`];
    const e = episodeScreens(played.res, played.eps, r.num - 1);
    const covered = reg.chapters.reduce((n, c) => n + flatSteps(e.screens).filter(f => f.si >= c.from && f.si <= c.to).length, 0);
    expect(covered).toBe(flatSteps(e.screens).length);
    for (let k = 1; k < reg.chapters.length; k++) expect(reg.chapters[k].from).toBe(reg.chapters[k - 1].to + 1);
    const text = generateSummaryText(r);
    expect(text).toMatch(new RegExp(`^LEG ${r.num} `));
    const said = r.rr.aired.segments.flatMap(x => x.lines).find(l => l.kind === 'say');
    expect(text).toContain(said.text);
    expect(text).not.toMatch(/Tribal|Immunity|voted out/);
  });

  it('the transcript is the other mode, one button away, with a button back', async () => {
    const { buildVPScreens } = await import('../js/vp-screens.js');
    freshSeason(8);
    const aired = playAll();
    localStorage.setItem('rr-vp', 'readout');
    try {
      const screens = buildVPScreens(aired[1]);
      expect(screens.map(x => x.id)).toEqual(['rr-transcript']);
      expect(screens[0].html).toContain("rrxSwitchViewer('stepped')");
    } finally { localStorage.removeItem('rr-vp'); }
  });
});

describe('setup knows the race', () => {
  it("Quick Setup's blueprint and ready check speak in teams and legs, never tribes or a jury", async () => {
    const { blueprintFor, validateQuickSetup } = await import('../js/quick-setup.js');
    freshSeason(8);
    const segs = blueprintFor({ format: 'ridonculous-race' }, 16).map(s => s.label).join(' | ');
    expect(segs).toMatch(/8 teams of two/);
    expect(segs).toMatch(/\d+ legs/);
    expect(segs).not.toMatch(/tribe|merge|jury/i);
    const { list } = cards(8);
    const rows = validateQuickSetup({ format: 'ridonculous-race' }, list);
    expect(rows.find(r => r.key === 'cast')).toMatchObject({ ok: true });
    delete list[3].rrPartner;
    expect(validateQuickSetup({ format: 'ridonculous-race' }, list).find(r => r.key === 'cast').ok).toBe(false);
  });

  it("a team made in the Casting Room's Pairs view (the cards' one Partner field) is a race team", () => {
    freshSeason(8);
    const { list } = cards(8);
    for (const p of list) { p.chPartner = p.rrPartner; delete p.rrPartner; }
    setPlayers(list);
    expect(raceTeams().length).toBe(8);
    expect(raceCastProblem()).toBe(null);
  });
});

describe('the Visual Player names the leg', () => {
  it("a race's screens sit in one section, The Leg, never another show's", async () => {
    // jsdom has no matchMedia, which the player reads as it loads
    window.matchMedia ||= () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    const { _vpPhaseForScreen } = await import('../js/vp-ui.js');
    for (const id of ['rr-watch', 'rr-transcript']) expect(_vpPhaseForScreen(id).label).toBe('The Leg');
  });
});

describe('a leg can be re-run', () => {
  it('re-running leg 3 keeps legs 1 and 2 as they aired, clears the rest, and plays leg 3 again with new dice', async () => {
    const { raceCanRerun, rerunRaceEpisode } = await import('../js/rr-run.js');
    freshSeason(8);
    const first = [simulateRaceEpisode(), simulateRaceEpisode(), simulateRaceEpisode(), simulateRaceEpisode()];
    expect(raceCanRerun()).toBe(true);
    const was = JSON.stringify(first[2].rr.order.map(o => o.team)) + JSON.stringify(first[2].rr.aired.segments.map(s => s.lineId));
    let changed = false;
    for (let k = 0; k < 4 && !changed; k++) {
      expect(rerunRaceEpisode(3)).toBe(true);
      expect(gs.episodeHistory.map(r => r.num)).toEqual([1, 2]);
      expect(gs.episodeHistory.map(r => JSON.stringify(r.rr.order))).toEqual(first.slice(0, 2).map(r => JSON.stringify(r.rr.order)));
      const again = simulateRaceEpisode();
      expect(again.num).toBe(3);
      changed = JSON.stringify(again.rr.order.map(o => o.team)) + JSON.stringify(again.rr.aired.segments.map(s => s.lineId)) !== was;
    }
    expect(changed).toBe(true);
    // the race played again for the viewer is the re-run one
    const { racePlayed } = await import('../js/rr-run.js');
    expect(racePlayed().res.legs[2].order).toEqual(gs.episodeHistory[2].rr.order.map(o => o.team));
  });
});

describe('a team set up in the Pairs view', () => {
  it('a custom identity is a name of your own that plays like a built-in one: "the Ballerinas", strong like the Dancers', async () => {
    const { raceSetTeam } = await import('../js/rr-run.js');
    const { teamRef } = await import('../js/rr/script/roles.js');
    const { identityOf } = await import('../js/rr/identities.js');
    freshSeason(8);
    const t0 = raceTeams()[0];
    raceSetTeam(t0.a, t0.b, 'rrIdentity', 'custom');
    raceSetTeam(t0.a, t0.b, 'rrCustomName', 'Ballerinas');
    raceSetTeam(t0.a, t0.b, 'rrCustomLike', 'dancers');
    raceSetTeam(t0.a, t0.b, 'rrRel', 'exes');
    const t = raceTeams()[0];
    expect(t.name).toBe('Ballerinas');
    expect(t.identity).toBe(null);
    expect(t.custom).toMatchObject({ name: 'Ballerinas', mix: ['dancers'], voice: 'dancers' });
    expect(t.rel).toBe('exes');
    const { IDENTITIES } = await import('../js/rr/identities.js');
    expect(identityOf(t).name).toBe('Ballerinas');
    expect(identityOf(t).good).toEqual(IDENTITIES.dancers.good);
    expect(teamRef({ teams: { t1: t } }, 't1')).toBe('the Ballerinas');
    // both cards carry it, so the team reads the same whichever card comes first
    const { players } = await import('../js/core.js');
    for (const n of [t0.a, t0.b]) expect(players.find(p => p.name === n).rrCustomName).toBe('Ballerinas');
    expect(raceCastProblem()).toBe(null);
  });
});

describe('a custom identity can be anything', () => {
  it("blends up to three identities: their most shared strengths and weaknesses, two of each, the first one's voice", async () => {
    const { identityOf, IDENTITIES } = await import('../js/rr/identities.js');
    const mix = ['soldiers', 'dancers', 'lifeguards'];
    const id = identityOf({ custom: { name: 'Stunt Doubles', mix } });
    const goods = mix.flatMap(m => IDENTITIES[m].good), bads = mix.flatMap(m => IDENTITIES[m].bad);
    expect(id.name).toBe('Stunt Doubles');
    expect(id.good.length).toBe(2);
    for (const g of id.good) expect(goods).toContain(g);
    for (const b of id.bad) { expect(bads).toContain(b); expect(id.good).not.toContain(b); }
    expect(id.bad.length).toBeLessThanOrEqual(2);
  });

  it('or is built from scratch: the strengths and weaknesses picked, whatever it borrows', async () => {
    const { raceSetTeam } = await import('../js/rr-run.js');
    const { identityOf } = await import('../js/rr/identities.js');
    freshSeason(8);
    const t0 = raceTeams()[0];
    for (const [f, v] of [['rrIdentity', 'custom'], ['rrCustomName', 'Divers'], ['rrCustomLike', 'goths'], ['rrCustomLike2', 'chefs'],
      ['rrCustomGood1', 'water'], ['rrCustomGood2', 'heights'], ['rrCustomBad1', 'brains']]) raceSetTeam(t0.a, t0.b, f, v);
    const t = raceTeams()[0];
    expect(t.custom).toMatchObject({ name: 'Divers', mix: ['goths', 'chefs'], voice: 'goths', good: ['water', 'heights'], bad: ['brains'] });
    const id = identityOf(t);
    expect(id.good).toEqual(['water', 'heights']);
    expect(id.bad).toEqual(['brains']);
  });
});

describe("the hub says a race's exits by team", () => {
  it('"The Chefs (Beth and Blaineley) were eliminated", once, and a race counts teams, not a Final N', async () => {
    const { buildSeasonHubModel } = await import('../js/run-ui.js');
    const { players } = await import('../js/core.js');
    freshSeason(8);
    let row;
    for (let i = 0; i < 12; i++) { row = simulateRaceEpisode(); if (row?.exits?.length && row.rr.kind === 'elim') break; }
    const model = buildSeasonHubModel(gs, seasonConfig, players);
    const x = row.exits[0];
    expect(model.latestOutcome).toContain(x.members.join(' and '));
    expect(model.latestOutcome.split(' were ').length).toBe(2);
    expect(model.latestOutcome).not.toMatch(/ was /);
    expect(model.storylines.join(' ')).not.toMatch(new RegExp(`${x.name}'s exit`));
  });
});

describe("a team's relationship comes from its history when nobody set one", () => {
  it('family ties, then the life layer and past seasons, then a grudge, then two vets, then best friends', async () => {
    const { raceHistoryRel } = await import('../js/rr-run.js');
    const none = { kin: [], bonds: [] };
    expect(raceHistoryRel('A', 'B', none, { kin: 'parent-child' })).toMatchObject({ rel: 'parent-child', from: 'family' });
    expect(raceHistoryRel('A', 'B', none, { kin: 'twins' })).toMatchObject({ rel: 'siblings' });
    expect(raceHistoryRel('A', 'B', none, { kin: 'grandparent' })).toMatchObject({ rel: 'grandparent-grandchild' });
    expect(raceHistoryRel('A', 'B', { kin: [{ a: 'A', b: 'B', kin: 'engaged', from: 'life' }], bonds: [] }, null)).toMatchObject({ rel: 'dating', engaged: true, from: 'life' });
    expect(raceHistoryRel('A', 'B', { kin: [{ a: 'B', b: 'A', kin: 'married', from: 'life' }], bonds: [] }, null)).toMatchObject({ rel: 'married' });
    expect(raceHistoryRel('A', 'B', { kin: [{ a: 'A', b: 'B', kin: 'exes', from: 'ledger' }], bonds: [] }, null)).toMatchObject({ rel: 'exes', from: 'ledger' });
    expect(raceHistoryRel('A', 'B', { kin: [{ a: 'A', b: 'B', kin: 'old-friends', from: 'ledger' }], bonds: [] }, null)).toMatchObject({ rel: 'bffs', from: 'ledger' });
    expect(raceHistoryRel('A', 'B', { kin: [], bonds: [{ a: 'A', b: 'B', delta: -6, resent: true }] }, null)).toMatchObject({ rel: 'enemies' });
    expect(raceHistoryRel('A', 'B', { kin: [], bonds: [{ a: 'A', b: 'B', delta: -2, resent: true }] }, null)).toMatchObject({ rel: 'rivals' });
    expect(raceHistoryRel('A', 'B', none, null, true)).toMatchObject({ rel: 'reality-vets' });
    expect(raceHistoryRel('A', 'B', none, null, false)).toMatchObject({ rel: 'bffs', from: null });
  });

  it("Don's label says it: an engaged couple, exes since their last show", async () => {
    const { relLabel } = await import('../js/rr/story/previously.js');
    expect(relLabel({ rel: 'dating', history: { engaged: true } })).toBe('an engaged couple');
    expect(relLabel({ rel: 'exes', history: { from: 'ledger' } })).toBe('exes, since their last show together');
    expect(relLabel({ rel: 'bffs', history: { from: 'ledger' } })).toBe('old friends from another show');
  });
});
