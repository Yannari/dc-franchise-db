// The season timeline speaks Secret Story (the user, 2026-10-28: "I'm still seeing Big Brother twists when Secret
// Story is selected, and no Secret Story twists"). Its own twists, on its own shelves; Big Brother's never run in it;
// and a twist placed on a week happens that week.
import { describe, expect, it } from 'vitest';
import { TWIST_CATALOG, TWIST_CATEGORIES, twistsForFormat } from '../js/core.js';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, bbTwistsForWeek, runBBFinale } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';
import { ssRandomDraw, SS_CARD_IDS, FAKE_CARD } from '../js/ss/schedule.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { readSchedule } from '../js/bb/secret-story.js';

describe('the timeline for a Secret Story season', () => {
  it("offers Secret Story's twists, every one on a shelf with a button, and none of Big Brother's", () => {
    const cat = twistsForFormat({ format: 'secret-story' });
    expect(cat.length).toBeGreaterThanOrEqual(20);
    expect(cat.every(t => t.format === 'secret-story')).toBe(true);
    for (const id of ['ss-linked', 'ss-red-room', 'ss-bridge', 'ss-second-house', 'ss-false-voice', 'ss-robot', 'ss-house-decides', 'ss-ticket']) expect(cat.map(t => t.id)).toContain(id);
    const shelves = new Set(TWIST_CATEGORIES.map(c => c.id));
    for (const t of cat) { expect(shelves.has(t.category), t.id).toBe(true); expect(String(t.desc || '').length, t.id).toBeGreaterThan(120); }
    // (Big Brother keeps its own)
    expect(twistsForFormat({ format: 'big-brother' }).some(t => t.id === 'bb-double-eviction')).toBe(true);
    expect(twistsForFormat({ format: 'big-brother' }).some(t => t.format === 'secret-story')).toBe(false);
    // (twists of one kind never share a week: the incompatibilities are both ways)
    const byId = Object.fromEntries(TWIST_CATALOG.map(t => [t.id, t]));
    for (const t of cat) for (const o of t.incompatible || []) expect(byId[o]?.incompatible || [], `${t.id} / ${o}`).toContain(t.id);
  });
});

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
describe('a twist placed on a week', () => {
  it('happens that week; a Big Brother twist on the timeline does not run', () => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', themeArcStamped: '', bbSecretStory: undefined, ssSignature: 'none', ssSecretRoom: 'off',
      twistSchedule: [{ episode: 2, type: 'ss-red-room' }, { episode: 2, type: 'ss-bridge' }, { episode: 3, type: 'ss-house-decides' }, { episode: 3, type: 'bb-double-eviction' }] });
    expect(bbTwistsForWeek(3)).toEqual([]);
    withSeededRandom(5, () => { for (let i = 0; i < 3; i++) simulateBBEpisode(); });
    const st = gs.bb.secretStory;
    seasonConfig.twistSchedule = [];
    expect(st.weekTwists[2]?.kind).toBe('red-room');
    expect((st.primes || []).find(p => p.week === 2)?.theme).toBe('bridge');
    expect(gs.episodeHistory.find(r => r.num === 3).acts.find(a => a.type === 'eviction')?.ssPublic?.mode).toBe('house-decides');
  });
});

