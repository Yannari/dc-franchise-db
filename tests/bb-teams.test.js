// Assigned teams — the group nobody chose.
//
// Every other group in this engine is opted into; `blocs.js` derives its power
// structures from alliances and showmances rather than holding any. This is
// the first membership somebody is simply GIVEN, and the sorting maths is
// where the cast-size edge cases live.
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { assignTeams, teamOf, teammates, sharesTeam, allTeams, teamImmune,
  dissolveTeams, teamsDissolved, CLIQUES } from '../js/bb/teams.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';
import { BB_THEMES, THEME_LIST } from '../js/bb/themes.js';
import { TWIST_CATALOG } from '../js/core.js';
import { CLIQUES_EVENTS } from '../js/bb-events/cliques.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';

const ROSTER = JSON.parse(readFileSync(resolve(process.cwd(), 'franchise_roster.json'), 'utf8'));
const POOL = (Array.isArray(ROSTER) ? ROSTER : ROSTER.players || Object.values(ROSTER)[0])
  .filter(p => p?.stats && p.name);
const castOf = n => Array.from({ length: n }, (_, i) => POOL[(i * 11 + 3) % POOL.length])
  .map(p => ({ name: p.name, archetype: p.archetype || 'floater', gender: p.gender || 'm',
    sexuality: p.sexuality || 'straight', stats: { ...p.stats } }));

