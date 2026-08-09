// Summer of Temptation, played.
//
// The theme is nearly pure composition — the Den, the powers shelf and the
// Halting Hex are all built — which is exactly why it is the first one. If the
// engine cannot assemble a season out of parts we already own, that is the
// cheapest possible week to find out.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { themeState, themeVoice, advanceThemeArc, themeScheduleEntries,
  currentTheme, themeAccent, BB_THEMES } from '../js/bb/themes.js';
import { simulateBBWeek } from '../js/bb/week.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(extra = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme: 'summer-of-temptation' }, extra);
  seasonConfig.twistSchedule = [];
}

const play = (seed = 2026) => withSeededRandom(seed, () => simulateBBEpisode());

const THEME = () => BB_THEMES['summer-of-temptation'];

describe('Summer of Temptation', () => {
  beforeEach(() => house());

  it('installs itself and books its arc on the first episode', () => {
    play();
    const st = themeState();
    expect(st.id).toBe('summer-of-temptation');
    expect(st.booked.length).toBeGreaterThan(0);
    expect(seasonConfig.twistSchedule.every(t => t.source === 'theme')).toBe(true);
  });

  it('books the Den, because that is what the season is', () => {
    play();
    expect(themeState().booked).toContain('bb-den-of-temptation');
  });

  it('speaks in the first week', () => {
    const ep = play();
    const said = (ep.acts || []).filter(a => a.type === 'theme-beat');
    expect(said.length).toBeGreaterThan(0);
    expect(said[0].speaker).toBe('The Den');
  });

  it('leaves a week you booked yourself alone', () => {
    house();
    seasonConfig.twistSchedule = [{ id: 'mine', episode: 2, type: 'bb-roadkill' }];
    play();
    const wk2 = seasonConfig.twistSchedule.filter(t => Number(t.episode) === 2);
    expect(wk2).toHaveLength(1);
    expect(wk2[0].type).toBe('bb-roadkill');
  });

  it('plays a full season without throwing', () => {
    withSeededRandom(31, () => {
      let guard = 0;
      while ((gs.activePlayers || []).length > 3 && guard++ < 40) {
        if (!simulateBBEpisode()) break;
      }
      expect(gs.activePlayers.length).toBe(3);
    });
  });

  it('replays identically from the same seed', () => {
    const a = JSON.stringify(play(909).acts.map(x => x.type));
    house();
    const b = JSON.stringify(play(909).acts.map(x => x.type));
    expect(a).toBe(b);
  });
});

// ── the arc, as an object ──
//
// The played tests above cannot see a booking that lands past week one, and a
// season only reaches week seven if nothing throws for six weeks first. These
// read the descriptor and the scheduler directly, so a mis-authored `at` is
// caught by name rather than by a distant season behaving oddly.
describe('the arc it actually books', () => {
  beforeEach(() => house());

  it('lays the whole arc onto a twelve-house season', () => {
    play();
    const mine = seasonConfig.twistSchedule
      .filter(t => t.source === 'theme')
      .map(t => [Number(t.episode), t.type])
      .sort((a, b) => a[0] - b[0]);
    // Twelve houseguests end at three, so nine weeks: fromEnd 4 is week 6 and
    // fromEnd 3 is week 7.
    expect(mine).toEqual([
      [2, 'bb-den-of-temptation'],
      [3, 'bb-have-nots'],
      [5, 'bb-den-of-temptation'],
      [6, 'bb-pandoras-box'],
      [7, 'bb-double-eviction'],
    ]);
  });

  // The Halting Hex is a POWER, not a twist card, so it can only reach a season
  // as a grant. Booking it directly would fail the registry test in
  // bb-themes.test.js; this pins the other half — that the arc still gets it
  // into the house, via the distributor that hands powers out.
  it('reaches the Halting Hex through Pandora rather than booking it', () => {
    play();
    const box = seasonConfig.twistSchedule.find(t => t.type === 'bb-pandoras-box');
    expect(box.prize).toBe('halting-hex');
    expect(seasonConfig.twistSchedule.some(t => t.type === 'halting-hex')).toBe(false);
    expect(TWIST_CATALOG.some(c => c.id === 'halting-hex')).toBe(false);
  });

  // A double eviction below a house of six is refused by the engine, and the
  // last weeks of a season run 5 -> 4 -> 3. An arc act that books one at
  // `fromEnd: 1` or `2` does not error — it silently never fires, which is the
  // worse failure and the one no other test in this repo would notice.
  it('books the double eviction where a double eviction can still happen', () => {
    const de = THEME().arc.find(a => a.book === 'bb-double-eviction');
    expect(de.at.fromEnd).toBeGreaterThanOrEqual(3);
  });

  it('books no twist that is not in the catalogue', () => {
    const ids = new Set(TWIST_CATALOG.map(c => c.id));
    for (const act of THEME().arc) {
      if (act.book) expect(ids, act.book).toContain(act.book);
    }
  });
});