// the user, 2026-10-28: "the randomizer is not using at all the twists of Secret Story"
describe("the timeline's Randomize", () => {
  const weeks = Array.from({ length: 12 }, (_, i) => ({ ep: i + 1, active: 14 - Math.max(0, i - 1), finale: i === 11 }));
  const seeds = n => { let x = n; return () => ((x = (x * 9301 + 49297) % 233280) / 233280); };
  it("books only Secret Story cards, never on the final, and on week one only launch night's own", () => {
    const ids = new Set(twistsForFormat({ format: 'secret-story' }).map(t => t.id));
    let total = 0;
    for (let s = 1; s <= 40; s++) {
      const book = ssRandomDraw(seeds(s), weeks);
      total += book.length;
      for (const [ep, id] of book) {
        expect(ids.has(id), id).toBe(true);
        expect(SS_CARD_IDS.has(id)).toBe(true);
        // (week one has no prime: only launch night's own twist, the Public's Signs, goes there, and only there)
        expect(ep >= 2 || id === 'ss-public-signs', `${id} on week ${ep}`).toBe(true);
        if (id === 'ss-public-signs') expect(ep).toBe(1);
        expect(ep).toBeLessThan(12);
      }
      // a once-a-season card once
      for (const id of ['ss-for-life', 'ss-everybody', 'ss-ticket', 'ss-house-decides', 'ss-vote-to-evict']) expect(book.filter(b => b[1] === id).length).toBeLessThanOrEqual(1);
      expect(book.filter(b => /^ss-(second-house|clans|bears)$/.test(b[1])).length).toBeLessThanOrEqual(1);
      // (the season twist is the setup screen's, never a card)
      expect(book.some(b => /^ss-sig-/.test(b[1]))).toBe(false);
    }
    // (a season gets a real handful, not none and not one a week of everything)
    expect(total / 40).toBeGreaterThan(4);
    expect(total / 40).toBeLessThan(14);
  });
  it('a drawn season plays exactly its cards; a hand-placed card only pins its week', () => {
    const was = seasonConfig.twistSchedule;
    seasonConfig.twistSchedule = [{ episode: 3, type: 'ss-red-room', random: true }];
    const st = {};
    readSchedule(st, 3); readSchedule(st, 4);
    expect(st.forceWeekTwist).toEqual({ 3: 'red-room', 4: 'none' });
    expect(st.forcePrimeTheme[3]).toBe('none');
    expect(st.forceVoteMode[4]).toBe('save');
    expect(st.forceTicket[4]).toBe('none');
    seasonConfig.twistSchedule = [{ episode: 3, type: 'ss-red-room' }];
    const hand = {};
    readSchedule(hand, 3); readSchedule(hand, 4);
    expect(hand.forceWeekTwist).toEqual({ 3: 'red-room' });
    expect(hand.forcePrimeTheme).toBeUndefined();
    seasonConfig.twistSchedule = was;
  });
});

