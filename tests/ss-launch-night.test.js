// Launch night stands on its own (the user, 2026-10-28: "launch night is super short, too short to stand on its
// own... production secret set up, 'that's our plan, where am I from if they ask?'... one or two personal secrets
// revealed to Josh from the confessional... first meeting, first crush, first drama... they're live, but it's not
// supposed to be boring"). The engine (js/ss/launch.js) and what airs (js/vp-bb-ep/ss-launch.js).
import { describe, expect, it } from 'vitest';
import { planLaunch } from '../js/ss/launch.js';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { PRODUCTION_SECRETS, productionSecret } from '../js/ss/casting.js';
import { arrivalGroups } from '../js/vp-bb-ep/ss-launch.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const H = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi', 'Gus', 'Hal', 'Ivy', 'Jo', 'Kai', 'Lu'];
const MEN = new Set(['Ben', 'Cy', 'Ed', 'Gus', 'Hal', 'Kai']);
const STATS = { Ben: { boldness: 9, temperament: 2 }, Cy: { boldness: 9, temperament: 2 } };
const ctx = (r = 0.3) => ({ rng: () => r, stat: (n, k) => STATS[n]?.[k] ?? 5, bond: () => 0, compat: (a, b) => MEN.has(a) !== MEN.has(b) });
const state = () => ({ secrets: [
  { id: 'p', poolId: 'prod-fake-couple', source: 'production', kind: 'voice-pair', holders: ['Di', 'Hal'], text: 'We are a fake couple', clues: ['a'] },
  { id: 'q', poolId: 'prod-spy', source: 'production', kind: 'voice-mission', holders: ['Fi'], text: "I am the internet's spy", clues: ['b'] },
  ...H.filter(n => !['Di', 'Hal', 'Fi'].includes(n)).map(n => ({ id: n, kind: 'personal', holders: [n], text: `${n}'s secret`, clues: ['c'] })),
] });

describe('the arrivals', () => {
  // the user, 2026-10-28: "why are their secrets revealed when they don't have the same secret, why is he not with
  // the person sharing his secret"
  it('two who share a secret always come down together; nobody else is paired with a sharer', () => {
    for (const lead of H) {
      const order = [lead, ...H.filter(n => n !== lead)];
      const g = arrivalGroups(order, state().secrets, 'k');
      expect(g.flat().sort()).toEqual(H.slice().sort());
      expect(g[0]).toHaveLength(1);
      expect(g.some(x => x.length === 2 && x.includes('Di') && x.includes('Hal'))).toBe(true);
      for (const x of g) if (x.includes('Di') || x.includes('Hal')) expect(x.sort()).toEqual(['Di', 'Hal']);
      for (const x of g) expect(x.length).toBeLessThanOrEqual(3);
    }
  });
});