// ── every cast size, not just the one it was written for ──
//
// The arc was authored against a twelve-house season and quietly degraded on
// every smaller one: eleven put the Den and Pandora's Box in the same week, ten
// the Den and the double eviction, seven opened the box in week ONE, and six
// made the double eviction the season's first act. Nothing threw. The authored
// escalation simply ran backwards, which is invisible unless something asserts
// the shape rather than the contents.
//
// Cast six is the floor the week engine supports; eighteen is a long season.
const CASTS = Array.from({ length: 13 }, (_, i) => i + 6);
const ORDER = ['bb-den-of-temptation', 'bb-have-nots', 'bb-den-of-temptation',
  'bb-pandoras-box', 'bb-double-eviction'];

describe('the arc holds its shape at every cast size', () => {
  beforeEach(() => house());

  it.each(CASTS)('cast %i: one booking a week, in the authored order', size => {
    const weeks = size - 3;
    const out = themeScheduleEntries(THEME(), { weeks, existing: [] });

    // One week, one theme act. The old dedupe was `episode:book`, so two
    // DIFFERENT acts landing on one week was not counted as a collision.
    const byWeek = out.map(e => Number(e.episode));
    expect(new Set(byWeek).size, `two theme acts share a week: ${byWeek}`).toBe(byWeek.length);

    // Strictly increasing, and inside the season.
    for (const [i, ep] of byWeek.entries()) {
      expect(ep, `week ${ep} is outside a ${weeks}-week season`).toBeGreaterThanOrEqual(1);
      expect(ep).toBeLessThanOrEqual(weeks);
      if (i) expect(ep, 'the arc ran backwards').toBeGreaterThan(byWeek[i - 1]);
    }

    // What survived is a PREFIX-preserving subsequence of the authored running
    // order: acts may be dropped when a short season has no room, never
    // reordered. This is the assertion that fails if a `fromEnd` act ever
    // overtakes a fixed one again.
    let at = 0;
    for (const type of out.map(e => e.type)) {
      const found = ORDER.indexOf(type, at);
      expect(found, `${type} arrived out of order at cast ${size}`).toBeGreaterThanOrEqual(0);
      at = found + 1;
    }
  });

  it.each(CASTS)('cast %i: the Den always opens the season', size => {
    const out = themeScheduleEntries(THEME(), { weeks: size - 3, existing: [] });
    expect(out.length, 'the arc booked nothing at all').toBeGreaterThan(0);
    expect(out[0].type).toBe('bb-den-of-temptation');
  });

  it.each(CASTS)('cast %i: the Den hardens, and before the endgame', size => {
    const weeks = size - 3;
    // A fresh state per size, standing in for the season this cast would play.
    gs.bb = { weeks: [], theme: { id: THEME().id, mood: 'neutral', booked: [], said: [] } };
    let turned = 0;
    for (let w = 1; w <= weeks; w++) {
      advanceThemeArc(w, weeks);
      if (!turned && themeState().mood === 'hostile') turned = w;
    }
    // Pinned to an absolute week 6 alone, this never fired below a nine-house
    // cast: the mood stayed neutral for the whole run and half the authored
    // voice plus the entire `is-hostile` reader styling were unreachable.
    expect(turned, `the Den never turned on a ${weeks}-week season`).toBeGreaterThan(0);
    expect(themeState().mood).toBe('hostile');

    const de = themeScheduleEntries(THEME(), { weeks, existing: [] })
      .find(e => e.type === 'bb-double-eviction');
    if (de) expect(turned, 'it turned at or after the endgame').toBeLessThan(Number(de.episode));
  });

  // The engine-level guarantee, not this theme's: a week the user booked is
  // still theirs, and refusing it must not let the NEXT act overtake it either.
  it('never takes a week you booked yourself, at any size', () => {
    for (const size of CASTS) {
      const weeks = size - 3;
      const mine = Array.from({ length: weeks }, (_, i) => (
        { id: `mine-${i}`, episode: i + 1, type: 'bb-roadkill' }));
      expect(themeScheduleEntries(THEME(), { weeks, existing: mine })).toEqual([]);
      // And one week in the middle of the arc.
      const one = [{ id: 'mine', episode: 3, type: 'bb-roadkill' }];
      const out = themeScheduleEntries(THEME(), { weeks, existing: one });
      expect(out.some(e => Number(e.episode) === 3), `cast ${size}`).toBe(false);
    }
  });
});

