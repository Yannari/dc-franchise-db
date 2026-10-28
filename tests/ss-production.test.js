// Twist family 3: the production secrets play (js/ss/production.js). Each role's weekly job on its own (paid,
// failed, traced), the kitty ledger kept, and a season where the cast screen cast five roles: their scenes air.
import { describe, expect, it } from 'vitest';
import { productionWeek, roleOf, PLAYED, ROLE_JOBS } from '../js/ss/production.js';
import { ssProductionScreen } from '../js/vp-bb-ep/ss-production.js';
import { PRODUCTION_SECRETS, productionSecret } from '../js/ss/casting.js';
import { openKitties, balance, expectedTotal, actualTotal } from '../js/ss/kitty.js';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const H = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi', 'Gus'];
const BONDS = { 'Ana|Gus': -6, 'Gus|Ana': -6 };
const ctx = (r = 0.01, over = {}) => ({ rng: () => r, week: 3, stat: () => 7, bond: (a, b) => BONDS[`${a}|${b}`] ?? 0, looks: () => 0, ...over });
// a house where `role` is Ana's (and Ben's, for a pair) and everybody else keeps a personal secret
function house(role, pair = false) {
  const st = { secrets: [] };
  st.secrets.push({ id: 's-prod', poolId: `prod-${role}`, kind: pair ? 'voice-pair' : 'voice-mission', source: 'production', holders: pair ? ['Ana', 'Ben'] : ['Ana'], text: 'a role', clues: ['x', 'y'], difficulty: 0.6 });
  for (const n of H.filter(n => !(pair ? ['Ana', 'Ben'] : ['Ana']).includes(n))) st.secrets.push({ id: `s-${n}`, kind: 'personal', holders: [n], text: `${n}'s secret`, clues: ['c1', 'c2'], difficulty: 0.5 });
  openKitties(st, H, 10000, 0);
  return st;
}
const kept = st => expect(actualTotal(st)).toBe(expectedTotal(st));

describe('the catalogue', () => {
  it('every role the engine plays is in the catalogue, and every catalogue role plays (but the hidden groups)', () => {
    const ids = PRODUCTION_SECRETS.map(d => d.id);
    for (const r of PLAYED) expect(ids).toContain(r);
    for (const id of ids.filter(i => !['secret-box', 'intruders'].includes(i))) expect(PLAYED).toContain(id);
    expect(ids.length).toBeGreaterThanOrEqual(17);
  });
  it('reads the role from the catalogue id, and an old save from its words', () => {
    expect(roleOf({ poolId: 'prod-spy' })).toBe('spy');
    expect(roleOf({ text: 'We are a fake couple' })).toBe('fake-couple');
    expect(roleOf({ text: 'I trained dolphins' })).toBe(null);
  });
});