describe('launch night, decided', () => {
  it('the house is shown live between most arrivals, not five times', () => {
    const L = planLaunch(state(), ctx(), { house: H });
    expect(L.checkins.length).toBeGreaterThanOrEqual(8);
  });
  it('a production pair makes its plan once both are in, and grows closer', () => {
    const L = planLaunch(state(), ctx(), { house: H });
    const plan = L.checkins.find(c => c.kind === 'plan');
    expect(plan).toMatchObject({ who: ['Di', 'Hal'], role: 'fake-couple' });
    expect(plan.after).toBeGreaterThan(Math.max(H.indexOf('Di'), H.indexOf('Hal')));
    expect(L.effects.bond.some(([a, b, d]) => [a, b].sort().join() === 'Di,Hal' && d > 0)).toBe(true);
  });
  it('a production secret kept alone is a live call from Josh', () => {
    const L = planLaunch(state(), ctx(), { house: H });
    expect(L.checkins.find(c => c.kind === 'role-call')).toMatchObject({ who: ['Fi'], role: 'spy' });
  });
  it('a first crush only between two who could; a first clash costs them', () => {
    const L = planLaunch(state(), ctx(), { house: H });
    const crush = L.checkins.find(c => c.kind === 'crush');
    if (crush) expect(MEN.has(crush.who[0]) !== MEN.has(crush.who[1])).toBe(true);
    const clash = L.checkins.find(c => c.kind === 'clash');
    expect(clash).toBeTruthy();
    const [a, b] = clash.who;
    expect(L.effects.bond.some(([x, y, d]) => [x, y].sort().join() === [a, b].sort().join() && d < 0)).toBe(true);
  });
  it('a near slip gives the one listening a lead', () => {
    let st, slip;
    for (const r of [0.05, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) {
      st = state();
      slip = planLaunch(st, ctx(r), { house: H }).checkins.find(c => c.kind === 'slip');
      if (slip) break;
    }
    expect(slip).toBeTruthy();
    const [who, heard] = slip.who;
    expect(st.theories?.[heard]?.[who]).toBeTruthy();
  });
});

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
describe('launch night, on screen', () => {
  const play = (extra = {}) => {
    const def = id => PRODUCTION_SECRETS.find(d => d.id === id);
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSignature: 'none', ssSecretRoom: 'off',
      ssSecrets: { ...productionSecret(def('fake-siblings'), ['Bowie', 'Chase']), ...productionSecret(def('accomplice'), ['Ripper']) }, ...extra });
    withSeededRandom(9, () => { simulateBBEpisode(); });
    delete seasonConfig.ssSecrets;
    return bbWeekSteps(gs.episodeHistory.find(r => r.num === 1), { host: 'Josh' }).filter(s => /^bb-ss-launch|^bb-ss-secrets/.test(String(s.id)));
  };
  // the user, 2026-10-28: "why is the presentation in the confessional? ... and your presentations are too short"
  // the user, 2026-10-29: "add an explanation of each production or shared secret in the airlock, and if necessary they
  // don't enter at the same time"; "the public has your secret, why is it always there, I don't see it as a twist";
  // "a secret revealed at the confessional is a back and forth with the host... at most two reveals of personal secrets"
  it('without the Public\'s Signs, each tells their own secret in the portrait; the airlock explains the roles; two live reveals at most', () => {
    const screens = play();
    const steps = screens.flatMap(s => s.steps);
    const text = steps.map(st => String(st.t || ''));
    expect(text.filter(t => /audience lifts its signs|turn around|privilege/i.test(t))).toEqual([]);
    // every personal secret, told on its card at the end of a portrait
    const personal = gs.bb.secretStory.secrets.filter(s => (s.holders || []).length === 1 && s.source !== 'production');
    // (the two who own theirs live keep it out of their portrait, so the confessional is where it comes out)
    const live = new Set(steps.filter(st => st.owns).map(st => st.by));
    for (const s of personal) expect(steps.some(st => st.card?.text === s.text && st.by === s.holders[0]), `${s.holders[0]}`).toBe(!live.has(s.holders[0]));
    // the roles, explained by the Voice in the airlock: the fake siblings walk in together, the accomplice gets orders
    expect(text.some(t => /Bowie and Chase, the Voice has given you a role/.test(t) || /Chase and Bowie, the Voice has given you a role/.test(t))).toBe(true);
    expect(text.some(t => /you are family\. Learn each other's lives/.test(t))).toBe(true);
    expect(text.some(t => /you will walk in together/.test(t))).toBe(true);
    expect(text.some(t => /Ripper, the Voice has given you a role/.test(t))).toBe(true);
    expect(text.some(t => /All summer, the Voice will give you orders/.test(t))).toBe(true);
    // the live reveals: two at most, each a conversation with the host
    const owns = steps.filter(st => st.owns);
    expect(owns.length).toBeGreaterThanOrEqual(1);
    expect(owns.length).toBeLessThanOrEqual(2);
    for (const o of owns) expect(steps.filter(st => st.k === 'dr' && st.live && st.by === o.by).length, o.by).toBeGreaterThanOrEqual(4);
  });
  it("with the Public's Signs on the timeline, the audience shows each secret, and the first one pays the privilege", () => {
    try {
      const text = play({ twistSchedule: [{ episode: 1, type: 'ss-public-signs' }] }).flatMap(s => s.steps).map(st => String(st.t || ''));
      expect(text.filter(t => /audience lifts its signs/.test(t)).length).toBeGreaterThanOrEqual(5);
      expect(text.some(t => /privilege/.test(t))).toBe(true);
    } finally { seasonConfig.twistSchedule = []; }
  });
  // the user, 2026-10-29: "why do they all say you'll have to guess where I'm from, I filled every descriptor in cast
  // setup" (the profile is on the franchise roster, not the cast entry); "I've watched every season" in season one
  it("reads each housemate's life from the franchise roster, and season one has no past seasons", () => {
    globalThis.FRANCHISE_ROSTER = NAMES.map((name, i) => ({ name, hometown: ['Riverton', 'Lakeside'][i % 2], occupation: 'Hairdresser', birthdate: '2000-05-01' }));
    try {
      const text = play().flatMap(s => s.steps).map(st => String(st.t || ''));
      for (const n of NAMES) expect(text.some(t => t.startsWith(`I'm ${n}. I'm from `)), n).toBe(true);
      expect(text.filter(t => /have to guess|every season|every single season|since I was a kid/i.test(t))).toEqual([]);
      expect(text.some(t => /^Bowie, \d+, from Riverton\. Hairdresser\./.test(t))).toBe(true);
    } finally { delete globalThis.FRANCHISE_ROSTER; }
  });
  it('every portrait is filmed out in their life, never in the confessional, and is long enough to meet them', () => {
    const screens = play().filter(s => /^bb-ss-launch-arr-/.test(String(s.id)));
    expect(screens.length).toBeGreaterThan(3);
    const lines = {};
    let inPortrait = false;
    for (const s of screens) for (const st of s.steps) {
      if (st.scene) inPortrait = !!st.scene.portrait;
      if (inPortrait) {
        expect(st.k, `${s.id}: ${st.t}`).not.toBe('dr');
        if (st.scene) expect(st.scene.bgUrl).toMatch(/^assets\/sets\//);
        if (st.k === 'say') (lines[st.by] ||= []).push(st.t);
      }
    }
    for (const n of NAMES) expect((lines[n] || []).length, n).toBeGreaterThanOrEqual(6);
    const text = Object.values(lines).flat().join(' ');
    expect(text).not.toMatch(/\b(HOH|veto|jury|houseguest|undefined|NaN)\b/);
  });
  it("on the list of secrets, a face only goes up after that housemate owns it, live, to Josh", () => {
    const screens = play();
    const owned = new Set();
    let faces = 0;
    for (const s of screens) for (const st of s.steps) {
      if (st.k === 'dr' && st.live && st.owns) owned.add(st.by);
      for (const r of st.secretlist?.rows || []) if (r.who) { faces++; expect(owned.has(r.who), `${r.who}'s face on "${r.text}"`).toBe(true); }
    }
    expect(faces).toBeGreaterThan(0);
  });
  it('the production secrets are set up on the night, and the words are clean', () => {
    const screens = play();
    const text = screens.flatMap(s => s.steps.map(st => String(st.t || '')));
    expect(text.some(t => /where am I from|Where am I from/.test(t))).toBe(true);
    expect(text.filter(t => /\bundefined\b|\bNaN\b|\[object/.test(t))).toEqual([]);
    // (no plain confessional on a live night: a live call or a portrait)
    for (const s of screens.filter(x => !/^bb-ss-launch-(arr|open)/.test(String(x.id)))) for (const st of s.steps) if (st.k === 'dr' && s.id !== 'bb-ss-launch-role') expect(st.live, `${s.id}: ${st.t}`).toBeTruthy();
  });
});

// the user, 2026-10-28: "for launch night just do the launch prime then the days; the first elimination prime is at
// episode 2, and episode 2 starts normally, days, then the prime"
describe('week one has no prime', () => {
  it('nobody is nominated or eliminated in week one; week two nominates and eliminates', () => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSignature: 'none', ssSecretRoom: 'off' });
    withSeededRandom(5, () => { simulateBBEpisode(); simulateBBEpisode(); });
    const [w1, w2] = [1, 2].map(n => gs.episodeHistory.find(r => r.num === n));
    expect(w1.eliminated).toBeNull();
    expect(w1.ssNoPrime).toBe(true);
    expect(w1.acts.some(a => ['nominations', 'ss-prime', 'eviction'].includes(a.type))).toBe(false);
    // the week still has its game, its hunt and two stretches of days
    expect(w1.acts.filter(a => a.type === 'house').length).toBeGreaterThanOrEqual(2);
    expect(w1.acts.some(a => a.type === 'ss-game')).toBe(true);
    expect(w2.eliminated).toBeTruthy();
    expect(w2.acts.some(a => a.type === 'ss-prime')).toBe(true);
    // on screen: launch night, the days closed by the narrator on next week's nominations, and no prime
    const steps = bbWeekSteps(w1, { host: 'Josh' });
    expect(steps.some(s => /^bb-ss-prime-/.test(String(s.id)))).toBe(false);
    const close = steps.find(s => s.id === 'bb-ss-tonight-w1');
    expect(close?.steps.some(st => /first nominations/.test(String(st.t)))).toBe(true);
  });
});