// ── the picker is not the season ──
//
// `cfg-theme` saves on change and `prepareHouse` reinstalls every episode, so
// switching themes in week five was live-reachable. `installTheme` asked "is a
// theme installed?" when it meant "is THIS theme installed?", so the house got
// the new theme's voice, moods, act stamps and reader skin sitting on top of
// the old theme's state and the old theme's bookings — and `advanceThemeArc`
// walked one arc while mutating the other's mood. Nothing threw.
describe('a season keeps the theme it started', () => {
  const OTHER = {
    id: 'other-theme', name: 'Other', tagline: 't', house: 'bb-house',
    palette: { accent: '#00ff00' }, fonts: { display: 'x', body: 'y' },
    antagonist: { name: 'Something Else', mood: 'neutral',
      voice: { open: { neutral: ['Not the Den at all.'] } } },
    arc: [{ at: { week: 1 }, book: 'bb-roadkill' }, { at: { week: 1 }, mood: 'furious' }],
    books: [], weights: {}, bans: [], exclusive: [],
  };

  beforeEach(() => { house(); BB_THEMES[OTHER.id] = OTHER; });
  afterEach(() => { delete BB_THEMES[OTHER.id]; });

  it('ignores a mid-season switch to another theme', () => {
    play();
    const before = JSON.parse(JSON.stringify(seasonConfig.twistSchedule));
    seasonConfig.theme = OTHER.id;                 // the user flips the picker

    const ep = play(1212);
    expect(themeState().id, 'the other theme moved into this season\'s state')
      .toBe('summer-of-temptation');
    expect(seasonConfig.twistSchedule, 'the other theme booked over the arc').toEqual(before);
    for (const a of (ep.acts || []).filter(a => a.type === 'theme-beat')) {
      expect(a.speaker, 'the other theme is speaking in this house').toBe('The Den');
      expect(a.themeId).toBe('summer-of-temptation');
    }
    // And the reader is still wearing the season it started in.
    expect(themeAccent()).toBe(BB_THEMES['summer-of-temptation'].palette.accent);
  });

  it('does not let another theme\'s arc move this one\'s mood', () => {
    play();
    seasonConfig.theme = OTHER.id;
    // OTHER's arc sets 'furious' in week 1. If currentTheme() read the picker,
    // this would walk that arc and stamp it onto the Den's state.
    advanceThemeArc(1, 9);
    expect(themeState().mood).toBe('neutral');
  });

  // A save made before the theme engine existed has `gs.bb` but no `.theme`.
  // Picking a theme then installed it MID-SEASON, booking week 2 and week 3
  // onto a season already in week nine.
  it('refuses to install into a season already under way', () => {
    house({ theme: 'none' });
    play();                                        // week 1, unthemed
    play();                                        // week 2, unthemed
    expect(gs.bb.weeks.length).toBeGreaterThan(1);
    expect(themeState()).toBeNull();

    seasonConfig.theme = 'summer-of-temptation';   // the user picks one now
    const ep = play(88);

    expect(themeState(), 'a theme installed itself into an aired season').toBeNull();
    expect(seasonConfig.twistSchedule.some(t => t?.source === 'theme')).toBe(false);
    expect((ep.acts || []).some(a => a.type === 'theme-beat')).toBe(false);
    expect(currentTheme()).toBeNull();
  });

  it('still installs on the season after that one', () => {
    house({ theme: 'none' });
    play();
    seasonConfig.theme = 'summer-of-temptation';
    house();                                       // a fresh house, same config
    play();
    expect(themeState().id).toBe('summer-of-temptation');
    expect(themeState().booked.length).toBeGreaterThan(0);
  });
});