describe('the weekly jobs', () => {
  it("the Voice's accomplice is paid for an order done, and leaves a trace when it fails", () => {
    const st = house('accomplice');
    const [ok] = productionWeek(st, ctx(0.01), { house: H });
    expect(ok).toMatchObject({ role: 'accomplice', ok: true, money: 1000 });
    expect(balance(st, 'Ana')).toBe(11000);
    const [ko] = productionWeek(st, ctx(0.99, { week: 5 }), { house: H });
    expect(ko.ok).toBe(false);
    expect(ko.evidence.length).toBe(1);
    expect(ko.evidence[0][1]).toBe('Ana');
    kept(st);
  });
  it("a done order to make somebody buzz wrong leaves them believing a wrong secret", () => {
    const st = house('accomplice');
    const [e] = productionWeek(st, ctx(0.01), { house: H });
    expect(e.order).toBe('wrong-buzz');
    expect(e.mark).toBeTruthy();
    const th = st.theories?.[e.mark]?.[e.target];
    expect(th).toBeTruthy();
    expect(th.right).toBe(false);
  });
  it('a fake couple is paid together while the act holds', () => {
    const st = house('fake-couple', true);
    const [e] = productionWeek(st, ctx(0.01), { house: H });
    expect(e).toMatchObject({ role: 'fake-couple', ok: true });
    expect(e.act).toBeTruthy();
    expect(balance(st, 'Ana')).toBe(11000);
    expect(balance(st, 'Ben')).toBe(11000);
    kept(st);
  });
  it('the worst of enemies grow closer in private, whatever the house sees', () => {
    const st = house('enemies', true);
    const [e] = productionWeek(st, ctx(0.99), { house: H });
    expect(e.effects.bond.some(([a, b, d]) => a === 'Ana' && b === 'Ben' && d > 0)).toBe(true);
  });
  it('the chosen ones are immune once in a season, never twice', () => {
    const st = house('chosen', true);
    productionWeek(st, ctx(0.01, { week: 2 }), { house: H });
    expect(st.nextImmune[2]).toContain('Ana');
    productionWeek(st, ctx(0.01, { week: 4 }), { house: H });
    expect(st.nextImmune[4]).toBeUndefined();
  });
  it('the masters of the tunnels hear theories, and condemn somebody for life once', () => {
    const st = house('tunnels', true);
    const [e] = productionWeek(st, ctx(0.01), { house: H });
    expect(Object.keys(st.theories.Ana || {}).length).toBeGreaterThan(0);
    expect(e.life).toBeTruthy();
    expect(st.forLife).toMatchObject({ who: e.life, by: 'Ana' });
    const [again] = productionWeek(st, ctx(0.01, { week: 5 }), { house: H });
    expect(again.life).toBe(null);
  });
  it('the guardians take a liar\'s money when they are right, and pay when wrong', () => {
    const st = house('guardians');
    const [e] = productionWeek(st, ctx(0.01), { house: H });
    expect(e.liar).toBe('Gus');
    expect(e.ok).toBe(true);
    expect(balance(st, 'Gus')).toBe(8500);
    expect(balance(st, 'Ana')).toBe(11500);
    const st2 = house('guardians');
    const [w] = productionWeek(st2, ctx(0.99, { stat: () => 7 }), { house: H });
    expect(w.ok).toBe(false);
    expect(balance(st2, 'Ana')).toBe(9500);
    kept(st); kept(st2);
  });
  it('the saboteur puts a false lead on the table', () => {
    const st = house('saboteur');
    const [e] = productionWeek(st, ctx(0.01), { house: H });
    expect(e.ok).toBe(true);
    expect(st.shownClues.some(c => c.fake && c.how === 'sabotage')).toBe(true);
  });
  it("the internet's spy shows the country somebody's private moment", () => {
    const st = house('spy');
    const [e] = productionWeek(st, ctx(0.01), { house: H });
    expect(e.subject).toBeTruthy();
    expect(e.effects.pub.some(([n, axis]) => n === e.subject && axis === 'seen')).toBe(true);
  });
  it('the oracle overhears one conversation a week, and finds the lock once', () => {
    const st = house('oracle');
    const [e] = productionWeek(st, ctx(0.01), { house: H });
    expect(e.heard).toBeTruthy();
    expect(e.lock).toBe(true);
    const [again] = productionWeek(st, ctx(0.01, { week: 5 }), { house: H });
    expect(again.lock).toBe(false);
    kept(st);
  });
  it("the couple's protector shields a couple's secret and is paid for it", () => {
    const st = house('protector');
    st.secrets.push({ id: 's-pair', kind: 'real-pair', holders: ['Cy', 'Di'], text: 'We are cousins', clues: ['a'], difficulty: 0.5 });
    st.secrets = st.secrets.filter(s => !(s.holders.length === 1 && ['Cy', 'Di'].includes(s.holders[0])));
    const [e] = productionWeek(st, ctx(0.01), { house: H });
    expect(e.couple).toEqual(['Cy', 'Di']);
    expect(e.ok).toBe(true);
    expect(balance(st, 'Ana')).toBe(11000);
  });
  it('no more than three roles a week, and never the same role two weeks running', () => {
    const st = { secrets: [] };
    const roles = ['accomplice', 'spy', 'saboteur', 'oracle', 'guardians'];
    roles.forEach((r, i) => st.secrets.push({ id: `p${i}`, poolId: `prod-${r}`, source: 'production', holders: [H[i]], text: r, clues: ['x'], difficulty: 0.6 }));
    st.secrets.push({ id: 'g', kind: 'personal', holders: ['Fi'], text: 'f', clues: ['c'], difficulty: 0.5 }, { id: 'h', kind: 'personal', holders: ['Gus'], text: 'g', clues: ['c'], difficulty: 0.5 });
    openKitties(st, H, 10000, 0);
    const w2 = productionWeek(st, ctx(0.5, { week: 2 }), { house: H }).map(e => e.role);
    const w3 = productionWeek(st, ctx(0.5, { week: 3 }), { house: H }).map(e => e.role);
    expect(w2.length).toBe(3);
    expect(w3.length).toBe(2);
    expect(w3.filter(r => w2.includes(r))).toEqual([]);
  });
  it("the couple's protector never shields another production role's act", () => {
    const st = house('protector');
    st.secrets.push({ id: 's-fc', poolId: 'prod-fake-couple', source: 'production', holders: ['Cy', 'Di'], text: 'We are a fake couple', clues: ['a'], difficulty: 0.6 });
    expect(productionWeek(st, ctx(0.01), { house: H }).filter(e => e.role === 'protector')).toEqual([]);
  });
  it('a found secret stops its job', () => {
    const st = house('accomplice');
    st.secrets[0].found = true;
    expect(productionWeek(st, ctx(0.01), { house: H })).toEqual([]);
  });
});