// the user, 2026-11-02: "secret box isnt in the list of the available twist... the voice doesnt explain it", then
// "season twist (the one that last a season) should be in SEASON STRUCTURE not in twist list and not be taken by the
// surprise twist too", and "remove them from the list of available twist"
describe("the season twist", () => {
  it('is not on the twist list: the setup screen chooses it', () => {
    const cat = twistsForFormat({ format: 'secret-story' });
    expect(cat.some(t => /^ss-sig-/.test(t.id) || t.ssSignature)).toBe(false);
    expect(TWIST_CATEGORIES.some(c => c.id === 'ss-signature')).toBe(false);
  });
  const play = (cfg, seed = 5) => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', themeArcStamped: '', bbSecretStory: undefined, ssSignature: 'random', ssSecretRoom: 'off', ssSurprise: 'on', ssTools: {}, twistSchedule: [], ...cfg });
    withSeededRandom(seed, () => simulateBBEpisode());
    return gs.bb.secretStory;
  };
  it('chosen in SEASON STRUCTURE, is the one the season plays, whatever Surprise twists says', () => {
    for (const id of ['secret-box', 'masters', 'thieves', 'yacht'])
      for (const ssSurprise of ['on', 'off']) expect(play({ ssSignature: id, ssSurprise }).draw.signature, `${id} ${ssSurprise}`).toBe(id);
    expect(play({ ssSignature: 'none' }).draw.signature).toBeNull();
    // (Random: the season draws one most of the time, with Surprise twists off too, and a season Randomize drew too)
    let drawn = 0;
    for (const seed of [1, 2, 3, 4, 6, 7, 8, 9]) drawn += play({ ssSurprise: seed % 2 ? 'off' : 'on', twistSchedule: [{ id: 'x', episode: 3, type: 'ss-red-room', random: true }] }, seed).draw.signature ? 1 : 0;
    expect(drawn).toBeGreaterThan(4);
  });
  it("the house options lock the season's tools; Random draws them", () => {
    const st = play({ ssTools: { phone: 'none', store: 'off', blackBuzzer: 'on', dilemmas: 'many', parties: 'random' } });
    expect(st.tools).toMatchObject({ phone: 'none', store: 'off', blackBuzzer: 'on', dilemmas: 'many' });
    expect(['some', 'often']).toContain(st.tools.parties);
  });
  it('is explained to the people at home on launch night, before the first housemate walks on', () => {
    play({ ssSignature: 'secret-box' });
    const screens = bbWeekSteps(gs.episodeHistory.at(-1), { host: 'Josh' });
    const i = screens.findIndex(s => s.id === 'bb-ss-launch-signature');
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(screens.findIndex(s => /^bb-ss-launch-arr-/.test(s.id)));
    const sc = screens[i];
    expect(sc.rules.length).toBeGreaterThanOrEqual(3);
    const said = sc.steps.map(st => st.t).join(' ');
    expect(said).toContain('The Secret Box');
    expect(said).toMatch(/find one housemate's secret/);
    expect(said).toMatch(/three weeks/);
    expect(sc.steps.at(-1).rule).toBe(sc.rules.length);
    // (the rules are about what is coming: on launch night "every week" stays every week, not "every day")
    play({ ssSignature: 'masters' });
    const m = bbWeekSteps(gs.episodeHistory.at(-1), { host: 'Josh' }).find(s => s.id === 'bb-ss-launch-signature');
    expect(m.steps.map(st => st.t).join(' ')).toMatch(/Every week, the two of them add one more housemate/);
    // (a season with no twist has no such screen)
    play({ ssSignature: 'none' });
    expect(bbWeekSteps(gs.episodeHistory.at(-1), { host: 'Josh' }).some(s => s.id === 'bb-ss-launch-signature')).toBe(false);
  });
});