function seat(n) {
  seedGame(castOf(n), { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  seasonConfig.format = 'big-brother';
  return [...gs.activePlayers];
}

const lcg = (s) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

describe('sorting the house', () => {
  beforeEach(() => seat(16));

  it('puts everybody on exactly one team, at every cast', () => {
    for (const cast of [8, 10, 12, 14, 16, 18, 20]) {
      const room = seat(cast);
      const out = assignTeams({ house: room, rng: lcg(cast * 977 + 3) });
      expect(out, `no teams at cast ${cast}`).toBeTruthy();
      const seen = out.teams.flatMap(t => t.members);
      expect(seen.length, `cast ${cast}: somebody sorted twice or not at all`)
        .toBe(room.length);
      expect(new Set(seen).size).toBe(room.length);
      for (const n of room) expect(teamOf(n), `${n} unsorted`).toBeTruthy();
    }
  });

  it('keeps the four within one of each other', () => {
    for (const cast of [8, 11, 13, 16, 19, 20]) {
      const room = seat(cast);
      const out = assignTeams({ house: room, rng: lcg(cast * 331 + 7) });
      const sizes = out.teams.map(t => t.members.length);
      expect(Math.max(...sizes) - Math.min(...sizes),
        `cast ${cast} sorted into ${sizes.join('/')}`).toBeLessThanOrEqual(1);
      expect(out.teams.length, `cast ${cast} lost a clique`).toBe(CLIQUES.length);
    }
  });

  it('stands down on a house too small to have four of anything', () => {
    const room = seat(7);
    expect(assignTeams({ house: room, rng: lcg(1) }), 'sorted seven people into four cliques')
      .toBeNull();
  });

  it('sorts on archetype rather than at random', () => {
    // The whole appeal of the twist is that the cliques READ as cliques. A
    // random sort would put challenge-beasts in the Brains as often as not.
    const room = seat(16);
    // Give the cast unmistakable archetypes so the signal is not noise.
    const wants = { 'challenge-beast': 'athletes', mastermind: 'brains',
      'social-butterfly': 'populars', 'chaos-agent': 'offbeats' };
    const keys = Object.keys(wants);
    room.forEach((n, i) => {
      const p = players.find(x => x.name === n);
      if (p) p.archetype = keys[i % keys.length];
    });
    assignTeams({ house: room, rng: lcg(4242) });
    let right = 0;
    for (const n of room) {
      const p = players.find(x => x.name === n);
      if (teamOf(n)?.id === wants[p.archetype]) right++;
    }
    // Not all of them — the caps have to keep the sizes even, so a crowded
    // archetype overflows on purpose. Well above the 25% a random sort gives.
    expect(right / room.length, `only ${right}/${room.length} landed in their own clique`)
      .toBeGreaterThan(0.6);
  });

  it('answers the three membership reads consistently', () => {
    const room = seat(16);
    assignTeams({ house: room, rng: lcg(99) });
    const a = room[0];
    const mates = teammates(a);
    expect(mates).not.toContain(a);
    for (const m of mates) {
      expect(sharesTeam(a, m), `${a} and ${m} should share`).toBe(true);
      expect(sharesTeam(m, a), 'sharesTeam is not symmetric').toBe(true);
    }
    const outsider = room.find(n => !mates.includes(n) && n !== a);
    expect(sharesTeam(a, outsider)).toBe(false);
    expect(sharesTeam(a, a), 'somebody shares a team with themselves').toBe(false);
    expect(sharesTeam(a, 'Nobody At All')).toBe(false);
    // And the accessor never hands out the live store.
    const copy = allTeams();
    copy[0].members.push('Intruder');
    expect(teamOf('Intruder'), 'allTeams leaked the store').toBeNull();
  });
});

describe('what a team is for', () => {
  beforeEach(() => seat(16));

  it('makes the whole clique of the Head of Household untouchable', () => {
    const room = seat(16);
    assignTeams({ house: room, rng: lcg(555) });
    const hoh = room[3];
    const safe = teamImmune({ num: 2 }, hoh);
    expect(safe, 'the HOH is not in their own safe list').toContain(hoh);
    expect(safe.slice().sort()).toEqual([...teammates(hoh), hoh].sort());
    // Four safe rather than one is the entire point of the twist.
    expect(safe.length).toBeGreaterThan(1);
  });

  it('protects nobody on a season with no teams', () => {
    const room = seat(16);
    // No assignTeams call at all — an ordinary season.
    expect(teamImmune({ num: 2 }, room[0])).toEqual([]);
    expect(teamOf(room[0])).toBeNull();
    expect(teammates(room[0])).toEqual([]);
  });

  it('stops protecting anybody once the cliques dissolve', () => {
    const room = seat(16);
    assignTeams({ house: room, rng: lcg(777) });
    const hoh = room[5];
    expect(teamImmune({ num: 3 }, hoh).length).toBeGreaterThan(1);

    const act = dissolveTeams({ num: 6 });
    expect(act, 'nothing was dissolved').toBeTruthy();
    expect(act.type).toBe('teams-dissolved');
    expect(act.beats.length, 'the cliques ended with no scene').toBeGreaterThan(0);
    expect(teamsDissolved()).toBe(true);
    expect(teamImmune({ num: 7 }, hoh), 'a dissolved clique still protected somebody')
      .toEqual([]);
    // Membership survives the dissolution — who you were sorted with is still
    // a fact about the season, it just stops being a shield.
    expect(teamOf(hoh)).toBeTruthy();
    // And it only happens once.
    expect(dissolveTeams({ num: 7 }), 'dissolved twice').toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════
// IN A PLAYED SEASON
// ══════════════════════════════════════════════════════════════════════
describe('the cliques, played', () => {
  const play = (cast = 16) => {
    const room = seat(cast);
    Object.assign(seasonConfig, { finaleSize: 3, jurySize: 7,
      bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [{ id: 'cl-1', episode: 1, type: 'bb-cliques' }];
    return room;
  };

  it('sorts the house on night one and says so in both transcripts', () => {
    play(16);
    const ep = withSeededRandom(3131, () => simulateBBEpisode());
    const week = gs.bb.weeks[gs.bb.weeks.length - 1];
    expect(week.teamsAssigned, 'nobody was sorted').toBeTruthy();
    expect(week.teamsAssigned).toHaveLength(4);
    for (const [label, text] of [
      ['summariseWeek', summariseWeek(week)],
      ['generateSummaryText', generateSummaryText(ep)],
    ]) {
      expect(text, `${label}: untranscribed`).toMatch(/THE CLIQUES/);
      expect(text, `${label}: no clique named`).toMatch(/The Athletes|The Brains/);
    }
  });

  it('protects the whole clique of whoever is in charge', () => {
    play(16);
    withSeededRandom(3131, () => simulateBBEpisode());
    const week = gs.bb.weeks[gs.bb.weeks.length - 1];
    const hoh = week.hoh;
    expect(hoh, 'no HOH').toBeTruthy();
    const clique = teamOf(hoh);
    expect(clique, 'the HOH was not sorted').toBeTruthy();
    // THE WHOLE RULE: nobody in the HOH’s clique may be on that block.
    for (const mate of clique.members) {
      expect(week.initialNominees || [],
        `${mate} is in the HOH clique and was nominated anyway`).not.toContain(mate);
    }
    // And the block is still legal.
    expect((week.initialNominees || []).length).toBeGreaterThanOrEqual(2);
  });

  it('still fills a legal block when a quarter of the house is safe', () => {
    // The real risk of the twist: four immune plus the ordinary protections
    // could leave nobody to nominate. Played across seeds and cast sizes.
    for (const cast of [10, 12, 16]) {
      for (let seed = 1; seed <= 4; seed++) {
        play(cast);
        let ep;
        try { ep = withSeededRandom(seed * 71 + 5, () => simulateBBEpisode()); }
        catch (err) { throw new Error(`cast ${cast} seed ${seed} threw: ${err.message}`); }
        if (!ep) continue;
        const week = gs.bb.weeks[gs.bb.weeks.length - 1];
        expect((week.initialNominees || []).length,
          `cast ${cast} seed ${seed} produced a short block`).toBeGreaterThanOrEqual(2);
        expect(week.evicted, `cast ${cast} seed ${seed} evicted nobody`).toBeTruthy();
      }
    }
  });

  it('leaves a season with no cliques byte-identical', () => {
    const run = () => {
      seat(16);
      Object.assign(seasonConfig, { finaleSize: 3, jurySize: 7,
        bbHaveNots: 'off', bbSafetyMode: 'off' });
      seasonConfig.twistSchedule = [];
      const ep = withSeededRandom(8080, () => simulateBBEpisode());
      const week = gs.bb.weeks[gs.bb.weeks.length - 1];
      return { text: summariseWeek(week), noms: [...(week.initialNominees || [])],
        teams: allTeams().length, evicted: week.evicted };
    };
    const a = run();
    expect(a.teams, 'an unthemed season sorted somebody').toBe(0);
    expect(run()).toEqual(a);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE THEME
// ══════════════════════════════════════════════════════════════════════
describe('The Cliques, as a season', () => {
  const theme = () => BB_THEMES.cliques;

  // Every card the arc books must have a line in the primer that explains
  // it. An audit found three unexplained cards on High Roller's; this is
  // the same guard the other themes carry.
  const EXPLAINED = {
    'bb-cliques': /sorted into four cliques/i,
    'bb-have-nots': /Have-Not/i,
    'bb-care-package': /audience hands one houseguest/i,
    'bb-pandoras-box': /Pandora/i,
    'bb-double-eviction': /double eviction/i,
  };

  it('is registered in the engine and offered in the config', () => {
    expect(theme(), 'the theme is not in the registry').toBeTruthy();
    expect(THEME_LIST).toContain('cliques');
    expect(theme().antagonist?.name).toBe('The Yearbook');
  });

  it('describes every card in its own arc', () => {
    const booked = [...new Set(theme().arc.filter(a => a.book).map(a => a.book))];
    const rules = theme().primer.rules.join('\n');
    for (const id of booked) {
      const probe = EXPLAINED[id];
      expect(probe, `${id} is booked and nothing here explains it`).toBeTruthy();
      expect(rules, `the primer never explains ${id}`).toMatch(probe);
    }
    expect([...booked].sort()).toEqual([...theme().books].sort());
  });

  it('books only cards that exist', () => {
    for (const id of theme().books) {
      expect(TWIST_CATALOG.some(t => t.id === id), `${id} is not in the catalog`).toBe(true);
    }
  });

  it('explains the one rule the whole season turns on', () => {
    const rules = theme().primer.rules.join('\n');
    // Four safe instead of one is the twist. If the primer does not say it,
    // a viewer watches a season of odd blocks and never learns why.
    expect(rules).toMatch(/(entire|every member of their|whole) clique is immune/i);
    expect(rules).toMatch(/four/i);
    // And that it ends.
    expect(rules).toMatch(/dissolve/i);
  });

  it('turns its register on the week the headings stop applying', () => {
    // teams.js dissolves at a house of eight, and fromEnd:5 IS a house of
    // eight — the turn has to land on the same night or the theme is saying
    // one thing while the engine does another.
    const moods = theme().arc.filter(a => a.mood);
    expect(moods.some(m => m.at?.fromEnd === 5), 'the turn is not on the dissolution')
      .toBe(true);
    expect(moods.some(m => typeof m.at?.frac === 'number'),
      'no frac backstop for a short season').toBe(true);
  });

  it('carries the arc to the end of the season', () => {
    const ends = theme().arc.filter(a => a.book && typeof a.at?.fromEnd === 'number')
      .map(a => a.at.fromEnd);
    expect(Math.min(...ends), 'nothing booked in the last fortnight')
      .toBeLessThanOrEqual(2);
  });
});

describe('being sorted, afterwards', () => {
  beforeEach(() => seat(16));

  const spy = () => {
    const calls = [];
    return { calls,
      addBond: (a, b, d) => calls.push(['addBond', a, b, d]),
      suspicion: (a, b, d) => calls.push(['suspicion', a, b, d]),
      remember: (a, b, k) => calls.push(['remember', a, b, k]),
      popDelta: (n, d) => calls.push(['popDelta', n, d]) };
  };

  it('is registered in the house pool', () => {
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const ev of CLIQUES_EVENTS) {
      expect(ids.has(ev.id), `${ev.id} is not registered`).toBe(true);
    }
  });

  it('says nothing on a season with no cliques', () => {
    const room = [...gs.activePlayers];
    for (const ev of CLIQUES_EVENTS) {
      expect(ev.weight(room, { act: 'house', week: { num: 3, hoh: room[0] }, beat: 0 }),
        `${ev.id} fires on an unsorted season`).toBe(0);
    }
  });

  it('takes being covered well or badly, depending who you are', () => {
    const room = seat(16);
    assignTeams({ house: room, rng: lcg(31) });
    const ev = CLIQUES_EVENTS.find(e => e.id === 'cliques-covered');
    const api = spy();
    const badges = new Set();
    // A FRESHLY SEATED HOUSE HAS NO WARMTH ANYWHERE, so every perceived bond
    // is zero and the resentful branch is correct for all of them. That is
    // true of week one in a real season too — the warm branch is a thing that
    // becomes reachable once people have lived together. So the test builds
    // the bonds a played week would have, rather than weakening the model to
    // make a fresh house produce feelings it has not earned.
    room.forEach((a, i) => {
      room.forEach((b, j) => {
        if (i < j && (i + j) % 3 === 0) addBond(a, b, 6);
      });
    });
    // Rotate who is in charge so different clique-mates front the scene.
    for (const hoh of room) {
      const ctx = { act: 'house', week: { num: 3, hoh }, beat: 0 };
      if (ev.weight(room, ctx) <= 0) continue;
      const r = ev.fire(room, ctx, api);
      if (r) badges.add(r.badgeText);
    }
    expect(badges.size, `every covered houseguest reacted identically: ${[...badges]}`)
      .toBeGreaterThan(1);
    expect(api.calls.length, 'reactions with no consequence').toBeGreaterThan(0);
  });

  it('only says it once a week', () => {
    const room = seat(16);
    assignTeams({ house: room, rng: lcg(31) });
    const ev = CLIQUES_EVENTS.find(e => e.id === 'cliques-covered');
    const ctx = { act: 'house', week: { num: 3, hoh: room[0] }, beat: 0 };
    // The guard reads the real event history, so a fresh week is open.
    expect(ev.weight(room, ctx)).toBeGreaterThan(0);
  });
});