describe('a production secret the user wrote', () => {
  it('plays like the role the user chose, keeps its own clues, and an unknown role plays nothing', () => {
    expect(roleOf({ text: 'We are secretly married', plays: 'fake-couple' })).toBe('fake-couple');
    expect(roleOf({ text: 'I am a mole', plays: 'nonsense' })).toBe(null);
    const e = productionSecret({ text: 'We are secretly married', plays: 'fake-couple', clues: ['a ring on a chain'] }, ['Ana', 'Ben']);
    expect(e.Ana).toMatchObject({ source: 'production', plays: 'fake-couple', group: ['Ana', 'Ben'] });
    expect(e.Ana.clues).toContain('a ring on a chain');
    expect(ROLE_JOBS.map(r => r.id).sort()).toEqual([...PLAYED].sort());
  });
  it('plays in a season, under its own words', () => {
    const chosen = productionSecret({ text: 'We are secretly married', plays: 'fake-couple', clues: ['a ring on a chain', 'one suitcase for two'] }, ['Bowie', 'Chase']);
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSignature: 'none', ssSecretRoom: 'off', ssSecrets: chosen });
    withSeededRandom(3, () => { simulateBBEpisode(); simulateBBEpisode(); });
    delete seasonConfig.ssSecrets;
    expect(gs.bb.secretStory.secrets.find(x => x.holders.includes('Bowie'))).toMatchObject({ plays: 'fake-couple', text: 'We are secretly married' });
    const act = gs.episodeHistory.flatMap(r => r.acts).find(a => a.type === 'ss-production');
    expect(act).toMatchObject({ role: 'fake-couple', custom: true, text: 'We are secretly married' });
    const scr = ssProductionScreen(act, { week: 1, house: NAMES }, { ssv: (t, x = {}) => ({ k: 'voice', t, ...x }) });
    expect(scr.title).toBe('A Production Secret');
    expect(scr.sub).toBe('We are secretly married');
  });
});

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
describe('a season with five roles cast', () => {
  it('every role plays, its scene airs in house life, and the words are clean', () => {
    const def = id => PRODUCTION_SECRETS.find(d => d.id === id);
    const chosen = { ...productionSecret(def('fake-couple'), ['Bowie', 'Chase']), ...productionSecret(def('accomplice'), ['Ripper']),
      ...productionSecret(def('spy'), ['Scary']), ...productionSecret(def('guardians'), ['Nichelle', 'Axel']), ...productionSecret(def('oracle'), ['Zee']) };
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSignature: 'none', ssSecretRoom: 'off', ssSecrets: chosen });
    withSeededRandom(3, () => { simulateBBEpisode(); simulateBBEpisode(); simulateBBEpisode(); });
    delete seasonConfig.ssSecrets;
    const acts = gs.episodeHistory.flatMap(r => r.acts.filter(a => a.type === 'ss-production'));
    expect(new Set(acts.map(a => a.role)).size).toBeGreaterThanOrEqual(4);
    for (const r of gs.episodeHistory.filter(r => r.num >= 1)) {
      const screens = bbWeekSteps(r, { host: 'Josh' });
      const text = screens.flatMap(s => s.steps.map(st => String(st.t || '')));
      expect(text.filter(t => /\bundefined\b|\bNaN\b|\[object/.test(t))).toEqual([]);
      const mine = r.acts.filter(a => a.type === 'ss-production');
      // a role's scene folds into house life: its words air, not as a screen of its own
      for (const a of mine) expect(text.some(t => t.includes(a.holders[0]))).toBe(true);
    }
    const s = gs.bb.secretStory;
    expect(actualTotal(s)).toBe(expectedTotal(s));
  });
});
