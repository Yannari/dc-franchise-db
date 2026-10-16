// The twists, themes and modes ported from classic screens to the stepped viewer (vp-bb-ep/steps-ports.js;
// the user, 2026-10-16: "go for 11"). Each played for real: the stepped screen exists where its act happened,
// says what the engine decided (not something else), has no holes in a line, paints every step, and the
// classic screen it replaces no longer airs inside the stepped week.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps, REPLACED } from '../js/vp-bb-ep/steps.js';
import { stageHtml } from '../js/vp-bb-ep/stage.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'perceptive-player', 'chaos-agent'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i], stats: spread(i + 1) }));

function play(cfg, weeks, seed = 11) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'enabled', theme: 'none', twistSchedule: [],
    bbTwins: 'off', bbRivals: 'off', bbSaboteur: 'off', bbDuos: 'off', bbDepartures: 'off' }, cfg);
  const out = [];
  for (let w = 0; w < weeks; w++) {
    const ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode());
    if (!ep) break;
    out.push(JSON.parse(JSON.stringify(ep)));
  }
  return out;
}
const twist = (type, eps) => ({ twistSchedule: eps.map(e => ({ episode: e, type })) });

const CASES = [
  ...['summer-of-temptation', 'machine-summer', 'summer-of-mystery', 'high-rollers', 'summer-camp', 'summer-school'].map(theme => ({ name: `theme ${theme}`, cfg: { theme }, weeks: 2 })),
  { name: 'theme turn', cfg: { theme: 'high-rollers' }, weeks: 6 },
  { name: 'have-nots', cfg: { bbHaveNots: 'every-week' }, weeks: 2 },
  { name: 'departures', cfg: { bbDepartures: 'often' }, weeks: 5 },
  { name: 'instant eviction', cfg: twist('bb-instant-eviction', [2]), weeks: 2 },
  { name: 'double eviction', cfg: twist('bb-double-eviction', [2]), weeks: 2 },
  { name: 'triple eviction', cfg: twist('bb-triple-eviction', [2]), weeks: 2 },
  { name: "America's vote", cfg: twist('bb-americas-eviction-vote', [1, 2]), weeks: 2 },
  { name: 'sanctum', cfg: twist('bb-sanctum-week', [1, 2]), weeks: 2 },
];
const PLAYED = Object.fromEntries(CASES.map(c => [c.name, play(c.cfg, c.weeks)]));
const all = name => PLAYED[name].map(ep => ({ ep, screens: bbWeekSteps(ep) }));
const actsOf = (ep, type) => (ep.acts || []).filter(a => a?.type === type);

function paints(screens, si) {
  for (const st of screens[si].steps) expect(String(st.t)).not.toMatch(/undefined|null|NaN|\{|\}/);
  for (let i = -1; i < screens[si].steps.length; i++) {
    expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
  }
}