// ── the heel turn ──
describe('the Den stops asking', () => {
  beforeEach(() => house());

  it('escalates to the literal mood the reader styles on', () => {
    // Not any old truthy string: rpBuildBBThemeBeat keys `is-hostile` off
    // exactly `'hostile'`, so a renamed mood loses the styling in silence.
    const turn = THEME().arc.find(a => a.mood);
    expect(turn.mood).toBe('hostile');
  });

  it('is neutral before the turn and hostile after it', () => {
    play();
    expect(themeState().mood).toBe('neutral');
    // Nine weeks in a twelve-house season, so week 6 is the arc's turn.
    advanceThemeArc(5, 9);
    expect(themeState().mood).toBe('neutral');
    advanceThemeArc(6, 9);
    expect(themeState().mood).toBe('hostile');
    // And it stays turned — a heel turn is not a one-week costume.
    advanceThemeArc(7, 9);
    expect(themeState().mood).toBe('hostile');
  });

  it('changes what the Den says when it turns', () => {
    play();
    const calm = themeVoice('open', { week: 6 }).line;
    advanceThemeArc(6, 9);
    const said = themeVoice('open', { week: 6 });
    expect(said.line).not.toBe(calm);
    expect(said.mood).toBe('hostile');
    // Really from the hostile pool, not merely a different neutral draw.
    const fill = t => t.replace('{week}', '6');
    expect(THEME().antagonist.voice.open.hostile.map(fill)).toContain(said.line);
  });

  it('does nothing at all on a season with no theme', () => {
    seasonConfig.theme = 'none';
    expect(advanceThemeArc(6, 9)).toBeNull();
  });
});

// ── the voice ──
//
// The pools are the thing that makes the roster bug below observable, and they
// have their own failure mode: a pool whose every line carries a token can go
// silent on a week that cannot fill it.
describe('the Den has something to say every week', () => {
  beforeEach(() => { house(); play(); });

  const HOOKS = ['open', 'noms', 'veto', 'vote'];

  it('carries at least four variants per hook and mood', () => {
    const voice = THEME().antagonist.voice;
    for (const hook of HOOKS) {
      for (const [mood, pool] of Object.entries(voice[hook])) {
        expect(pool.length, `${hook}/${mood}`).toBeGreaterThanOrEqual(4);
        expect(new Set(pool).size, `${hook}/${mood} repeats itself`).toBe(pool.length);
      }
    }
  });

  // The pool walk needs somewhere to land. A sealed HOH, a week nobody accepted
  // an offer and a skipped veto all hand the hook nulls, and if every line in
  // the pool needs a name the antagonist simply goes quiet.
  //
  // `vote` is exempt on purpose and is the one hook that SHOULD go quiet: a
  // night nobody left — the Halting Hex un-evicts somebody after the count — is
  // a night with no departure to announce, and bb-themes.test.js pins exactly
  // that behaviour.
  it('always has a line that needs no name at all', () => {
    const voice = THEME().antagonist.voice;
    for (const hook of ['open', 'noms', 'veto']) {
      for (const [mood, pool] of Object.entries(voice[hook])) {
        const nameless = pool.filter(l => !/\{(hoh|nominees|veto|cursed|evicted)\}/.test(l));
        expect(nameless.length, `${hook}/${mood} can be silenced`).toBeGreaterThan(0);
      }
    }
  });

  it('speaks at every hook on a week that hands it nothing but a number', () => {
    for (const hook of HOOKS) {
      const said = themeVoice(hook, { week: 4, hoh: null, nominees: [], evicted: 'Chase' });
      expect(said, hook).not.toBeNull();
    }
  });

  it('says nothing at the count on a night the Hex kept everybody in', () => {
    expect(themeVoice('vote', { week: 4, evicted: null, hoh: null })).toBeNull();
  });

  // The margin is the only token that reads something the HOUSE DID rather than
  // a name it holds, and it is the only one a test can catch being wrong: the
  // first version read `week.votes` as a ballot list when it is a tally, and
  // every eviction in a played season was announced as "0-1". Confidently
  // wrong, and completely invisible — a name token that misresolves is refused,
  // a number that misresolves just prints.
  it('reads the vote as the house would count it', () => {
    house();
    let seen = 0;
    withSeededRandom(515, () => {
      for (let w = 0; w < 6; w++) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        const week = gs.bb.weeks[gs.bb.weeks.length - 1];
        for (const a of (ep.acts || [])) {
          if (a.type !== 'theme-beat' || a.hook !== 'vote') continue;
          const m = a.line.match(/(\d+)-(\d+)/);
          if (!m) continue;
          seen++;
          const against = Number(m[1]), rest = Number(m[2]);
          expect(against, `nobody was voted out ${against}-${rest}`).toBeGreaterThan(0);
          expect(against).toBe(Number((week.votes || {})[week.evicted] || 0));
          expect(against + rest).toBeLessThanOrEqual((week.houseAtStart || []).length);
        }
      }
    });
    expect(seen, 'no margin line ever drew — the token is unreachable').toBeGreaterThan(0);
  });

  // The season's thesis, mechanised: the chair belongs to somebody who was
  // never in the room, and the Den is the only voice in the building that can
  // say so.
  it('names the cursed houseguest when a curse actually seated one', () => {
    const said = themeVoice('noms', { week: 5, hoh: 'Bowie', nominees: ['Chase', 'Ripper'],
      cursed: 'Scary', house: NAMES });
    expect(said).not.toBeNull();
    // Not asserting WHICH line — the draw is seeded — only that the token
    // resolves rather than being refused or left as a brace.
    expect(said.line).not.toContain('{');
  });

  it('refuses to name a cursed houseguest who is not in the house', () => {
    const cursedLine = THEME().antagonist.voice.noms.neutral.find(l => l.includes('{cursed}'));
    expect(cursedLine, 'no line reads the curse at all').toBeTruthy();
    // Directly: the pool walk would otherwise hide this behind a fallback.
    const said = themeVoice('noms', { week: 5, hoh: 'Bowie', nominees: ['Chase'],
      cursed: 'Ghost', house: NAMES });
    expect(said.line).not.toContain('Ghost');
  });
});