// the user, 2026-11-02: "can we choose if those twist happen when theyre supposed to happen (top 12 top8 etc for
// example)", "or at the start", "make the option available depending of whats the twist"
describe('when the season twist starts', () => {
  const NAMES16 = [...NAMES, 'Ike', 'Jules', 'Kit', 'Lane'];
  const CAST16 = NAMES16.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
  const season = (cfg, weeks, seed = 4) => {
    seedGame(CAST16, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', themeArcStamped: '', bbSecretStory: undefined, ssSecretRoom: 'off', ssSurprise: 'on', ssTools: {}, twistSchedule: [], ...cfg });
    withSeededRandom(seed, () => { for (let i = 0; i < weeks; i++) if (!simulateBBEpisode()) break; });
    return gs.bb.secretStory;
  };
  it('offers each twist only the starts it can have', async () => {
    const { SIGNATURE_START, SIGNATURES, startAtOf } = await import('../js/ss/twists.js');
    for (const s of SIGNATURES.filter(x => x.built)) expect(SIGNATURE_START[s.id], s.id).toBeTruthy();
    for (const id of ['secret-box', 'intruders', 'crystal-house', 'hotel', 'yacht']) { expect(SIGNATURE_START[id].kind).toBe('launch'); expect(startAtOf(id, '10')).toBeNull(); }
    expect(startAtOf('masters', '10')).toBe(10);
    expect(startAtOf('masters', 'start')).toBeNull();
    expect(startAtOf('control-tower', 'auto')).toBeNull();
    expect(startAtOf('thieves', '5')).toBeNull();
  });
  it('a role "with N left" is handed out the first week the house is down to N, never on launch night', () => {
    const st = season({ ssSignature: 'masters', ssSignatureStart: '12' }, 9);
    const rows = gs.episodeHistory.filter(e => e?.format === 'big-brother');
    const given = rows.flatMap(e => (e.acts || []).filter(a => a?.type === 'ss-role-given').map(a => ({ week: e.num, a })));
    expect(given.length).toBe(1);
    expect(given[0].a.left).toBeLessThanOrEqual(12);
    expect(given[0].week).toBeGreaterThan(1);
    expect(st.role.pair).toEqual(given[0].a.pair);
    // (nothing of the role before it: no masters' nomination, no launch-night confessional)
    for (const e of rows.filter(r => r.num < given[0].week)) expect((e.acts || []).some(a => a?.type === 'ss-role')).toBe(false);
    const launch = bbWeekSteps(rows[0], { host: 'Josh' });
    expect(launch.some(s => s.id === 'bb-ss-launch-role')).toBe(false);
    const intro = launch.find(s => s.id === 'bb-ss-launch-signature');
    expect(intro.steps.map(x => x.t).join(' ')).toMatch(/When only 12 housemates are left, the Voice will choose two of them/);
    // (the week it starts: the Voice calls the two in, and says what the job is)
    const wk = bbWeekSteps(rows.find(r => r.num === given[0].week), { host: 'Josh' });
    const sc = wk.find(s => s.id === `bb-ss-role-given-w${given[0].week}`);
    expect(sc).toBeTruthy();
    expect(sc.steps.map(x => x.t).join(' ')).toMatch(/You are the Masters of the Nominations\./);
  });
  it("the Control Tower's first fake elimination comes the week the house is down to N", () => {
    const st = season({ ssSignature: 'control-tower', ssSignatureStart: '11' }, 9);
    const first = st.plan.fakes[0];
    expect(first.atSize).toBe(11);
    expect(first.week).toBeGreaterThan(1);
    const row = gs.episodeHistory.find(e => e.num === first.week);
    expect(row.gsSnapshot?.activePlayers?.length ?? 0).toBeLessThanOrEqual(12);
    expect(st.plan.fakes[1].week).toBeGreaterThan(first.week);
    // (and it played: the house believed somebody eliminated that week, and they went up to the tower)
    expect(first.used).toBe(true);
  });
  it('a hidden group starts on launch night whatever the setting says', () => {
    const st = season({ ssSignature: 'secret-box', ssSignatureStart: '10' }, 1);
    expect(st.group?.id).toBe('secret-box');
    expect(st.group.from).toBe(1);
  });
});

// the user, 2026-11-02: "fake elimination should be a schedulable twist not a house options"
describe('the fake elimination, a timeline card', () => {
  const NAMES16 = [...NAMES, 'Ike', 'Jules', 'Kit', 'Lane'];
  const CAST16 = NAMES16.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));
  const season = (cfg, weeks, seed = 4) => {
    seedGame(CAST16, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', themeArcStamped: '', bbSecretStory: undefined, ssSecretRoom: undefined, ssSignature: 'none', ssSurprise: 'on', ssTools: {}, twistSchedule: [], ...cfg });
    withSeededRandom(seed, () => { for (let i = 0; i < weeks; i++) if (!simulateBBEpisode()) break; });
    return gs.bb.secretStory;
  };
  const fakeWeeks = () => gs.episodeHistory.filter(r => r && (r.acts || []).some(a => (a?.type === 'ss-after' && a.fake) || (a?.type === 'ss-prime' && (a.segments || []).some(s => s?.kind === 'voluntary')))).map(r => r.num);
  it('is on the timeline, on a shelf, and explains itself', () => {
    const card = twistsForFormat({ format: 'secret-story' }).find(t => t.id === FAKE_CARD);
    expect(card).toBeTruthy();
    expect(TWIST_CATEGORIES.some(c => c.id === card.category)).toBe(true);
    expect(card.desc).toMatch(/secret room/);
    expect(SS_CARD_IDS.has(FAKE_CARD)).toBe(true);
  });
  it('plays the week it is put on, and the show adds none of its own', () => {
    for (const seed of [4, 5, 6]) {
      const st = season({ twistSchedule: [{ episode: 4, type: FAKE_CARD }] }, 7, seed);
      expect(fakeWeeks(), `seed ${seed}`).toEqual([4]);
      expect(st.plan.fakes.filter(x => !x.card)).toEqual([]);
      // (the timeline keeps the hand card and writes no second record on its week)
      expect(seasonConfig.twistSchedule.filter(x => Number(x.episode) === 4 && x.type === FAKE_CARD)).toHaveLength(1);
    }
  });
  it('a season with no card still gets the show\'s own, unless Surprise twists is off', () => {
    let any = false;
    for (const seed of [1, 2, 3, 4, 5, 6]) { season({}, 8, seed); if (fakeWeeks().length) any = true; }
    expect(any).toBe(true);
    for (const seed of [1, 2, 3]) { season({ ssSurprise: 'off' }, 8, seed); expect(fakeWeeks(), `seed ${seed}`).toEqual([]); }
  });
  it('the Randomize books it from week three, with eight or more in the house, never on a vote night', () => {
    const weeks = Array.from({ length: 13 }, (_, i) => ({ ep: i + 1, active: 16 - i, finale: i === 12 }));
    let booked = 0;
    for (let s = 1; s <= 200; s++) {
      let x = s;
      const rng = () => { x = (x * 16807) % 2147483647; return x / 2147483647; };
      const book = ssRandomDraw(rng, weeks);
      const fk = book.filter(([, id]) => id === FAKE_CARD).map(([ep]) => ep);
      booked += fk.length ? 1 : 0;
      for (const ep of fk) {
        expect(ep).toBeGreaterThanOrEqual(3);
        expect(weeks.find(w => w.ep === ep).active).toBeGreaterThanOrEqual(8);
        expect(book.some(([e, id]) => e === ep && ['ss-house-decides', 'ss-vote-to-evict'].includes(id))).toBe(false);
      }
    }
    expect(booked).toBeGreaterThan(90);
    expect(booked).toBeLessThan(170);
  });
});