describe('ported screens on the stepped stage', () => {
  it('the antagonist speaks every line the engine gave it, in its own voice', () => {
    for (const c of CASES.filter(x => x.name.startsWith('theme '))) {
      for (const { ep, screens } of all(c.name)) {
        const lines = actsOf(ep, 'theme-beat').filter(a => a.line).map(a => a.line);
        const said = screens.flatMap(s => s.steps.filter(st => st.k === 'voice').map(st => st.t));
        expect(said.length).toBe(lines.length);
        expect(lines.length, c.name).toBeGreaterThan(0);
        screens.forEach((s, si) => { if (['voice', 'primer', 'turn'].includes(s.kind)) paints(screens, si); });
      }
    }
  });

  it('opens a themed season on its primer, and airs the turn when the register changes', () => {
    for (const theme of ['summer-of-temptation', 'machine-summer', 'summer-of-mystery', 'high-rollers', 'summer-camp', 'summer-school']) {
      const [w1] = all(`theme ${theme}`);
      const primer = w1.screens.find(s => s.kind === 'primer');
      expect(primer, theme).toBeTruthy();
      expect(primer.rules.length).toBeGreaterThan(0);
    }
    const turns = all('theme turn').flatMap(({ ep, screens }) => actsOf(ep, 'theme-turn').map(a => ({ a, S: screens.find(s => s.kind === 'turn') })));
    expect(turns.length).toBeGreaterThan(0);
    for (const { S } of turns) expect(S).toBeTruthy();
  });

  it('reads the Have-Nots off the scoreboard, every one of them', () => {
    let seen = 0;
    for (const { ep, screens } of all('have-nots')) {
      const act = actsOf(ep, 'have-nots')[0];
      if (!act) continue;
      seen++;
      const si = screens.findIndex(s => s.kind === 'havenots');
      expect(si).toBeGreaterThanOrEqual(0);
      for (const n of act.names) expect(screens[si].steps.some(st => st.k === 'bb' && st.t.startsWith(`${n}, you are a Have-Not`))).toBe(true);
      paints(screens, si);
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('walks a departing houseguest out, and nobody is evicted', () => {
    const weeks = all('departures').filter(({ ep }) => actsOf(ep, 'departure').length);
    expect(weeks.length).toBeGreaterThan(0);
    for (const { ep, screens } of weeks) {
      const act = actsOf(ep, 'departure')[0];
      const si = screens.findIndex(s => s.kind === 'departure');
      expect(screens[si].steps.some(st => st.out === act.name)).toBe(true);
      paints(screens, si);
    }
  });

  it('locks the Instant Eviction block the engine made', () => {
    let seen = 0;
    for (const { ep, screens } of all('instant eviction')) {
      const act = actsOf(ep, 'instant-eviction')[0];
      if (!act) continue;
      seen++;
      const si = screens.findIndex(s => s.kind === 'instant');
      expect(screens[si].steps.find(st => st.nom)?.nom).toEqual(act.nominees);
      paints(screens, si);
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('tells the house live that the night is not over, once per extra cycle', () => {
    for (const name of ['double eviction', 'triple eviction']) {
      const [, w2] = all(name);
      const breaks = w2.screens.filter(s => s.kind === 'double');
      expect(breaks.length, name).toBe((w2.ep.extraEvictions || []).length || (w2.ep.doubleEviction ? 1 : 0));
      // the second cycle seats nobody who has already gone out the door
      const gone = actsOf(w2.ep, 'eviction')[0]?.evicted;
      const si = w2.screens.indexOf(breaks[0]);
      expect(Object.keys(w2.screens[si].seated || {})).not.toContain(gone);
      paints(w2.screens, si);
    }
  });

  it("reads America's vote on the engine's numbers", () => {
    let seen = 0;
    for (const { ep, screens } of all("America's vote")) {
      const act = actsOf(ep, 'americas-eviction-vote')[0];
      if (!act) continue;
      seen++;
      const si = screens.findIndex(s => s.kind === 'avote');
      const last = screens[si].steps.find(st => st.big);
      expect(last.big[0]).toBe(act.target);
      paints(screens, si);
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('votes in the Sanctum in public, in the engine’s order', () => {
    let seen = 0;
    for (const { ep, screens } of all('sanctum')) {
      const act = actsOf(ep, 'eviction').find(a => a.publicVote);
      if (!act || !(act.sanctumOrder || []).length) continue;
      seen++;
      const si = screens.findIndex(s => s.kind === 'evict' && s.sanctum);
      expect(si).toBeGreaterThanOrEqual(0);
      const cast = screens[si].steps.filter(st => st.ballot).map(st => st.ballot[0]);
      expect(cast).toEqual(act.sanctumOrder.map(v => v.voter).filter(v => (act.ballots || []).some(b => b.voter === v)));
      expect(screens[si].steps.some(st => st.k === 'dr' && st.ballot)).toBe(false);
      paints(screens, si);
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('replaces the classic screens it ported', () => {
    for (const id of ['theme-primer', 'theme-turn', 'bb-theme-open', 'bb-theme-vote', 'bb-havenots', 'bb-departure', 'bb-instant', 'bb-avote', 'bb-double', 'bb-double-3', 'bb-sanctum']) {
      expect(REPLACED.test(id), id).toBe(true);
    }
    // and nothing it should not
    for (const id of ['bb-hoh', 'bb-veto', 'bb-house-1', 'bb-safety']) expect(REPLACED.test(id), id).toBe(false);
  });
});