// ── the roster the antagonist is allowed to know ──
//
// `inHouse` read `gs.activePlayers` while the week engine plays its own
// roster-scoped `house`. On a Split House cycle those are two different lists,
// and the failure is silent in both directions: a legitimate `{nominees}` line
// is refused and the pool walk falls through to the least specific line in the
// pool, so the Den reads as thin writing for a whole side of the week. This was
// invisible while the only registered theme had one untokenised line.
describe('the Den knows which house it is talking about', () => {
  beforeEach(() => { house(); play(); });

  // Swept across twelve weeks rather than asserted on one, because the draw is
  // seeded: any single week may legitimately land on one of the pool's
  // untokenised lines. What cannot happen is that NONE of twelve weeks names
  // anybody — that is the refusal, and it reads as thin writing rather than as
  // a bug, which is exactly why it needs a test.
  const sweep = ctx => Array.from({ length: 12 }, (_, i) =>
    (themeVoice('noms', { ...ctx, week: i + 1 }) || {}).line || '');

  it('speaks about the half-house it was handed, not the whole roster', () => {
    const side = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle'];
    gs.activePlayers = ['Axel', 'Zee', 'Brightly', 'Hicks'];   // the OTHER side
    const lines = sweep({ hoh: 'Bowie', nominees: ['Chase', 'Ripper'], house: side });
    expect(lines.every(Boolean), 'the Den went silent on a side of the house').toBe(true);
    expect(lines.some(l => l.includes('Chase')),
      'every line naming the block was refused — the roster did not reach fillLine').toBe(true);
  });

  it('goes generic when the roster really does not have them', () => {
    // Same call, no `house`, and a live roster the block is not in: now the
    // refusals are correct and nobody is named.
    gs.activePlayers = ['Axel', 'Zee', 'Brightly', 'Hicks'];
    const lines = sweep({ hoh: 'Bowie', nominees: ['Chase', 'Ripper'] });
    expect(lines.some(l => l.includes('Chase'))).toBe(false);
    expect(lines.some(l => l.includes('Bowie'))).toBe(false);
  });

  it('still refuses somebody who is in neither', () => {
    const side = ['Bowie', 'Chase', 'Ripper'];
    gs.activePlayers = [...side];
    expect(sweep({ hoh: 'Ghost', nominees: ['Chase'], house: side })
      .some(l => l.includes('Ghost'))).toBe(false);
  });

  // The fallback is what keeps themeVoice callable with no roster at all, which
  // every unit test in bb-themes.test.js relies on.
  it('falls back to the live roster when the caller has no house', () => {
    gs.activePlayers = ['Bowie', 'Chase', 'Ripper'];
    const lines = sweep({ hoh: 'Bowie', nominees: ['Chase', 'Ripper'] });
    expect(lines.some(l => l.includes('Bowie'))).toBe(true);
  });

  // THE WIRING, not the function. Every test above calls `themeVoice` directly,
  // and on the played path `options.house` and `gs.activePlayers` are the same
  // list — so deleting the `house:` argument from `_themeSay` leaves all of
  // them green. This is the one that goes red: the week engine is handed a
  // roster that shares nobody with `gs.activePlayers`, which is the shape a
  // Split House cycle has if its narrowing ever slips, and the Den must talk
  // about the people actually in front of it.
  it('is handed the week roster by the week engine, not the global one', () => {
    const side = gs.activePlayers.slice(0, 6);
    const other = gs.activePlayers.slice(6);
    const week = withSeededRandom(77, () => {
      gs.activePlayers = [...other];
      try {
        return simulateBBWeek({ house: [...side] });
      } finally {
        gs.activePlayers = [...side, ...other];
      }
    });
    // `vote` is excluded: `{evicted}` is the one token with no roster guard —
    // there is nothing to check it against — so a vote line names somebody
    // whether or not the roster arrived, and counting it would make this test
    // pass for the wrong reason.
    const named = (week.acts || [])
      .filter(a => a.type === 'theme-beat' && a.hook !== 'vote')
      .filter(b => side.some(n => b.line.includes(n)));
    expect(named.length,
      'the Den named nobody on its own side — _themeSay stopped passing the week roster')
      .toBeGreaterThan(0);
  });

  // ── one Thursday, two half-houses, one week number ──
  //
  // Both sides of a Split House run the whole week engine and both push a week
  // record, so side B's `week.num` is one higher than side A's for the same
  // night — and `options.house` is half the roster. The antagonist printed two
  // different week numbers for one week, and measured the endgame at roughly
  // half its real distance, which is the same disagreement between bookings and
  // moods that `_totalWeeks` exists to prevent.
  it('calls both halves of a split week the same week', () => {
    const full = [...gs.activePlayers];
    const a = full.slice(0, Math.ceil(full.length / 2));
    const b = full.slice(Math.ceil(full.length / 2));
    const play1 = (side, other, segment, splitSide) => withSeededRandom(2 + segment, () => {
      const before = [...gs.activePlayers];
      gs.activePlayers = [...side];
      try {
        return simulateBBWeek({ house: [...side], segment, splitSide,
          splitOther: [...other], skipOpeningHouse: true });
      } finally { gs.activePlayers = before; }
    });
    const wkA = play1(a, b, 1, 'A');
    const wkB = play1(b, a, 2, 'B');

    // The raw records really do disagree — that is the condition being handled,
    // not an assumption about it.
    expect(wkB.num).toBe(wkA.num + 1);
    // What the audience is told does not.
    expect(wkB.themeWeek).toBe(wkA.themeWeek);

    const num = w => (w.acts || []).filter(x => x.type === 'theme-beat')
      .map(x => (x.line.match(/\b[Ww]eek (\d+)/) || [])[1]).filter(Boolean);
    for (const n of [...num(wkA), ...num(wkB)]) {
      expect(Number(n), 'a half-week announced its own week number').toBe(wkA.themeWeek);
    }

    // And the two halves are not handed the identical script. Seeding on
    // (theme, hook, mood, week) alone made that a certainty the moment both
    // sides agreed on the week.
    const line = (w, hook) => (w.acts || [])
      .find(x => x.type === 'theme-beat' && x.hook === hook)?.line;
    const shared = ['open', 'noms', 'veto', 'vote']
      .filter(h => line(wkA, h) && line(wkA, h) === line(wkB, h));
    expect(shared, `both sides heard the same line at: ${shared.join(', ')}`).toEqual([]);
  });

  it('never names a houseguest who left in an earlier week', () => {
    // Not a unit call: the wiring in _themeSay is the half that can rot, and
    // the guard's whole purpose is that the Den does not taunt the departed.
    house();
    let spoke = 0;
    withSeededRandom(404, () => {
      for (let w = 0; w < 4; w++) {
        const gone = [...(gs.eliminated || [])];
        const ep = simulateBBEpisode();
        if (!ep) break;
        for (const b of (ep.acts || []).filter(a => a.type === 'theme-beat')) {
          spoke++;
          for (const name of gone) {
            expect(b.line, `${name} was named after leaving`).not.toContain(name);
          }
        }
      }
    });
    expect(spoke, 'the Den never spoke at all').toBeGreaterThan(3);
  });
});