// the user, 2026-11-02: "can the finale always show the percentage even when its selected to never shows"
// and: "semifinal dont show the percentage if the setting is off only the final the last read at the stage"
describe('the percentages at the end of the season', () => {
  it('the final shows them on the stage even when the season never does; the semi-final keeps the setting', () => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', themeArcStamped: '', bbSecretStory: undefined, ssSecretRoom: 'off', ssSignature: undefined, ssPercents: 'hide', twistSchedule: [] });
    withSeededRandom(9, () => { let n = 0; while ((gs.activePlayers || []).length > 3 && n < 24) { if (!simulateBBEpisode()) break; n++; } runBBFinale(); });
    const rows = gs.episodeHistory.filter(Boolean);
    const verdict = r => bbWeekSteps(r, { host: 'Josh' }).find(s => /^bb-ss-prime-verdict-w/.test(s.id));
    const semi = rows.find(r => (r.acts || []).some(a => a.type === 'ss-prime' && (a.segments || []).some(s => s.kind === 'unveil')));
    const sv = verdict(semi);
    expect(sv.steps.some(x => x.board?.title === "THE PUBLIC'S VOTE")).toBe(false);
    expect(sv.steps.some(x => /% of the vote/.test(x.t || ''))).toBe(false);
    // (the final: on the lines, where the stage draws it; each one as it is read, the winner's last)
    const fin = bbWeekSteps(rows.find(r => r.isFinale), { host: 'Josh' }).find(s => s.id === 'bb-ss-final-v');
    expect(fin.steps.map(x => x.t).join(' ')).toMatch(/with [0-9.]+% of the public's vote/);
    const boards = fin.steps.filter(x => x.board?.title === "THE PUBLIC'S VOTE").map(x => x.board.rows.filter(r => /%$/.test(r.text)).length);
    expect(boards.length).toBeGreaterThanOrEqual(2);
    expect(boards).toEqual([...boards].sort((a, b) => a - b));
    expect(boards.at(-1)).toBe(fin.steps.find(x => x.board).board.rows.length);
    expect(boards[0]).toBe(1);
    const win = fin.steps.find(x => x.confetti && x.big);
    expect(win.board.rows.every(r => /%$/.test(r.text))).toBe(true);
  });
});
